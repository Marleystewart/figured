// 4ward — Anthropic API proxy.
//
// Lets students use 4ward without pasting their own API key. The browser POSTs
// the same Anthropic message body it used to send directly; this function
// adds our server-side ANTHROPIC_API_KEY and forwards to Anthropic, streaming
// the response straight back when the request asks for it.
//
// Set ANTHROPIC_API_KEY as a Vercel environment variable before deploying.
// Never commit a real key. The public repo would leak it instantly.
import { Readable } from 'node:stream';
//
// Resilience strategy (revised after a friend hit repeated failures):
//   The Vercel Edge function has a ~25s hard timeout on the Hobby tier. Opus
//   under heavy load can take ~25s by itself, so a long retry chain on Opus
//   will time out before we ever reach a fallback model. New plan:
//     - Start Opus 4.8 first so the best-quality result can win
//     - If Opus is still running after a short grace period, start Sonnet 4.6
//       in parallel as a safety net
//     - Sonnet has far more capacity and is roughly 3x faster, so it usually
//       lands in well under the remaining time budget.
//   Voice rules are entirely in the system prompt, so a Sonnet trajectory is
//   still on-brand — just slightly less rich than Opus. Always shipping a
//   real result beats a fancy result the user never sees.

// Use Vercel's Node.js serverless runtime, not Edge. Edge has a ~25s hard
// timeout on the Hobby tier, which Opus 4.8 can blow through on its own
// during overload — the function gets killed mid-fallback and the browser
// sees a 504. Node.js serverless gives us up to 60s on Hobby, which is
// plenty of room for the full Opus → Sonnet chain even on a slow day.
export const config = { maxDuration: 60 };

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Trajectory generation is the only place we silently fall back. Sonnet 4.6
// matches Opus 4.8 on schema compliance and on the 4ward voice rules; the
// only loss is some depth of analysis. Better than an error in the user's
// face. Chat and résumé already use their own dedicated models.
const PRIMARY_FALLBACK = {
  'claude-opus-4-8': 'claude-sonnet-4-6',
};

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504, 529]);
// Node.js serverless gives us a larger window than Edge. Use most of it, but
// leave headroom for response serialization so Vercel does not kill the
// function while we are returning the final result.
const TIME_BUDGET_MS = 55000;
const RESPONSE_HEADROOM_MS = 2500;
const FALLBACK_START_DELAY_MS = 9000;

function attemptTimeoutMs(model, attempt) {
  if (model === 'claude-opus-4-8') {
    // Best-quality path first: give Opus the longest shot, but do not let it
    // consume the whole serverless function before Sonnet can rescue the run.
    return attempt === 0 ? 30000 : 6000;
  }
  // Sonnet is the safety net after Opus stalls. Twelve seconds was too tight
  // under load and still produced visible errors, so give the fallback enough
  // room to finish inside the 60s Node serverless window.
  return attempt === 0 ? 22000 : 8000;
}

function fallbackBodyFor(bodyObj, model) {
  const copy = JSON.parse(JSON.stringify(bodyObj));
  copy.model = model;
  if (copy.output_config && typeof copy.output_config === 'object') {
    const { effort, ...rest } = copy.output_config;
    copy.output_config = rest;
  }
  if (copy.thinking) delete copy.thinking;
  if (typeof copy.max_tokens === 'number' && copy.max_tokens > 4096) {
    copy.max_tokens = 4096;
  }
  return JSON.stringify(copy);
}

// --- Abuse protection --------------------------------------------------------
// This proxy carries our server-side ANTHROPIC_API_KEY, so anything that can
// reach /api/claude can spend our Anthropic credits. 4ward is a public static
// site, so we can't hide the endpoint. Two cheap, backend-free guards cut off
// the easy abuse without a database:
//
//   1. Origin allowlist — a real 4ward page always sends an Origin header on
//      its POSTs (browsers attach Origin to every non-GET fetch, same-origin
//      included). Requests from another site, or from curl/scripts that send
//      no Origin, are rejected. This stops someone pointing their own page or
//      a script loop at our endpoint.
//   2. Per-IP rate limit — a sliding in-memory window throttles a single
//      client hammering the endpoint. It is BEST-EFFORT: Vercel runs many
//      serverless instances and recycles them, so the counter is per-instance
//      and resets on cold starts. It still meaningfully slows one abuser on a
//      warm instance and costs nothing.
//
// A hard, GLOBAL daily spend cap needs shared state (Vercel KV / Upstash) —
// in-memory can't enforce a real ceiling across instances. That's the next
// step if the app is widely distributed; origin + per-IP covers the casual
// abuse these guards target.

