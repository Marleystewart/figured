# 4ward — case study test notes

Triage of findings from the June 28 case-study run (12 profiles). Status legend:
✅ fixed · 🔧 in progress · 🅿️ parked (post-July-17) · ❓ needs repro/screenshot

## Bugs
- ✅ **Résumé feedback shown when none uploaded** (Darius) — fresh build now clears
  `figuredResumeAnalysis` + `figuredResumeGuidelines`, not just `figuredResumeFeedback`. (commit fbc9dcc)
- ✅ **"JUNK / X" card in paths** (Jordan) — `sanitizeTracks()` drops placeholder/junk
  rows, caps to 3, before render.
- ✅ **"~30 sec" loading label dishonest** (Wei 37s, Ethan 43s, Marcus 50s, Aaliyah 37s,
  Hana 37s, Olivia 33s) — copy now "up to a min" / "30 to 60 seconds"; progress bar
  creep stretched 26s → 55s to match real load times.
- ❓ **Stale trajectory on reload** (Darius) — "reloaded, still talked about sales."
  Ambiguous: cache returning same content for same profile (by design) vs. checklist/
  checked-state persisting across regen vs. Opus deterministically re-suggesting sales.
  NEEDS Darius before/after trajectory screenshots to pin down.
- ✅ **Extra bubble under Trajectories** (Wei) — same root cause as Jordan's JUNK card:
  the AI emitted a 4th malformed/empty track that rendered as a blank bubble.
  `sanitizeTracks()` drops empty/junk rows, so this is covered by the same fix.
  (Re-test to confirm; if it persists it's specific to the Trajectory tab.)

## Content quality (prompt tuning)
- 🔧 **Opportunities too generic** (Ethan, Marcus, Tyler, Olivia — most-repeated note).
- 🔧 **Vague goal breaks Opportunities** (Darius "something that pays well", Tyler) —
  need a guard for too-vague goals.
- 🔧 **Output collapses to one direction** (Priya: only consulting, not biotech too).

## Bigger / parked
- 🅿️ **Which trajectory drives checklist/opportunities?** (Sofia) — when multiple paths
  and student prefers one (family vs. acute-care nurse), actions/opps follow only one.
  Real fix = let student pick an active track; everything keys off it. Post-launch feature.
- 🅿️ **Salary / tree "does this look right?"** (Aaliyah, Hana, Wei) — review judgments,
  not bugs.
