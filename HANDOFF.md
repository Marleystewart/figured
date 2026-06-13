# Figured — Handoff Doc

> Paste this at the start of a new chat, or tell Claude to `read HANDOFF.md`.

---

## The product, in one paragraph

A student enters their major, GPA, school, year, time-left, activities, experience, skills, and goal. Figured gives them an honest snapshot of where their path is actually leading, three paths that fit their profile, a Gap Analyzer (skills/experience/exposure/mindset framed as "what it takes," never as a judgment), a 30/60/90 action plan, opportunities (LinkedIn + Indeed job links generated from their goal), connections (opted-in mentors + Google-search fallback), an Ask Figured chat mentor powered by Claude, a résumé upload that Claude reads, prefills, and reviews, and an over-time loop — they check off actions and log wins that land on their Timeline.

The whole product is a mirror, not a report card. No scores. No grades. The voice is honest without being brutal. Mentor, not machine.

---

## Stack

Static HTML/CSS/vanilla JS. No build step. No framework.

AI layer: `ai.js` calls the Anthropic API directly from the browser using a key the user pastes in-app (stored in `localStorage`). Model: `claude-opus-4-8`. Adaptive thinking + JSON schema output for insights, streaming for chat.

No backend yet. All persistence is `localStorage` (`figuredProfile`, `figuredAiContent`, `figuredWins`, `figuredChecked`, `figuredApiKey`, `figuredMentors`, `figuredResumeFeedback`). Real accounts + backend are the natural next phase.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing page |
| `onboarding.html` | 4-step intake (`Build My Path` = `?fresh=1`, `Edit profile` = `?edit=1`) |
| `onboarding.js` | Handles prefill, résumé upload, "Building your trajectory…" interstitial |
| `app.html` | The student dashboard |
| `script.js` | Dashboard logic: fallback content, AI orchestration, chat, win-log, timeline |
| `ai.js` | Claude integration (`generateInsights`, `chatStream`, `parseResume`) |
| `mentor.html` | Mentor opt-in form |
| `mentor.js` | Saves opted-in mentors to `localStorage` |
| `styles.css` | Full design system |
| `README.md` | Public-facing |
| `.gitignore` | Excludes junk + system files |

---

## Where it lives

- **Repo (public):** `github.com/Marleystewart/figured`
- **Live URL:** `figured-almar.vercel.app`
- **Local dev:** `python3 -m http.server 4174` in the project root, then `http://localhost:4174`
- **Deploy:** Vercel auto-deploys every push to `main`. Alex is a collaborator (he can push too).

---

## Design language

- Deep forest green primary (`--sage-deep: #2f5a4f`), warm off-white canvas (`--canvas: #f6f4ee`), paper card backgrounds
- Inter font, 800-weight headlines
- Mobile-first; nav becomes a horizontal pill row at ≤820px
- `prefers-reduced-motion` is respected

---

## Hard rules baked into Figured's voice

1. **Never suggest a less ambitious path** than the student stated. Adjacent tracks are equal or upward.
2. **Every gap is framed as "here's what it takes,"** never "here's what you lack."
3. **Never imply a score or grade.** Bars/rings/percentages were intentionally removed in favor of priority labels (Focus first / Building / Strength).
4. **No em dashes or dashes as punctuation** in chat replies. They read as AI.
5. **Chat replies are 60–100 words,** one paragraph by default, `max_tokens` capped at 280.
6. **Vary the closing** — sometimes a next move, sometimes a sharp question, sometimes one honest sentence of belief. Never the same shape twice.

---

## What's built and verified

