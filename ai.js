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
      explore: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          branches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                leaves: { type: 'array', items: { type: 'string' } },
              },
              required: ['name', 'leaves'],
              additionalProperties: false,
            },
          },
        },
        required: ['field', 'branches'],
        additionalProperties: false,
      },
      pay: {
        type: 'object',
        properties: {
          entry: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['entry', 'note'],
        additionalProperties: false,
      },
    },
    required: ['headline', 'body', 'tracks', 'gaps', 'actions', 'plan', 'bridge', 'focus', 'timeline', 'explore', 'pay'],
    additionalProperties: false,
  };

  const INSIGHTS_SYSTEM = `You are 4ward, a personal trajectory tool for college students. You take an honest look at where a student is headed based on what they are actually doing right now, and tell them the truth about the path: what it takes, what is possible, and exactly what to do next. Voice: honest without being brutal. Mentor, not machine.

Hard rules:
1. Never suggest a path less ambitious than the student's stated goal. Adjacent tracks must be equal or upward moves that genuinely fit their profile.
2. Frame every gap as "here's what it takes", never "here's what you're missing". No judgment language, no scores, no verdicts.
3. Every section ends pointed at action.
4. Be specific to THIS student. Reference their actual major, school, experience, activities, and goal. Generic advice is failure. If the profile includes self-awareness signals (enjoys = work that absorbs them, strengths = what people value in them, drains = work to avoid, priorities = what matters most to them right now such as the work itself, the people, the location, or the pay), weigh them heavily: adjacent paths and gaps should fit what energizes them, honor what they said matters most, and steer away from what drains them. You can reference these directly (e.g. "since you lose track of time doing X" or "since location matters most to you"). Treat them as real signal, never as a verdict.
5. headline: max 70 characters, punchy, no student name, forward-looking.
6. body: 2-3 sentences. Name their real strengths first, then the single highest-leverage move.
7. tracks: exactly 3. First one: label "Your goal", role = their goal cleaned into a crisp role/field title (max 40 chars), reason tied to their real strengths. Then one "Adjacent path" and one "Also worth exploring" — both genuinely reachable from their profile. Frame the adjacent and exploratory paths as possibilities, not verdicts: phrase reasons like "could suit you", "you may enjoy", or "often fits someone with your strengths". Never tell a student what they "should be", "are meant to do", or "are destined for". These are options to explore, not a label.
8. gaps: 3-4 items per category. skills = what to learn, experience = what to do, exposure = what to see/who to meet, mindset = how to think. Each specific to their goal and current profile.
9. actions: exactly 4 short checkbox-style actions they could start this week.
10. plan: exactly 4 items per period (d30/d60/d90), one concrete action for each week of that month, doable for a college student with classes. They build on each other week by week (d30 = weeks 1-4, d60 = weeks 5-8, d90 = weeks 9-12).
   EXPERIENCE-FIRST: lean the plan and actions heavily toward real-world experience that tests the path, not passive learning. Prioritize internships, job shadowing, informational interviews, projects, research, volunteering, clubs, competitions, and campus leadership over "watch a video", "read about it", or "take a class". A student learns whether they like something by doing it. At most one passive-learning item per period; the rest should put them in contact with the real work or real people.
11. bridge: "now" = one honest sentence about where they are today using their real details. "destination" = one sentence about where they want to go. "bridge" = one sentence naming what connects the two.
12. focus: exactly 4 items, one per area, with area named exactly "Academic Progress", "Relevant Experience", "In-Demand Skills", and "Network Strength". status is a PRIORITY, never a grade: "focus" = highest-leverage area to work on next, "building" = in progress, keep going, "strength" = already working for them. At least one area must be "focus" so there is always a next move; do not mark everything a strength. note = one short, specific sentence (max 8 words) on why it has that status for THIS student. This replaces any numeric score — never imply a number or rating.
13. timeline: 4-5 entries tracing their real arc, oldest to newest. "when" = a short phase label, NOT a fabricated date (e.g. "The start", "What you've built", "Right now", "This term", "By graduation"). "text" = one sentence per phase using their actual major, school, activities, experience, and goal. The earliest entries reflect what they have genuinely done; the later ones are forward-looking. Never invent specific events or months they didn't tell you.
13b. explore: a discovery map of how THEIR field branches. "field" = the broad field name (from their major/goal, e.g. "Economics", "Psychology", "Sports"). "branches" = exactly 3 sub-areas within that field, each with "leaves" = 3-4 specific niche roles. ACCURACY IS CRITICAL: branches and leaves must realistically fit this student's actual major, interests, and goal. An Economics major must branch into economics-adjacent areas (e.g. Finance, Data & Analytics, Policy & Research, Consulting), NEVER into Law, Medicine, or Software unless their stated goal clearly points there. A Psychology major branches into psychology-adjacent areas (e.g. Clinical & Counseling, Research, HR & People, UX Research), NEVER into unrelated fields. When unsure, stay broad and field-true rather than guessing a specific unrelated career.
13c. pay: realistic entry pay for THIS student's actual goal and field. "entry" = a starting salary range like "$55k–$75k" (use the en dash in the range). "note" = one honest sentence of context. The range must match their real target field, never a default or an unrelated field's pay. If the goal is genuinely too varied to estimate, set entry to "varies by path" and explain in the note.
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
      // Keep this at high for the strongest possible trajectory quality (matters
      // most for advisor demos). Reliability under the Vercel Hobby 60s limit is
      // handled WITHOUT dropping quality: a silent client-side auto-retry on
      // transient timeouts/overload (see maybeRunAI) plus the proxy's Sonnet
      // safety net. The onboarding interstitial covers the wait.
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
      // Ceiling on chat reply length. The prompt controls actual length adaptively
      // (tight ~60-100 words for simple questions, longer for "how do I get into X"
      // roadmaps). 600 gives headroom for a sequenced roadmap without a wall of text.
      max_tokens: 600,
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
      summary: { type: 'string' },
      review: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            area: { type: 'string' },
            status: { type: 'string', enum: ['Strong', 'Building', 'Needs work', 'Missing'] },
            note: { type: 'string' },
          },
          required: ['area', 'status', 'note'],
          additionalProperties: false,
        },
      },
      verbSwaps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
          },
          required: ['from', 'to'],
          additionalProperties: false,
        },
      },
      rewrites: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            before: { type: 'string' },
            after: { type: 'string' },
          },
          required: ['before', 'after'],
          additionalProperties: false,
        },
      },
      keywords: { type: 'array', items: { type: 'string' } },
    },
    required: ['major', 'school', 'experience', 'activities', 'skills', 'feedback', 'summary', 'review', 'verbSwaps', 'rewrites', 'keywords'],
    additionalProperties: false,
  };

  const RESUME_SYSTEM = `You are 4ward, an honest but encouraging mentor reading a college student's résumé. Do these jobs:

