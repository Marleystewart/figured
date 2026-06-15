# 4ward — Handoff Doc

*Paste this as your first message in a new chat, or point the model at it.*

---

I'm Marley. I'm building **4ward** — an honest career trajectory tool for college students. You're picking up mid-build. Here's everything you need to be useful from message one.

## The product, in one paragraph

A student enters their major, GPA, school, year, time-left, activities, experience, skills, and goal. 4ward gives them an **honest snapshot** of where their path is actually leading, three **paths that fit their profile**, a **Gap Analyzer** (skills/experience/exposure/mindset framed as "what it takes," never as a judgment), a **30/60/90 action plan**, a **"Today's move"** hero card (pulls the first un-checked action from their list), a **"What this path can pay"** comp card (goal-aware salary band + honest note), **opportunities** (LinkedIn + Indeed + Google Jobs links generated from their goal, with LinkedIn experience filters so a senior doesn't get senior-level role results), **connections** (opted-in mentors + Google-search fallback), an **Ask 4ward chat mentor** powered by Claude with an in-chat **"Update your trajectory?"** confirmation card when the conversation reveals a real profile shift, a **résumé upload** that Claude reads, prefills, and reviews, and an **over-time loop** — they check off actions and log wins that land on their **Timeline**.

The whole product is a **mirror, not a report card.** No scores. No grades. The voice is honest without being brutal. Mentor, not machine.

## Stack

- **Static HTML/CSS/vanilla JS.** No build step. No framework.
- **AI layer:** `ai.js` calls the Anthropic API directly from the browser using a key the user pastes in-app (stored in localStorage). Model: `claude-opus-4-8`. Adaptive thinking, `effort: 'high'`, JSON schema output for insights, streaming for chat (`max_tokens: 280`).
- **No backend yet.** All persistence is localStorage (`figuredProfile`, `figuredAiContent`, `figuredWins`, `figuredChecked`, `figuredApiKey`, `figuredMentors`, `figuredResumeFeedback`). Storage keys kept the `figured*` prefix during the rebrand on purpose — changing them would wipe everyone's local data.

## Files

```
index.html        landing page (4WARD logo image, hide-on-scroll-down header)
onboarding.html   4-step intake (Build My Path = ?fresh=1, Edit profile = ?edit=1)
onboarding.js     prefill, résumé upload, "Building your trajectory…" interstitial, Path Dash mini-game during the wait
schools.js        ~200 U.S. colleges for the school-field autocomplete (datalist)
app.html          the student dashboard
script.js         dashboard logic: fallback content, AI orchestration, chat (with profile-update card), win-log, timeline, today's move, comp card
ai.js             Claude integration (generateInsights at effort=high, chatStream, parseResume, generateMorePaths)
mentor.html       mentor opt-in form
mentor.js         saves opted-in mentors to localStorage
styles.css        full design system
assets/logo.png   the 4WARD logo (sized at 160px main / 140px sidebar)
plan/index.html   12-month founder plan page (+ plan.css), live at /plan/
prompts/startup-plan.md   reusable 12-month startup plan prompt
README.md         public-facing
HANDOFF.md        this file
.gitignore        excludes junk + system files (asset wildcard with explicit `!assets/logo.png` exception)
```

**Cache-busting:** when JS or CSS changes ship, bump the `?v=N` on script tags or browsers serve the stale version. Current versions on `app.html`: `ai.js?v=6`, `script.js?v=10`, `styles.css?v=13`. On `onboarding.html`: `ai.js?v=6`, `schools.js?v=1`, `onboarding.js?v=5`.

## Where it lives

- **Repo (public):** github.com/Marleystewart/figured (repo still named "figured" from before the rebrand — fine to leave)
- **Live URL:** figured-almar.vercel.app
- **Local dev:** `python3 -m http.server 4174` in the project root, then http://localhost:4174
- **Deploy:** Vercel auto-deploys every push to `main`. Alex is a collaborator (he can push too — coordinate so you don't force-push over each other).

## Design language

- Deep forest green primary (`--sage-deep: #2f5a4f`), warm off-white canvas (`--canvas: #f6f4ee`), paper card backgrounds
- Inter font, 800-weight headlines
- 4WARD logo image is the brand mark (not text). 160px in the landing header, 140px in the app sidebar
- Mobile-first; nav becomes a horizontal pill row at ≤820px
- `prefers-reduced-motion` is respected

## Hard rules baked into 4ward's voice

- **Never suggest a less ambitious path than the student stated.** Adjacent tracks are equal or upward.
- **Every gap is framed as "here's what it takes," never "here's what you lack."**
- **Never imply a score or grade.** Bars/rings/percentages were removed in favor of priority labels (Focus first / Building / Strength) and qualitative fit labels (Great fit / Strong fit / Worth a look).
- **No em dashes or dashes as punctuation.** They read as AI. Enforced two ways: (1) explicit rule in the insights system prompt, (2) defensive `stripDashes` post-processor in `script.js` that runs all AI content through it before display, so even if the model slips the user never sees one.
- **Chat replies are 60–100 words, one paragraph by default**, `max_tokens` capped at 280.
- **Vary the closing** — sometimes a next move, sometimes a sharp question, sometimes one honest sentence of belief. Never the same shape twice.
- **AI status is invisible to users.** "Connect AI", "AI insights live", and the status dot are hidden via CSS — to update a key, open the browser console and call `openKeyModal()`.

## What's built and verified

| Feature | Status |
|---|---|
| Landing page + onboarding + dashboard | Live |
| 4WARD logo + rebrand from "Figured" complete across all visible copy | Live |
| Hide-on-scroll-down landing header (reveals on scroll up) | Live |
| Goal-aware rule-based fallback content for sports/product/finance/software/marketing/consulting/design/founder/medicine/law/publishing/journalism/academia/nonprofit/government | Live |
| Claude insights at `effort: 'high'` (JSON schema: headline, body, 3 tracks, gaps, 4 actions, 30/60/90 plan, bridge, focus, timeline) | Live |
| Defensive em-dash strip on all AI output before rendering | Live |
| Ask 4ward chat (streaming, profile-aware, guardrailed to her path only, voice tuned) | Live |
| In-chat "Update your trajectory?" confirmation card — chat detects profile shifts via a hidden `[[update field=... value="..." why="..."]]` marker and renders an inline card with "Update my trajectory" / "Keep thinking" buttons; confirming writes to `figuredProfile` and re-renders | Live |
| "Today's move" hero card (sage-deep, pulls first un-checked action; "Mark done" syncs both ways with the action queue) | Live |
| "What this path can pay" comp card (per-domain salary band + honest note) | Live |
| LinkedIn opportunity URLs filtered by experience level (`f_E=1` for Internship card, `f_E=2` for Entry-level), with per-domain real entry titles (e.g. "Editorial Assistant" for publishing, "Research Assistant" for academia) | Live |
| Résumé upload → Claude parses → prefills form + gives improvement feedback | Live |
| Opted-in mentor system (`mentor.html` → "✓ On 4ward" direct-link cards, archetype fallback with Google search) | Live |
| Over-time loop: persistent action check-offs with progress bar, "Log a win" → Timeline with date | Live |
| Mobile shell (horizontal pill nav, content above the fold at 375px) | Live |
| Conversational onboarding with personalized eyebrows + "Building your trajectory, [Name]…" interstitial | Live |
| **Path Dash** mini-game inside the interstitial (engages the user during AI generation; perceived wait feels much shorter) | Live |
| 5-second MAX_SHOW cap on interstitial — if AI is still generating, navigate anyway; dashboard fallback content stays visible while AI completes in the background | Live |
| School field autocomplete (datalist of ~200 U.S. colleges in `schools.js`; students can still free-type) | Live |
| Name capitalization — "marley" / "MARLEY" → "Marley" in the greeting, profile card, and interstitial | Live |
| Career goal is a 4-row textarea with no character limit + gibberish detection that blocks obvious keyboard-mashing with an inline error | Live |
| `/plan/` — 12-month founder operating system page (sticky TOC, financials, KPIs, roadmap; grounded in real $20/mo budget) | Live |

## What's still on the polish list

- **Sharpen the landing page** (`index.html`) — still has placeholder copy in spots that doesn't fully match the product's voice. Main remaining polish item.
- **Empty/curation states** — opportunities and connections feel slightly generic; "curated" framing copy would help.
- **Mentor intake reachability** — `mentor.html` exists but isn't linked prominently for actual mentors to find.
- **Quality monitoring on AI output** — Alex restored `effort: 'high'` after a temporary `'medium'` experiment. If the trajectories ever start feeling thinner, that's the first knob to check (in `ai.js`, search for `effort`).

## Considered but deferred (intentional, not forgotten)

- **Web search** for the chat (adds 2–5s latency, ~1–4¢/msg, risks diluting mentor voice into search-engine voice). Ship to 5 real students first and let them tell us if grounding matters more than the voice.
- **Real accounts + backend** — the natural next phase. localStorage is the bridge; a backend moves API keys + mentor list + profiles server-side.
- **De-duping the AI call** between onboarding and dashboard when interstitial hits the 5s cap before AI finishes — currently the dashboard refires (one extra API call per slow generation). Acceptable cost for the UX win; optimize later if API spend matters.

## 5 test profiles to stress-test the voice

Run these through Build My Path to verify the rules hold. Each tests something different:

1. **Maya (Junior, Sports Management, Oregon, GPA 3.2)** — Goal: *NWSL/WNBA GM by 35.* Tests "never less ambitious" on a non-traditional goal.
2. **James (Sophomore, Undeclared, BU, GPA 3.6)** — Goal: *"Something in business, not sure yet."* Tests how the chat handles vagueness.
3. **Priya (Senior, CS, Rutgers, GPA 2.7)** — Goal: *Software engineer at Google/Meta/top startup.* Tests honest voice when reality is hard (low GPA, high ambition).
4. **Devon (Senior, English Lit, UNC, GPA 3.8, no experience)** — Goal: *Editorial assistant at a fiction imprint, NYC.* Tests late-stage scenario in a slow industry.
5. **Sam (Sophomore, Studio Art, SCAD, GPA 3.4)** — Goal: *Own a tattoo studio in Portland by 30.* Tests non-corporate goal with no traditional job-board path.

## Important context about Marley

- **Alex is the co-founder** and a GitHub collaborator. He can push to `main` directly and Vercel auto-deploys. Coordinate around force-pushes — there was an incident where his session force-pushed and wiped 15 commits; the recovery was a clean cherry-pick. Make sure both of you `git pull` before starting work.
- **Marley's demo profile** is sports management at Duke aiming for NBA basketball operations. Use that as the test case for anything you build — non-traditional goals are where 4ward earns its voice.
- **Voice tuning is recent and intentional.** Don't undo it. Specifically: no em dashes, 60–100 word chat replies, varied closings, never less ambitious paths.
- **Go-to-market is underway.** Marley is meeting a Trinity College career-center advisor to pitch 4ward and try to land Trinity as the first school. The play: walk in humble ("help me figure out if this is real"), demo the Honest Take + Ask 4ward, ask what it'd take for the school to endorse it. No deck, no pricing in the first meeting.
- **Budget reality:** two broke college students. ~$20/month (Claude subscription) plus a few dollars for a domain. Keep every recommendation scrappy and free-tier-first.

## Things to *not* do

1. **Never reintroduce numeric scores, percentage bars, or grading.** Mirror, not report card.
2. **Never put API keys in committed code.** The repo is public. Keys live in user browsers via the (hidden) `openKeyModal()` flow.
3. **Don't add web search to chat without an explicit go.** Deliberate held decision.
4. **Don't suggest a less ambitious path as "more realistic."** Cardinal sin of every other career tool — what 4ward exists to fix.
5. **Don't strip the conversational onboarding into a plain form.** The personalized eyebrows and Path Dash interstitial are part of the product feel.
6. **Don't change `figured*` localStorage keys.** They're internal, and renaming them wipes everyone's local data.
7. **Don't make the AI status indicators visible again.** Hidden on purpose — "mentor, not machine."

## How Marley likes to work

- Honest assessments, not cheerleading. If something is weak, say so. If something is overbuilt, push back.
- Verify before claiming done. Show real proof (screenshot, eval result, etc.), not "looks good."
- One thing at a time, well, beats a batch of half-done.
- Commit + push as you go (small clean commits with a `Co-Authored-By` line). Repo is public so secret-scan before publishing anything new.
- Cache-bust script tags (`?v=N`) when JS or CSS changes ship, or the browser holds the old file.

## Reusable prompts

- [`prompts/startup-plan.md`](./prompts/startup-plan.md) — the 12-month startup business plan prompt. Use it whenever Marley wants a McKinsey/YC-grade execution roadmap for a new business idea. Fill in the BUSINESS INFORMATION block before running.

## What Marley might ask next

Most likely one of: (a) finish the polish pass (landing page sharpening, empty-state copy), (b) help test with real students, (c) start the accounts/backend phase, (d) iterate on chat features or new profile patterns, or (e) something not on the list yet.

**Start by acknowledging you've got this context, then ask what to work on. Don't dump a plan, just be ready.**
