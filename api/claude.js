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
//     - One quick retry on Opus 4.8 (handles transient 5xx)
//     - On any continued failure, immediately fall back to Sonnet 4.6
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

function attemptTimeoutMs(model, attempt) {
  if (model === 'claude-opus-4-8') {
    // Best-quality path first: give Opus the longest shot, but do not let it
    // consume the whole serverless function before Sonnet can rescue the run.
    return attempt === 0 ? 30000 : 8000;
  }
  return 12000;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, { error: { message: 'Method not allowed' } }, 405);
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
    const upstream = await callAnthropic(apiKey, bodyText);
    return sendUpstream(res, upstream, {
      'content-type': upstream.headers.get('content-type') || 'text/event-stream',
      'cache-control': 'no-cache',
    });
  }

  // Non-streaming (insights, résumé, more paths). Two-attempt strategy on the
  // requested model, then one swap to the fallback model with two more
  // attempts, all clamped to TIME_BUDGET_MS total.
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
        // If Opus stalls, do not spend another long attempt on the same path.
        // Move to Sonnet while there is still enough time to finish.
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
