// 4ward — Anthropic API proxy.
//
// Lets students use 4ward without pasting their own API key. The browser POSTs
// the same Anthropic message body it used to send directly; this function
// adds our server-side ANTHROPIC_API_KEY and forwards to Anthropic, streaming
// the response straight back when the request asks for it.
//
// Set ANTHROPIC_API_KEY as a Vercel environment variable before deploying.
// Never commit a real key. The public repo would leak it instantly.
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

export const config = { runtime: 'edge' };

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Trajectory generation is the only place we silently fall back. Sonnet 4.6
// matches Opus 4.8 on schema compliance and on the 4ward voice rules; the
// only loss is some depth of analysis. Better than an error in the user's
// face. Chat and résumé already use their own dedicated models.
const PRIMARY_FALLBACK = {
  'claude-opus-4-8': 'claude-sonnet-4-6',
};

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504, 529]);
// Total wall-clock budget we're allowed to spend before the Edge function is
// killed. Leave headroom for response serialization.
const TIME_BUDGET_MS = 22000;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: { message: 'Method not allowed' } }, 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      { error: { message: 'Server is not configured. ANTHROPIC_API_KEY missing on Vercel.' } },
      500,
    );
  }

  const bodyText = await req.text();
  let bodyObj;
  try { bodyObj = JSON.parse(bodyText); } catch {
    return json({ error: { message: 'Invalid JSON in request body.' } }, 400);
  }
  const isStream = bodyObj.stream === true;

  // Streaming responses (chat) can't be retried mid-flight without buffering,
  // and chat is the lowest-stakes call. Pass it through; if Anthropic returns
  // 5xx, the browser surfaces it and the student can resend.
  if (isStream) {
    const upstream = await callAnthropic(apiKey, bodyText);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'text/event-stream',
        'cache-control': 'no-cache',
      },
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
      if (remaining() < 3000) break; // not enough time for another full call
      const upstream = await callAnthropic(apiKey, currentBody);
      if (!RETRYABLE_STATUS.has(upstream.status)) {
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { 'content-type': 'application/json' },
        });
      }
      lastResponse = { status: upstream.status, text: await upstream.text() };
      // Brief backoff before the second attempt on the same model. Skip if we
      // don't have time, so we get to the fallback model.
      if (attempt === 0 && remaining() > 5000) {
        await sleep(800);
      }
    }
    const next = PRIMARY_FALLBACK[currentModel];
    if (!next) break;
    bodyObj.model = next;
    currentModel = next;
    currentBody = JSON.stringify(bodyObj);
  }

  // Fully exhausted: surface the last error so the user sees a clear message.
  return new Response(lastResponse ? lastResponse.text : JSON.stringify({
    error: { message: 'Service is temporarily unavailable. Try again in a moment.' },
  }), {
    status: lastResponse ? lastResponse.status : 503,
    headers: { 'content-type': 'application/json' },
  });
}

async function callAnthropic(apiKey, body) {
  return fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body,
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