1. EXTRACT what's really on the résumé into the schema. Do not invent anything. If a field isn't present, return an empty string or empty array.
   - experience: each entry as a short line like "Role, Organization (dates)".
   - activities: clubs, teams, leadership, volunteering — one short line each.
   - skills: concrete skills/tools listed — one per item.
   - major / school: their current degree and institution if shown, else "".

2. feedback = 3-4 specific, actionable improvements in 4ward's voice: honest, warm, never harsh. Each: title = the fix in a few words, detail = one concrete sentence on how. (This is a short summary list; the deeper analysis goes in the fields below.)

3. summary = two honest sentences: the résumé's biggest strength, and the single highest-leverage thing to fix. Warm but direct.

4. review = evaluate these areas, each with a status LABEL (never a number or grade) and one concrete note. Cover, at minimum: "ATS readability" (parses cleanly, standard sections, no tables/columns that break parsers), "Bullet strength", "Quantified results" (numbers, %, scale), "Action verbs", "Keywords for their goal", "Formatting & length", "Leadership signals". status must be exactly one of: Strong, Building, Needs work, Missing.

5. verbSwaps = 3-6 weak verbs found on the résumé paired with a stronger replacement. from = the weak word actually used (e.g. "Helped"), to = a stronger verb (e.g. "Drove"). If none are weak, return an empty array.

6. rewrites = 2-3 of their actual weak bullet points rewritten stronger. before = the real bullet as written; after = a tighter, quantified, action-led version. Never fabricate numbers — if a metric is unknown, show a placeholder like "[X%]" so they fill it in.

7. keywords = skills or terms a student aiming for their goal should have but are missing from the résumé. Tailor to the goal given. 4-8 items.

