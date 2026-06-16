// 4ward — Anthropic API proxy.
//
// Lets students use 4ward without pasting their own API key. The browser POSTs
// the same Anthropic message body it used to send directly; this function
// adds our server-side ANTHROPIC_API_KEY and forwards to Anthropic, streaming
// the response straight back when the request asks for it.
//
// Set ANTHROPIC_API_KEY as a Vercel environment variable before deploying.
// Never commit a real key. The public repo would leak it instantly.

export const config = { runtime: 'edge' };

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

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

  const body = await req.text();

  // The browser flags streaming requests with `stream: true` in the body.
  // We need to know up front so we can pass the stream straight through.
  let isStream = false;
  try { isStream = JSON.parse(body).stream === true; } catch { /* keep false */ }

  const upstream = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body,
  });

  // Stream Server-Sent Events back to the browser as they arrive.
  if (isStream) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'text/event-stream',
        'cache-control': 'no-cache',
      },
    });
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { 'content-type': 'application/json' },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
