// 4ward — Claude AI layer
//
// Requests go through our own Vercel serverless function (api/claude.js),
// which adds the ANTHROPIC_API_KEY server-side. Students never need their
// own key — they just open 4ward and it works.
//
// A legacy "bring your own key" path is still here for local development:
// if a key has been pasted into the (now hidden) Connect AI modal, requests
// go directly to Anthropic instead of through the proxy. Useful when running
// `python3 -m http.server` locally where the Vercel function isn't available.

const FigAI = (() => {
  const KEY_STORE = 'figuredApiKey';
  const PROXY_URL = '/api/claude';
  const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
  // Opus for the trajectory generation: the voice quality and depth are the
  // whole product. Sonnet for structured extraction work (résumé parsing) and
  // for the "more paths" refresh — both are short, well-shaped tasks where
  // Sonnet matches Opus output and runs 3x faster with 5x lower cost.
  const MODEL = 'claude-opus-4-8';
  const SONNET = 'claude-sonnet-4-6';
  // Haiku for the résumé parser: structured extraction plus short feedback is
  // exactly what Haiku is built for. ~2x faster than Sonnet, ~10x cheaper.
  const HAIKU = 'claude-haiku-4-5-20251001';

  const getKey = () => localStorage.getItem(KEY_STORE) || '';
  const setKey = (k) => {
    if (k && k.trim()) localStorage.setItem(KEY_STORE, k.trim());
    else localStorage.removeItem(KEY_STORE);
  };
  // Pasted-key mode (admin/local dev). Anyone using the deployed site
  // automatically uses the proxy.
  const usingBYOK = () => Boolean(getKey());
  const isLocalPreview = () => ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  // With the proxy in place, AI is always available to deployed students.
  // Local static preview cannot run /api/claude, so skip AI there unless a
  // developer pasted a key for direct Anthropic testing.
  const hasKey = () => usingBYOK() || !isLocalPreview();
  const endpoint = () => (usingBYOK() ? ANTHROPIC_URL : PROXY_URL);
  const headers = () => {
    if (usingBYOK()) {
      return {
        'x-api-key': getKey(),
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      };
    }
    return { 'content-type': 'application/json' };
  };

  async function apiError(res) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error && data.error.message) msg = data.error.message;
    } catch { /* keep default */ }
    if (res.status === 401) msg = 'That API key was rejected. Check it and reconnect.';
    const err = new Error(msg);
    err.status = res.status;
    return err;
  }

  const IMPACT = { type: 'string', enum: ['High impact', 'Medium impact', 'Foundational'] };
  const gapItems = {
    type: 'array',
    items: {
      type: 'object',
      properties: { item: { type: 'string' }, impact: IMPACT },
      required: ['item', 'impact'],
      additionalProperties: false,
    },
  };
  const planItems = {
    type: 'array',
    items: {
      type: 'object',
      properties: { title: { type: 'string' }, detail: { type: 'string' }, impact: IMPACT },
      required: ['title', 'detail', 'impact'],
      additionalProperties: false,
    },
  };

  const INSIGHTS_SCHEMA = {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      body: { type: 'string' },
      tracks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            role: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['label', 'role', 'reason'],
          additionalProperties: false,
        },
      },
      gaps: {
        type: 'object',
        properties: {
          skills: gapItems,
          experience: gapItems,
          exposure: gapItems,
          mindset: gapItems,
        },
        required: ['skills', 'experience', 'exposure', 'mindset'],
        additionalProperties: false,
      },
      actions: { type: 'array', items: { type: 'string' } },
      plan: {
        type: 'object',
        properties: { d30: planItems, d60: planItems, d90: planItems },
        required: ['d30', 'd60', 'd90'],
        additionalProperties: false,
      },
      bridge: {
        type: 'object',
        properties: {
          now: { type: 'string' },
          destination: { type: 'string' },
          bridge: { type: 'string' },
        },
        required: ['now', 'destination', 'bridge'],
        additionalProperties: false,
      },
      focus: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            area: { type: 'string' },
            status: { type: 'string', enum: ['focus', 'building', 'strength'] },
            note: { type: 'string' },
          },
          required: ['area', 'status', 'note'],
          additionalProperties: false,
        },
      },
      timeline: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            when: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['when', 'text'],
          additionalProperties: false,
        },
      },
    },
    required: ['headline', 'body', 'tracks', 'gaps', 'actions', 'plan', 'bridge', 'focus', 'timeline'],
    additionalProperties: false,
  };

  const INSIGHTS_SYSTEM = `You are 4ward, a personal trajectory tool for college students. You take an honest look at where a student is headed based on what they are actually doing right now, and tell them the truth about the path: what it takes, what is possible, and exactly what to do next. Voice: honest without being brutal. Mentor, not machine.

Hard rules:
1. Never suggest a path less ambitious than the student's stated goal. Adjacent tracks must be equal or upward moves that genuinely fit their profile.
2. Frame every gap as "here's what it takes", never "here's what you're missing". No judgment language, no scores, no verdicts.
3. Every section ends pointed at action.
4. Be specific to THIS student. Reference their actual major, school, experience, activities, and goal. Generic advice is failure.
5. headline: max 70 characters, punchy, no student name, forward-looking.
6. body: 2-3 sentences. Name their real strengths first, then the single highest-leverage move.
7. tracks: exactly 3. First one: label "Your goal", role = their goal cleaned into a crisp role/field title (max 40 chars), reason tied to their real strengths. Then one "Adjacent path" and one "Also worth exploring" — both genuinely reachable from their profile.
8. gaps: 3-4 items per category. skills = what to learn, experience = what to do, exposure = what to see/who to meet, mindset = how to think. Each specific to their goal and current profile.
9. actions: exactly 4 short checkbox-style actions they could start this week.
10. plan: exactly 3 items per period (d30/d60/d90), concrete and doable for a college student with classes. Build on each other.
11. bridge: "now" = one honest sentence about where they are today using their real details. "destination" = one sentence about where they want to go. "bridge" = one sentence naming what connects the two.
12. focus: exactly 4 items, one per area, with area named exactly "Academic Progress", "Relevant Experience", "In-Demand Skills", and "Network Strength". status is a PRIORITY, never a grade: "focus" = highest-leverage area to work on next, "building" = in progress, keep going, "strength" = already working for them. At least one area must be "focus" so there is always a next move; do not mark everything a strength. note = one short, specific sentence (max 8 words) on why it has that status for THIS student. This replaces any numeric score — never imply a number or rating.
13. timeline: 4-5 entries tracing their real arc, oldest to newest. "when" = a short phase label, NOT a fabricated date (e.g. "The start", "What you've built", "Right now", "This term", "By graduation"). "text" = one sentence per phase using their actual major, school, activities, experience, and goal. The earliest entries reflect what they have genuinely done; the later ones are forward-looking. Never invent specific events or months they didn't tell you.
14. US college context. Plain language. No emoji, no markdown.
15. Never use corporate jargon or generic filler: no "in today's competitive landscape", no "leverage your strengths", no "synergy", no "robust", no "holistic approach", no "fast-paced environment." Speak like a real mentor talking to a real student. Direct, warm, specific to them.
16. NEVER use em dashes ("—") or any dash as punctuation in any text field. They read as AI-written and break the human voice. Use periods, commas, colons, semicolons, or two short sentences. The ONLY acceptable dash is the en dash inside numeric ranges like "$110k–$130k". Apply this to every text field: headline, body, gaps, actions, plan, bridge, focus notes, timeline. Re-read every sentence and replace any em dash before responding.`;

  async function generateInsights(profile) {
    const highSchoolContext = profile && profile.schoolStage === 'highSchool'
      ? '\n\nHigh school mode: This student is not in college yet. Do not assume a declared college major, internships, or a fixed career. Focus on future direction, majors that fit, college types that fit, high school actions, classes, activities, affordability, support, and exploration. Pay special attention to priorityConcern, collegeInterest, collegePrefs, costComfort, supportLevel, classesLiked, and worries when deciding next actions. If costComfort says cost is a major concern, include affordability and financial aid fit. If supportLevel says they are figuring it out alone or need help, include counselor or adult support steps. "tracks" should be majors or directions that fit. "actions" should be high-school-appropriate next steps. Keep the same honest mentor voice.'
      : '';
    const body = {
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      // Prompt caching: INSIGHTS_SYSTEM is ~3k tokens and identical every call,
      // so cache it. Saves ~80% of the cached input cost and a few seconds of
      // re-processing latency. Zero output impact.
      system: [{ type: 'text', text: INSIGHTS_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: 'Student profile:\n' + JSON.stringify(profile, null, 2) +
          highSchoolContext +
          '\n\nGenerate this student\'s trajectory insights as JSON.',
      }],
      // Keep this at high for the strongest possible trajectory quality.
      // The onboarding interstitial gives students something useful to do
      // while the fuller structured analysis finishes.
      output_config: { effort: 'high', format: { type: 'json_schema', schema: INSIGHTS_SCHEMA } },
    };
    const res = await fetch(endpoint(), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) throw await apiError(res);
    const msg = await res.json();
    const textBlock = (msg.content || []).find((b) => b.type === 'text');
    if (!textBlock) throw new Error('No content returned.');
    return JSON.parse(textBlock.text);
  }

  // Streaming chat. onDelta receives the full accumulated text on each chunk.
  async function chatStream(system, messages, onDelta) {
    const body = {
      model: MODEL,
      // Hard ceiling on chat reply length. 60–100 words ≈ ~80–135 tokens.
      // 280 leaves room for adaptive thinking + a tight reply, never a wall of text.
      max_tokens: 280,
      stream: true,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      // Cache the (constant) chat system prompt passed in by the caller.
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
    };
    const res = await fetch(endpoint(), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) throw await apiError(res);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        let ev;
        try { ev = JSON.parse(payload); } catch { continue; }
        if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
          full += ev.delta.text;
          onDelta(full);
        }
        if (ev.type === 'error') {
          throw new Error((ev.error && ev.error.message) || 'Stream error.');
        }
      }
    }
    return full;
  }

  // --- Résumé reading + review ---
  const RESUME_SCHEMA = {
    type: 'object',
    properties: {
      major: { type: 'string' },
      school: { type: 'string' },
      experience: { type: 'array', items: { type: 'string' } },
      activities: { type: 'array', items: { type: 'string' } },
      skills: { type: 'array', items: { type: 'string' } },
      feedback: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            detail: { type: 'string' },
          },
          required: ['title', 'detail'],
          additionalProperties: false,
        },
      },
    },
    required: ['major', 'school', 'experience', 'activities', 'skills', 'feedback'],
    additionalProperties: false,
  };

  const RESUME_SYSTEM = `You are 4ward, an honest but encouraging mentor reading a college student's résumé. Two jobs:

1. EXTRACT what's really on the résumé into the schema. Do not invent anything. If a field isn't present, return an empty string or empty array.
   - experience: each entry as a short line like "Role, Organization (dates)".
   - activities: clubs, teams, leadership, volunteering — one short line each.
   - skills: concrete skills/tools listed — one per item.
   - major / school: their current degree and institution if shown, else "".

2. REVIEW the résumé. feedback = 3-4 specific, actionable improvements in 4ward's voice: honest, warm, never harsh. Point at real things (weak bullet points, missing metrics, no clear summary, formatting, gaps for their apparent goal). Each: title = the fix in a few words, detail = one concrete sentence on how. If the résumé is strong, still give the next-level improvements. No generic filler. Plain text, no markdown.`;

  // fileData: base64 (PDF) or raw text (txt). Returns parsed profile + feedback.
  async function parseResume(fileData, mediaType) {
    let content;
    if (mediaType === 'application/pdf') {
      content = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } },
        { type: 'text', text: "Extract this student's résumé into the schema and give improvement feedback." },
      ];
    } else {
      content = [{ type: 'text', text: "Student résumé text:\n\n" + fileData + "\n\nExtract into the schema and give improvement feedback." }];
    }
    const body = {
      // Haiku 4.5 — structured extraction plus a few lines of feedback. ~2x
      // faster than Sonnet on this task, far more capacity headroom, and
      // dramatically cheaper. Voice rules still apply via the system prompt.
      model: HAIKU,
      max_tokens: 4000,
      system: [{ type: 'text', text: RESUME_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content }],
      output_config: { format: { type: 'json_schema', schema: RESUME_SCHEMA } },
    };
    const res = await fetch(endpoint(), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) throw await apiError(res);
    const msg = await res.json();
    const textBlock = (msg.content || []).find((b) => b.type === 'text');
    if (!textBlock) throw new Error('No content returned.');
    return JSON.parse(textBlock.text);
  }

  // --- "More paths" refresh on the Paths card ---
  const PATHS_SCHEMA = {
    type: 'object',
    properties: {
      tracks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            role: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['label', 'role', 'reason'],
          additionalProperties: false,
        },
      },
    },
    required: ['tracks'],
    additionalProperties: false,
  };

  const PATHS_SYSTEM = `You are 4ward, an honest career mentor for college students. Return exactly 3 paths that fit this student's profile.

Rules:
- First path: label "Your goal", role = their stated goal cleaned into a crisp role or field title (max 40 chars), reason tied to their real strengths.
- Second path: label "Adjacent path". Third: label "Also worth exploring".
- The 2nd and 3rd must be GENUINELY DIFFERENT from any roles listed as already shown. Fresh options, not rewordings.
- Never suggest a path less ambitious than their goal. Adjacent paths are equal or upward moves that genuinely fit their profile.
- reason: one specific sentence on why it fits THIS student. No em dashes. No generic filler. Plain text.`;

  async function generateMorePaths(profile, existingRoles) {
    const body = {
      model: MODEL,
      max_tokens: 1200,
      // PATHS_SYSTEM is ~430 tokens, below Anthropic's 1024-token cache floor,
      // so cache_control is a silent no-op here. Kept for consistency in case
      // the prompt grows past the threshold later.
      system: [{ type: 'text', text: PATHS_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: 'Student profile:\n' + JSON.stringify(profile, null, 2) +
          '\n\nAlready shown (do NOT repeat these roles): ' + ((existingRoles || []).join(', ') || 'none') +
          '\n\nReturn 3 fresh paths as JSON.',
      }],
      output_config: { format: { type: 'json_schema', schema: PATHS_SCHEMA } },
    };
    const res = await fetch(endpoint(), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) throw await apiError(res);
    const msg = await res.json();
    const textBlock = (msg.content || []).find((b) => b.type === 'text');
    if (!textBlock) throw new Error('No content returned.');
    return JSON.parse(textBlock.text).tracks;
  }

  return { getKey, setKey, hasKey, generateInsights, chatStream, parseResume, generateMorePaths };
})();