| Feature | Status |
|---------|--------|
| Landing page + onboarding + dashboard | ✅ Live |
| Goal-aware rule-based fallback content (sports/product/finance/etc.) | ✅ Live |
| Claude insights (JSON schema: headline, body, 3 tracks, gaps, 4 actions, 30/60/90 plan, bridge, focus, timeline) | ✅ Live |
| Ask Figured chat (streaming, profile-aware, guardrailed to her path only) | ✅ Live, voice tuned |
| Résumé upload → Claude parses → prefills form + gives improvement feedback | ✅ Live |
| Opted-in mentor system (mentor.html → "✓ On Figured" direct-link cards, archetype fallback with Google search) | ✅ Live |
| Over-time loop: persistent action check-offs with progress bar, "Log a win" → Timeline with date | ✅ Live |
| Timeline derived from real profile (no fabricated months) | ✅ Live |
| Mobile shell (horizontal pill nav, content above the fold at 375px) | ✅ Live |
| Conversational onboarding (personalized eyebrows by name, "Building your trajectory, [name]…" interstitial) | ✅ Live |
| Micro-interactions (hover lift, staggered card entrance, press states, reduced-motion guard) | ✅ Live |
| Button text alignment (anchor vs button) | ✅ Live |
| Build My Path resets (blank form + clears prev person's wins/checkmarks); Edit profile prefills | ✅ Live |

---

## What's still on the polish list

1. **AI loading states with personality** — when Claude is generating insights, the moment should feel like a mentor thinking, not a generic spinner. This is where the "real mentor" feeling lives.
2. **Sharpen the landing page** (`index.html`) — still has some old example copy that doesn't fully match the rest of the product's voice.
3. **Empty/curation states** — opportunities and connections feel slightly generic; "curated" framing copy would help.

---

## Considered but deferred (intentional, not forgotten)

- **Web search for the chat** — would ground answers in current data, but adds 2–5s latency, ~1–4¢/msg, and risks diluting mentor voice into search-engine voice. Decision: ship to 5 real students first and let them tell us if grounding matters more than the mentor voice.
- **Real accounts + backend** — the natural next phase. `localStorage` is the bridge; a backend moves API keys + mentor list + profiles server-side.
- **Resume backend storage** — currently only browser-local.

---

## Important context about Marley

Marley's own demo profile is sports management at Duke aiming for NBA basketball operations. Use that as the test case for anything you build — it's the hardest test of the "honest, never less ambitious, never generic" rules because it's a non-traditional goal that most career tools fumble.

The voice tuning is recent and intentional. The Ask Figured chat was producing ~180-word replies with em dashes and identical closings. That was tightened on June 12. Don't undo it.

---

## Things to not do

- Never reintroduce numeric scores, percentage bars, or grading. Those were intentionally removed. It's a mirror, not a report card.
- Never put API keys in committed code. The repo is public. Keys live in user browsers via the "Connect AI" flow.
- Don't add web search to chat without an explicit go. That's a deliberate held decision.
- Don't suggest a less ambitious path as "more realistic." That's the cardinal sin of every other career tool — it's what Figured exists to fix.
- Don't strip the conversational onboarding into a plain form. The personalized eyebrows ("Nice to meet you, Marley") and "Building your trajectory…" interstitial are part of the product feel.

---

## How Marley likes to work

- Honest assessments, not cheerleading. If something is weak, say so. If something is overbuilt, push back.
- Verify before claiming done. Show real proof (screenshot, eval result, etc.), not "looks good."
- One thing at a time, well, beats a batch of half-done. Mark a task in-progress, finish it, mark it complete.
- Commit + push as you go (small clean commits with `Co-Authored-By` line). Repo is public so secret scan before publishing anything new.
- Cache-bust script tags (`?v=N`) when JS changes ship, or the browser holds the old file.

---

## Latest commits (most recent first)

```
97a0f5c Tighten Ask Figured chat: shorter, deeper, no AI-feeling dashes
31bdf7b Reset onboarding on "Build My Path"; prefill only on "Edit profile"
2dba7ac Fix button text alignment (anchor vs button)
d3084be Polish: micro-interactions across the dashboard
dc3da76 Make onboarding feel conversational
8a9ff18 Add résumé upload: parse, prefill, and review
890f692 Add over-time loop + mobile shell rebuild
091fc82 Build Figured: honest trajectory app for college students
```

---

## What I might ask you next

Most likely one of: (a) finish the polish pass (AI loading states + landing page sharpening), (b) help me test the chat with deeper questions, (c) start the accounts/backend phase, or (d) something I haven't thought of yet.

Start by acknowledging you've got this context, then ask what I want to work on. Don't dump a plan — just be ready.