// Read a header in a way that works for both the Node serverless req (plain
// lowercase-keyed object) and the Edge/Fetch Request (Headers with .get()),
// mirroring the dual-runtime support the rest of this file already has.
function header(req, name) {
  const h = req && req.headers;
  if (!h) return '';
  if (typeof h.get === 'function') return h.get(name) || '';
  return h[name] || h[name.toLowerCase()] || '';
}

// Comma-separated hostnames allowed to call the proxy, overridable via the
// ALLOWED_ORIGIN_HOSTS Vercel env var. Same-host requests (Origin host ===
// request Host) are always allowed too, which covers the production custom
// domain and every *.vercel.app preview deploy automatically — so this list
// only needs the custom domain(s) and localhost.
const ALLOWED_ORIGIN_HOSTS = (process.env.ALLOWED_ORIGIN_HOSTS ||
  'getfwrd.co,www.getfwrd.co,localhost,127.0.0.1')
  .split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);

function hostFromUrl(value) {
  if (!value) return '';
  try { return new URL(value).hostname.toLowerCase(); } catch { return ''; }
}

function isAllowedOrigin(req) {
  const originHost = hostFromUrl(header(req, 'origin')) ||
    hostFromUrl(header(req, 'referer'));
  // No Origin/Referer at all → not a browser page load. Reject.
  if (!originHost) return false;
  if (ALLOWED_ORIGIN_HOSTS.includes(originHost)) return true;
  // Allow first-party requests where the page's origin matches the host the
  // function is served from (covers preview deployments without hardcoding).
  const requestHost = String(header(req, 'host')).toLowerCase().split(':')[0];
  return Boolean(requestHost) && originHost === requestHost;
}

// Per-IP sliding-window limiter. In-memory and per-instance by design — see
// the note above. Map<ip, number[]> of recent request timestamps. Limits are
// deliberately generous: a full onboarding→dashboard flow fires several calls
// (trajectory, résumé, extra paths, chat), so this only trips on flooding.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 60;                    // requests per window per IP
const ipHits = new Map();

function clientIp(req) {
  const fwd = header(req, 'x-forwarded-for');
  if (fwd) return String(fwd).split(',')[0].trim();
  return header(req, 'x-real-ip') || 'unknown';
}

