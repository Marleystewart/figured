# 4ward

**An honest trajectory tool for college students.** 4ward takes a truthful but encouraging look at where a student is actually headed based on what they're doing right now — and tells them what the path takes, what's possible, what's missing, and exactly what to do next. Mentor, not machine.

Students enter their major, GPA, activities, experience, skills, and goal. 4ward gives them:

- An **honest snapshot** of their trajectory (no scores, no grades — a mirror, not a report card)
- **Paths that fit their profile** — their goal plus genuine adjacent routes
- A **Gap Analyzer** (skills, experience, exposure, mindset) framed as "what it takes," never "what you lack"
- A **30 / 60 / 90-day action plan**
- **Opportunities** — live LinkedIn Jobs + Indeed searches tailored to their goal
- **Connections** — opted-in mentors who link straight to their LinkedIn, plus search fallbacks
- **Ask 4ward** — a chat mentor that knows their full profile (powered by Claude)

## Tech

Static HTML / CSS / vanilla JS — no build step. The optional AI layer (`ai.js`) calls the Anthropic API directly from the browser using a key the user provides in-app (stored only in their browser). Without a key, the app uses goal-aware rule-based content.

## Run locally

```bash
python3 -m http.server 4174
```

Then open <http://localhost:4174/>.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Landing page |
| `onboarding.html` / `onboarding.js` | Profile intake flow |
| `app.html` / `script.js` | The student dashboard |
| `mentor.html` / `mentor.js` | Mentor opt-in intake |
| `ai.js` | Claude integration (insights + Ask 4ward chat) |
| `styles.css` | Full design system |

## Status

Prototype. The AI key flow and mentor storage are browser-local; a production build would move both behind a backend.
