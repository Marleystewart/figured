# 4ward — Handoff Doc

*Use this to bring a new chat session (or a collaborator) up to speed without re-explaining the build. Paste it as your first message or point the model at it.*

---

I'm Marley. I'm building **4ward** — an honest career trajectory tool for college students. You're picking up mid-build. Here's everything you need to be useful from message one.

## The product, in one paragraph

A student enters their major, GPA, school, year, time-left, activities, experience, skills, and goal. 4ward gives them an **honest snapshot** of where their path is actually leading, three **paths that fit their profile**, a **Gap Analyzer** (skills/experience/exposure/mindset framed as "what it takes," never as a judgment), a **30/60/90 action plan**, **opportunities** (LinkedIn + Indeed job links generated from their goal), **connections** (opted-in mentors + Google-search fallback), an **Ask 4ward chat mentor** powered by Claude, a **résumé upload** that Claude reads, prefills, and reviews, and an **over-time loop** — they check off actions and log wins that land on their **Timeline**.

The whole product is a **mirror, not a report card.** No scores. No grades. The voice is honest without being brutal. Mentor, not machine.

## Stack

- **Static HTML/CSS/vanilla JS.** No build step. No framework.
- **AI layer:** `ai.js` calls the Anthropic API directly from the browser using a key the user pastes in-app (stored in localStorage). Model: `claude-opus-4-8`. Adaptive thinking + JSON schema output for insights, streaming for chat.
- **No backend yet.** All persistence is localStorage (`figuredProfile`, `figuredAiContent`, `figuredWins`, `figuredChecked`, `figuredApiKey`, `figuredMentors`, `figuredResumeFeedback`). Real accounts + backend are the natural next phase.

## Files

```
index.html        landing page
onboarding.html   4-step intake (Build My Path = ?fresh=1, Edit profile = ?edit=1)
onboarding.js     handles prefill, résumé upload, "Building your trajectory…" interstitial
app.html          the student dashboard
script.js         dashboard logic: fallback content, AI orchestration, chat, win-log, timeline
ai.js             Claude integration (generateInsights, chatStream, parseResume)
mentor.html       mentor opt-in form
mentor.js         saves opted-in mentors to localStorage
styles.css        full design system
README.md         public-facing
HANDOFF.md        this file
plan/index.html   12-month founder plan page (+ plan.css), live at /plan/
prompts/startup-plan.md   reusable 12-month startup plan prompt
.gitignore        excludes junk + system files
```

**Cache-busting:** app.html loads `ai.js?v=3` and `script.js?v=3`; onboarding.html loads `onboarding.js?v=4`. When you change those JS files, bump the `?v=N` or browsers serve the stale version.

## Where it lives

- **Repo (public):** github.com/Marleystewart/figured
- **Live URL:** figured-almar.vercel.app
- **Local dev:** `python3 -m http.server 4174` in the project root, then http://localhost:4174
- **Deploy:** Vercel auto-deploys every push to `main`. Alex is a collaborator (he can push too).

## Design language

- Deep forest green primary (`--sage-deep: #2f5a4f`), warm off-white canvas (`--canvas: #f6f4ee`), paper card backgrounds
- Inter font, 800-weight headlines
- Mobile-first; nav becomes a horizontal pill row at ≤820px
- `prefers-reduced-motion` is respected

## Hard rules baked into 4ward's voice

- **Never suggest a less ambitious path than the student stated.** Adjacent tracks are equal or upward.
- **Every gap is framed as "here's what it takes," never "here's what you lack."**
- **Never imply a score or grade.** Bars/rings/percentages were intentionally removed in favor of priority labels (Focus first / Building / Strength).
- **No em dashes or dashes as punctuation in chat replies.** They read as AI.
- **Chat replies are 60–100 words, one paragraph by default**, max_tokens capped at 280.
- **Vary the closing** — sometimes a next move, sometimes a sharp question, sometimes one honest sentence of belief. Never the same shape twice.

## What's built and verified