function rateLimited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (ipHits.get(ip) || []).filter((t) => t > windowStart);
  hits.push(now);
  ipHits.set(ip, hits);
  // Opportunistic cleanup so the Map can't grow unbounded on a warm instance:
  // drop any IP whose newest hit has aged out of the window.
  if (ipHits.size > 5000) {
    for (const [key, times] of ipHits) {
      if (!times.length || times[times.length - 1] <= windowStart) ipHits.delete(key);
    }
  }
  return hits.length > RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, { error: { message: 'Method not allowed' } }, 405);
  }

  // Abuse guards run before any upstream call so a rejected request never
  // spends credits. Applies to both streaming (chat) and non-streaming paths.
  if (!isAllowedOrigin(req)) {
    return json(res, { error: { message: 'Forbidden.' } }, 403);
  }
  if (rateLimited(req)) {
    return json(res, { error: { message: 'Too many requests. Please wait a moment and try again.' } }, 429);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      res,
      { error: { message: 'Server is not configured. ANTHROPIC_API_KEY missing on Vercel.' } },
      500,
    );
  }

  const bodyText = await readBody(req);
  let bodyObj;
  try { bodyObj = JSON.parse(bodyText); } catch {
    return json(res, { error: { message: 'Invalid JSON in request body.' } }, 400);
  }
  const isStream = bodyObj.stream === true;

  // Streaming responses (chat) can't be retried mid-flight without buffering,
  // and chat is the lowest-stakes call. Pass it through; if Anthropic returns
  // 5xx, the browser surfaces it and the student can resend.
  if (isStream) {
    // Must pass an explicit timeout: callAnthropic does setTimeout(abort,
    // timeoutMs), and an undefined timeout coerces to 0ms, which aborts the
    // request the instant it starts and crashes the function. The timeout
    // only guards header arrival; once the stream's headers land it's cleared,
    // so a long stream is never cut off.
    let upstream;
    try {
      upstream = await callAnthropic(apiKey, bodyText, TIME_BUDGET_MS);
    } catch (e) {
      const timedOut = e && e.name === 'AbortError';
      return sendText(
        res,
        JSON.stringify({ error: { message: timedOut ? 'The request timed out. Try again.' : ((e && e.message) || 'Upstream request failed.') } }),
        timedOut ? 504 : 502,
        { 'content-type': 'application/json' },
      );
    }
    // A non-2xx upstream is an error JSON, not a valid SSE stream. Surface it
    // as JSON so the browser shows a clear message instead of a broken stream.
    if (upstream.status < 200 || upstream.status >= 300) {
      const text = await upstream.text();
      return sendText(res, text, upstream.status, { 'content-type': 'application/json' });
    }
    return sendUpstream(res, upstream, {
      'content-type': upstream.headers.get('content-type') || 'text/event-stream',
      'cache-control': 'no-cache',
    });
  }

  const fallbackModel = PRIMARY_FALLBACK[bodyObj.model];
  if (fallbackModel) {
    const result = await runPrimaryWithParallelFallback(apiKey, bodyText, fallbackBodyFor(bodyObj, fallbackModel), {
      primaryModel: bodyObj.model,
      fallbackModel,
    });
    if (result.ok) {
      return sendText(res, result.text, 200, { 'content-type': 'application/json' });
    }
    return sendText(res, result.text, result.status || 503, { 'content-type': 'application/json' });
  }

  // Non-streaming calls without a model fallback (résumé, more paths). Two
  // attempts on the requested model, clamped to TIME_BUDGET_MS total.
  const startedAt = Date.now();
  const remaining = () => TIME_BUDGET_MS - (Date.now() - startedAt);

  let currentBody = bodyText;
  let currentModel = bodyObj.model;
  let lastResponse = null;

  for (let phase = 0; phase < 2; phase++) {
    // Phase 0 = original model, phase 1 = fallback (if any).
    for (let attempt = 0; attempt < 2; attempt++) {
      const budgetForAttempt = Math.min(attemptTimeoutMs(currentModel, attempt), remaining() - RESPONSE_HEADROOM_MS);
      if (budgetForAttempt < 2000) break; // not enough time for another full call
      let upstream;
      try {
        upstream = await callAnthropic(apiKey, currentBody, budgetForAttempt);
      } catch (e) {
        const timedOut = e && e.name === 'AbortError';
        lastResponse = {
          status: timedOut ? 504 : 502,
          text: JSON.stringify({
            error: {
              message: timedOut
                ? `${currentModel} did not finish within ${Math.round(budgetForAttempt / 1000)}s.`
                : (e && e.message) || 'Upstream request failed.',
            },
          }),
        };
        // If a model stalls, do not spend another long attempt on the same
        // stuck path. Opus moves to Sonnet. Sonnet returns a clear final error
        // only after getting its full rescue window.
        if (timedOut || !RETRYABLE_STATUS.has(lastResponse.status)) break;
        if (attempt === 0 && remaining() > 5000) await sleep(800);
        continue;
      }
      // Success → return straight through.
      if (upstream.status >= 200 && upstream.status < 300) {
        const text = await upstream.text();
        return sendText(res, text, upstream.status, { 'content-type': 'application/json' });
      }
      // Any non-success: remember the response and either retry, or fall
      // back to the next model in the chain. We used to only retry/fallback
      // on 5xx; that meant a 400 (e.g. an Opus-only parameter rejected by a
      // future API change) returned immediately and the user never benefited
      // from the Sonnet fallback. Now ALL errors trigger the fallback path.
      lastResponse = { status: upstream.status, text: await upstream.text() };
      // Brief backoff only when the error is the kind that might clear with
      // a retry (5xx / 429). On 4xx, don't waste budget — go straight to
      // the fallback model.
      if (attempt === 0 && RETRYABLE_STATUS.has(upstream.status) && remaining() > 5000) {
        await sleep(800);
      } else if (!RETRYABLE_STATUS.has(upstream.status)) {
        break; // skip the in-model second attempt; the error won't change
      }
    }
    const next = PRIMARY_FALLBACK[currentModel];
    if (!next) break;
    bodyObj.model = next;
    currentModel = next;
    // Strip Opus-specific knobs when falling back. `effort: high` is an Opus
    // thinking parameter that can cause Sonnet to reject the request with a
    // non-retryable 400. We also clamp max_tokens to a Sonnet-safe ceiling.
    // The JSON schema and system prompt stay intact, so voice and structure
    // are preserved.
    if (bodyObj.output_config && typeof bodyObj.output_config === 'object') {
      const { effort, ...rest } = bodyObj.output_config;
      bodyObj.output_config = rest;
    }
    if (bodyObj.thinking) delete bodyObj.thinking;
    if (typeof bodyObj.max_tokens === 'number' && bodyObj.max_tokens > 4096) {
      bodyObj.max_tokens = 4096;
    }
    currentBody = JSON.stringify(bodyObj);
  }

  // Fully exhausted: surface the last error so the user sees a clear message.
  return sendText(res, lastResponse ? lastResponse.text : JSON.stringify({
    error: { message: 'Service is temporarily unavailable. Try again in a moment.' },
  }), lastResponse ? lastResponse.status : 503, { 'content-type': 'application/json' });
}

