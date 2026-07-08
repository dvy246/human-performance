export interface Env {
  DB: D1Database;
}

interface Attempt {
  id: string;
  testId: string;
  category: string;
  rawScore: number;
  percentile: number;
  metadata: string; // JSON string
  createdAt: number;
}

// SEC-03: Restrict CORS to known origins instead of wildcard '*'
const ALLOWED_ORIGINS = [
  'https://cogniarena.com',
  'https://www.cogniarena.com',
  'https://brain-bfn.pages.dev'
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json'
  };
}

// SEC-06: Payload size limits
const MAX_ATTEMPTS_PER_PUSH = 100;
const MAX_BODY_SIZE = 1_048_576; // 1 MB

// SEC-07: D1-backed rate limiting (persistent across cold starts)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  try {
    // Clean expired entries (best-effort, ignore errors)
    await env.DB.prepare(
      'DELETE FROM rate_limits WHERE reset_time < ?'
    ).bind(now).run();

    // Check current count for this IP
    const record = await env.DB.prepare(
      'SELECT count, reset_time FROM rate_limits WHERE ip = ? AND reset_time > ?'
    ).bind(ip, now).first<{ count: number; reset_time: number }>();

    if (!record) {
      await env.DB.prepare(
        'INSERT INTO rate_limits (ip, count, reset_time) VALUES (?, 1, ?)'
      ).bind(ip, now + RATE_LIMIT_WINDOW_MS).run();
      return true;
    }

    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
      return false; // Rate limited
    }

    await env.DB.prepare(
      'UPDATE rate_limits SET count = count + 1 WHERE ip = ? AND reset_time > ?'
    ).bind(ip, now).run();
    return true;
  } catch {
    // If rate limit table doesn't exist or DB is unavailable, allow the request
    // but log the error. The table should be created during setup.
    console.error('Rate limit check failed, allowing request:', ip);
    return true;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const clientIP = request.headers.get('CF-Connecting-IP') || 'anonymous';

    // SEC-07: Persistent rate limiting via D1
    const rateLimited = await checkRateLimit(env, clientIP);
    if (!rateLimited) {
      return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/sync/push' && request.method === 'POST') {
        return await handlePush(request, env, corsHeaders);
      } 
      
      if (path === '/api/sync/pull' && request.method === 'POST') {
        return await handlePull(request, env, corsHeaders);
      }

      return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), {
        status: 404,
        headers: corsHeaders
      });
    } catch (err: unknown) {
      // SEC-08: Log error details server-side, return generic message to client
      console.error('Sync Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

async function handlePush(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  // SEC-06: Check Content-Length header before parsing body
  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), {
      status: 413,
      headers: corsHeaders
    });
  }

  let body: { recoveryHash: string; attempts: Attempt[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  const { recoveryHash, attempts } = body;

  if (!recoveryHash || !Array.isArray(attempts)) {
    return new Response(JSON.stringify({ error: 'Invalid Payload' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // SEC-06: Validate attempts array length and D1 batch limit (max 100 statements)
  if (attempts.length > MAX_ATTEMPTS_PER_PUSH) {
    return new Response(JSON.stringify({
      error: `Too many attempts: maximum ${MAX_ATTEMPTS_PER_PUSH} per request`
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  const now = Date.now();

  // 1. Create or Update User Record
  await env.DB.prepare(
    `INSERT INTO users (id, created_at, last_sync_at) 
     VALUES (?, ?, ?) 
     ON CONFLICT(id) DO UPDATE SET last_sync_at = ?`
  )
    .bind(recoveryHash, now, now, now)
    .run();

  // 2. Batch insert attempts (ignoring existing ones via ON CONFLICT)
  if (attempts.length > 0) {
    const statements = attempts.map((attempt) => {
      const metadataStr = typeof attempt.metadata === 'string' 
        ? attempt.metadata 
        : JSON.stringify(attempt.metadata || {});

      return env.DB.prepare(
        `INSERT OR IGNORE INTO attempts (id, user_id, test_id, category, raw_score, percentile, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        attempt.id,
        recoveryHash,
        attempt.testId,
        attempt.category,
        attempt.rawScore,
        attempt.percentile,
        metadataStr,
        attempt.createdAt
      );
    });

    await env.DB.batch(statements);
  }

  return new Response(JSON.stringify({ success: true, count: attempts.length }), {
    headers: corsHeaders
  });
}

async function handlePull(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  // SEC-06: Check Content-Length
  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), {
      status: 413,
      headers: corsHeaders
    });
  }

  let body: { recoveryHash: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  const { recoveryHash } = body;

  if (!recoveryHash) {
    return new Response(JSON.stringify({ error: 'Invalid Recovery Hash' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Fetch all attempts for this hash
  const { results } = await env.DB.prepare(
    `SELECT id, test_id as testId, category, raw_score as rawScore, percentile, metadata, created_at as createdAt 
     FROM attempts 
     WHERE user_id = ? 
     ORDER BY created_at DESC`
  )
    .bind(recoveryHash)
    .all<Attempt>();

  return new Response(JSON.stringify({ success: true, attempts: results }), {
    headers: corsHeaders
  });
}