Voice rules: honest and encouraging, never harsh, no numeric scores or letter grades anywhere, no em dashes, plain text (no markdown). If the résumé is strong, still give the next-level improvements.`;

  // fileData: base64 (PDF) or raw text (txt). opts: { goal, format, guidelines } so
  // keyword/rewrite suggestions are tailored and the review checks against the
  // student's chosen résumé format. Returns parsed profile + analysis.
  async function parseResume(fileData, mediaType, opts) {
    const o = opts || {};
    const goal = typeof o === 'string' ? o : o.goal; // back-compat: old callers passed goal directly
    const goalLine = goal ? `\n\nThe student's goal is: ${goal}. Tailor keywords and rewrites toward it.` : '';
    const hasTemplate = o.template && o.template.data;
    // An uploaded template is the strongest signal, then pasted rules, then the dropdown.
    const formatLine = (o.format && !hasTemplate && !o.guidelines)
      ? `\n\nThe student is following this résumé format: ${o.format}. In the "ATS readability" and "Formatting & length" review items, check the résumé against that format's conventions.` : '';
    const guideLine = o.guidelines ? `\n\nTheir school's career center publishes these résumé guidelines. Treat them as the source of truth for structure and sections, and call out where the résumé deviates:\n"""\n${o.guidelines}\n"""` : '';
    const templateLine = hasTemplate ? `\n\nThe student uploaded their school's official résumé template or sample (the second document). Treat its structure, section order, and formatting as the required format. In the review, call out specifically where the student's résumé does not match that template.` : '';
    const extra = goalLine + formatLine + guideLine + templateLine;

    const content = [];
    if (mediaType === 'application/pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } });
    } else {
      content.push({ type: 'text', text: "Student résumé text:\n\n" + fileData });
    }
    if (hasTemplate) {
      if (o.template.mediaType === 'application/pdf') {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: o.template.data } });
      } else {
        content.push({ type: 'text', text: "School résumé format template:\n\n" + o.template.data });
      }
    }
    content.push({ type: 'text', text: "Extract this student's résumé into the schema and give the full analysis." + extra });
    const body = {
      // Opus 4.8 — the résumé review is the highest-value, most-scrutinized AI
      // output, and it runs in the background while the student browses, so we
      // trade speed for accuracy and depth. Voice rules apply via the system prompt.
      model: MODEL,
      max_tokens: 5000,
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

  // --- "Next set" of weekly actions (when the checklist is done) ---
  const ACTIONS_SCHEMA = {
    type: 'object',
    properties: { actions: { type: 'array', items: { type: 'string' } } },
    required: ['actions'],
    additionalProperties: false,
  };
  async function generateMoreActions(profile, existing) {
    const body = {
      model: SONNET,
      max_tokens: 700,
      system: [{ type: 'text', text: 'You are 4ward, an honest career mentor. Return exactly 4 fresh, specific, highest-impact next actions a college student could start THIS WEEK toward their goal. Lean experience-first (reach out to a person, apply, build, shadow, join) over passive learning like watching videos. Each is one short imperative line. Do NOT repeat anything already done or shown. Plain text, no markdown, no em dashes.' }],
      messages: [{
        role: 'user',
        content: 'Student profile:\n' + JSON.stringify(profile, null, 2) +
          '\n\nAlready done or shown (do NOT repeat): ' + ((existing || []).join(' | ') || 'none') +
          '\n\nReturn 4 fresh actions as JSON.',
      }],
      output_config: { format: { type: 'json_schema', schema: ACTIONS_SCHEMA } },
    };
    const res = await fetch(endpoint(), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) throw await apiError(res);
    const msg = await res.json();
    const textBlock = (msg.content || []).find((b) => b.type === 'text');
    if (!textBlock) throw new Error('No content returned.');
    return JSON.parse(textBlock.text).actions;
  }

  // --- "More" gaps for the Gap Analyzer ---
  const GAP_ITEM = { type: 'object', properties: { item: { type: 'string' }, impact: { type: 'string' } }, required: ['item', 'impact'], additionalProperties: false };
  const GAPS_SCHEMA = {
    type: 'object',
    properties: {
      gaps: {
        type: 'object',
        properties: {
          skills: { type: 'array', items: GAP_ITEM },
          experience: { type: 'array', items: GAP_ITEM },
          exposure: { type: 'array', items: GAP_ITEM },
          mindset: { type: 'array', items: GAP_ITEM },
        },
        required: ['skills', 'experience', 'exposure', 'mindset'],
        additionalProperties: false,
      },
    },
    required: ['gaps'],
    additionalProperties: false,
  };
  async function generateMoreGaps(profile, existing) {
    const body = {
      model: SONNET,
      max_tokens: 1200,
      system: [{ type: 'text', text: 'You are 4ward, an honest career mentor. Return a fresh set of gaps for this student toward their goal: skills (what to learn), experience (what to do), exposure (what to see or who to meet), mindset (how to think). 3 items per category, each with an impact label like "High impact", "Medium impact", or "Foundational". Frame as "here is what it takes", never judgment. Do NOT repeat items already shown. Plain text, no markdown, no em dashes.' }],
      messages: [{
        role: 'user',
        content: 'Student profile:\n' + JSON.stringify(profile, null, 2) +
          '\n\nAlready shown (do NOT repeat): ' + ((existing || []).join(' | ') || 'none') +
          '\n\nReturn fresh gaps as JSON.',
      }],
      output_config: { format: { type: 'json_schema', schema: GAPS_SCHEMA } },
    };
    const res = await fetch(endpoint(), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) throw await apiError(res);
    const msg = await res.json();
    const textBlock = (msg.content || []).find((b) => b.type === 'text');
    if (!textBlock) throw new Error('No content returned.');
    return JSON.parse(textBlock.text).gaps;
  }

  return { getKey, setKey, hasKey, generateInsights, chatStream, parseResume, generateMorePaths, generateMoreActions, generateMoreGaps };
})();