| Feature | Status |
|---|---|
| Landing page + onboarding + dashboard | Live |
| Goal-aware rule-based fallback content (sports/product/finance/etc.) | Live |
| Claude insights (JSON schema: headline, body, 3 tracks, gaps, 4 actions, 30/60/90 plan, bridge, focus, timeline) | Live |
| Ask 4ward chat (streaming, profile-aware, guardrailed to her path only) | Live, voice tuned |
| Résumé upload → Claude parses → prefills form + gives improvement feedback | Live |
| Opted-in mentor system (`mentor.html` → "✓ On 4ward" direct-link cards, archetype fallback with Google search) | Live |
| Over-time loop: persistent action check-offs with progress bar, "Log a win" → Timeline with date | Live |
| Timeline derived from real profile (no fabricated months) | Live |
| Mobile shell (horizontal pill nav, content above the fold at 375px) | Live |
| Conversational onboarding (personalized eyebrows by name, "Building your trajectory, [name]…" interstitial) | Live |
| Micro-interactions (hover lift, staggered card entrance, press states, reduced-motion guard) | Live |
| Button text alignment (anchor vs button) | Live |
| Build My Path resets (blank form + clears prev person's wins/checkmarks); Edit profile prefills | Live |
| AI "thinking" state (shows "Reading your trajectory…" skeleton on snapshot + paths instead of flashing the weaker rule-based version; loading→great, not okay→great; restores fallback on AI error) | Live |
| "↻ More" refresh button on the Paths card (AI: `generateMorePaths` returns 3 fresh paths excluding ones already shown; no-AI: rotates a transferable-adjacents pool) | Live |
| Chat voice tuned: 60–100 words, one paragraph, no em dashes, varied closings, `max_tokens` 280 | Live |
| `/plan/` — 12-month founder operating system page (sticky TOC, financials, KPIs, roadmap; grounded in real $20/mo budget) | Live |

## What's still on the polish list

- **Sharpen the landing page** (`index.html`) — still has some old example copy that doesn't fully match the rest of the product's voice. This is the main remaining polish item.
- **Empty/curation states** — opportunities and connections feel slightly generic; "curated" framing copy would help.
- **Mentor intake reachability** — `mentor.html` exists but isn't linked from a prominent place for actual mentors to find.

## Considered but deferred (intentional, not forgotten)

- **Web search** for the chat (would ground answers in current data, but adds 2–5s latency, ~1–4¢/msg, and risks diluting mentor voice into search-engine voice). Recommendation: ship to 5 real students first and let them tell us if grounding matters more than the mentor voice.
- **Real accounts + backend** — the natural next phase. localStorage is the bridge; a backend moves API keys + mentor list + profiles server-side.
- **Resume backend storage** — currently only browser-local.

## Important context about Marley

- Marley's own demo profile is sports management at Duke aiming for NBA basketball operations. Use that as the test case for anything you build, it's the hardest test of the "honest, never less ambitious, never generic" rules because it's a non-traditional goal that most career tools fumble.
- The voice tuning is *recent and intentional*. The Ask 4ward chat was producing ~180-word replies with em dashes and identical closings. That was tightened. Don't undo it.
- **Alex is the co-founder** and a GitHub collaborator (he can push to the repo; Vercel auto-deploys his pushes too).
- **Go-to-market is underway.** Marley is meeting a Trinity College career-center advisor to pitch 4ward and try to land Trinity as the first school. The play: walk in humble ("help me figure out if this is real"), demo the Honest Take + Ask 4ward, ask what it'd take for the school to endorse it. Don't bring a deck or pricing to that first meeting.
- **Budget reality:** two broke college students. ~$20/month (the Claude subscription) plus a few dollars for a domain. Keep every recommendation scrappy and free-tier-first.

## Things to *not* do

1. **Never reintroduce numeric scores, percentage bars, or grading.** Those were intentionally removed. It's a mirror, not a report card.
2. **Never put API keys in committed code.** The repo is public. Keys live in user browsers via the "Connect AI" flow.
3. **Don't add web search to chat without an explicit go.** That's a deliberate held decision.
4. **Don't suggest a less ambitious path as "more realistic."** That's the cardinal sin of every other career tool, it's what 4ward exists to fix.
5. **Don't strip the conversational onboarding into a plain form.** The personalized eyebrows ("Nice to meet you, Marley") and "Building your trajectory…" interstitial are part of the product feel.

## How Marley likes to work

- Honest assessments, not cheerleading. If something is weak, say so. If something is overbuilt, push back.
- Verify before claiming done. Show real proof (screenshot, eval result, etc.), not "looks good."
- One thing at a time, well, beats a batch of half-done.
- Commit + push as you go (small clean commits with a `Co-Authored-By` line). Repo is public so secret-scan before publishing anything new.
- Cache-bust script tags (`?v=N`) when JS changes ship, or the browser holds the old file.

## Reusable prompts

- [`prompts/startup-plan.md`](./prompts/startup-plan.md) — the 12-month startup business plan prompt. Use it whenever Marley wants a McKinsey/YC-grade execution roadmap for a new business idea. Fill in the BUSINESS INFORMATION block before running.

## What Marley might ask next

Most likely one of: (a) finish the polish pass (AI loading states + landing page sharpening), (b) help test the chat with deeper questions, (c) start the accounts/backend phase, or (d) something not on the list yet.

**Start by acknowledging you've got this context, then ask what to work on. Don't dump a plan, just be ready.**
