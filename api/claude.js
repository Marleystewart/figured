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
// Resilience: Anthropic returns 529 ("Overloaded") when capacity is short, and
// occasional 503s when something transient breaks upstream. We retry those with
// exponential backoff; if the user's preferred model stays overloaded, we fall
// back to the previous-generation Opus so the student still gets a real result.

export const config = { runtime: 'edge' };

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Tried in order when the preferred model is overloaded. Keeps voice quality
// close to Opus 4.8; we never silently fall to Sonnet for the structured
// trajectory call because the schema is sized for Opus output.
const MODEL_FALLBACK = {
  'claude-opus-4-8': 'claude-opus-4-7',
  'claude-opus-4-7': 'claude-opus-4-6',
};

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504, 529]);
const RETRY_DELAYS_MS = [600, 1500, 3500]; // 3 attempts after the initial call

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

  // Streaming responses can't be retried mid-flight without buffering, and chat
  // is the lowest-stakes call. Pass it through with no retry; if Anthropic
  // returns 5xx, the browser surfaces it and the student can resend.
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

  // Non-streaming (insights, résumé, more paths): retry on transient 5xx, then
  // fall back to the previous-generation Opus if the preferred model is still
  // overloaded. The model from the original request determines the fallback.
  let lastResponse = null;
  let lastBodyText = bodyText;
  let currentModel = bodyObj.model;

  while (true) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      const upstream = await callAnthropic(apiKey, lastBodyText);
      if (!RETRYABLE_STATUS.has(upstream.status)) {
        // Either a clean 200 or a non-retryable error: send it straight back.
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { 'content-type': 'application/json' },
        });
      }
      lastResponse = { status: upstream.status, text: await upstream.text() };
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
    // All retries on this model exhausted. Try the next model in the chain.
    const nextModel = MODEL_FALLBACK[currentModel];
    if (!nextModel) break;
    bodyObj.model = nextModel;
    currentModel = nextModel;
    lastBodyText = JSON.stringify(bodyObj);
  }

  // Fully exhausted: surface the last error to the browser so the user sees
  // a clear message instead of a silent failure.
  return new Response(lastResponse.text, {
    status: lastResponse.status,
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
