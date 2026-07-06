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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute window
  const maxRequests = 20;

  // Prune memory if map size gets large to avoid leaks
  if (rateLimitMap.size > 5000) {
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + limitWindow });
    return true;
  }

  record.count++;
  if (record.count > maxRequests) {
    return false; // Rate limited
  }
  return true; // Allowed
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const clientIP = request.headers.get('CF-Connecting-IP') || 'anonymous';
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded. Try again in 60 seconds.' }), {
        status: 429,
        headers: CORS_HEADERS
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/sync/push' && request.method === 'POST') {
        return await handlePush(request, env);
      } 
      
      if (path === '/api/sync/pull' && request.method === 'POST') {
        return await handlePull(request, env);
      }

      return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), {
        status: 404,
        headers: CORS_HEADERS
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
  }
};

async function handlePush(request: Request, env: Env): Promise<Response> {
  const body: { recoveryHash: string; attempts: Attempt[] } = await request.json();
  const { recoveryHash, attempts } = body;

  if (!recoveryHash || !Array.isArray(attempts)) {
    return new Response(JSON.stringify({ error: 'Invalid Payload' }), {
      status: 400,
      headers: CORS_HEADERS
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
    headers: CORS_HEADERS
  });
}

async function handlePull(request: Request, env: Env): Promise<Response> {
  const body: { recoveryHash: string } = await request.json();
  const { recoveryHash } = body;

  if (!recoveryHash) {
    return new Response(JSON.stringify({ error: 'Invalid Recovery Hash' }), {
      status: 400,
      headers: CORS_HEADERS
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
    headers: CORS_HEADERS
  });
}