async function callAnthropic(apiKey, body, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
}

async function runPrimaryWithParallelFallback(apiKey, primaryBody, fallbackBody, labels) {
  const startedAt = Date.now();
  let fallbackStarted = false;
  let fallbackPromise = null;
  let settled = false;
  let lastError = null;

  const runOne = async (label, body, timeoutMs) => {
    try {
      const upstream = await callAnthropic(apiKey, body, timeoutMs);
      const text = await upstream.text();
      if (upstream.status >= 200 && upstream.status < 300) {
        return { ok: true, label, text };
      }
      return { ok: false, label, status: upstream.status, text };
    } catch (e) {
      const timedOut = e && e.name === 'AbortError';
      return {
        ok: false,
        label,
        status: timedOut ? 504 : 502,
        text: JSON.stringify({
          error: {
            message: timedOut
              ? `${label} did not finish within ${Math.round(timeoutMs / 1000)}s.`
              : (e && e.message) || `${label} request failed.`,
          },
        }),
      };
    }
  };

  const startFallback = () => {
    if (!fallbackPromise) {
      fallbackStarted = true;
      const elapsed = Date.now() - startedAt;
      const timeout = Math.max(12000, TIME_BUDGET_MS - elapsed - RESPONSE_HEADROOM_MS);
      fallbackPromise = runOne(labels.fallbackModel, fallbackBody, timeout);
    }
    return fallbackPromise;
  };

  const primary = runOne(labels.primaryModel, primaryBody, 50000);
  const fallback = sleep(FALLBACK_START_DELAY_MS).then(() => settled ? null : startFallback());

  const pending = [primary, fallback];
  while (pending.length) {
    const result = await Promise.race(pending.map((p, i) => p.then((value) => ({ value, i }))));
    pending.splice(result.i, 1);
    if (!result.value) continue;
    if (result.value.ok) {
      settled = true;
      return result.value;
    }
    lastError = result.value;
    if (!fallbackStarted && result.value.label === labels.primaryModel) {
      pending.push(startFallback());
    }
  }

  settled = true;
  return lastError || {
    ok: false,
    status: 503,
    text: JSON.stringify({ error: { message: 'Service is temporarily unavailable. Try again in a moment.' } }),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readBody(req) {
  if (typeof req.text === 'function') return req.text();
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding?.('utf8');
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function isNodeResponse(res) {
  return res && typeof res.setHeader === 'function' && typeof res.end === 'function';
}

function sendText(res, text, status = 200, headers = {}) {
  if (!isNodeResponse(res)) {
    return new Response(text, { status, headers });
  }
  res.statusCode = status;
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(text);
  return undefined;
}

function sendUpstream(res, upstream, headers = {}) {
  if (!isNodeResponse(res)) {
    return new Response(upstream.body, { status: upstream.status, headers });
  }
  res.statusCode = upstream.status;
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  if (upstream.body && Readable.fromWeb) {
    Readable.fromWeb(upstream.body).pipe(res);
    return undefined;
  }
  upstream.text().then((text) => res.end(text)).catch((e) => {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: { message: e.message || 'Upstream stream failed.' } }));
  });
  return undefined;
}

function json(res, obj, status = 200) {
  return sendText(res, JSON.stringify(obj), status, { 'content-type': 'application/json' });
}
