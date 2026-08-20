# Build Journal

Per-issue record of the unattended (Lane B) build of `ai-app-factory-v2`. One entry per Claude
run, appended automatically by whichever workflow ran it, via `.github/scripts/journal-entry.sh`.

## How this file is written

**Entries are appended by the workflow that ran Claude, not by Claude inside its own PR
branch.** This is deliberate from the start (see `DESIGN.md`'s "Lessons carried forward"): in
`ai-app-factory`'s predecessor (`uk-wealth-tracker`), having Claude append its own journal
entry within each PR meant every open PR touched the same file, so almost every one went
`CONFLICTING` the moment any other PR merged. Appending from the workflow after the run
sidesteps that entirely.

**Every workflow that runs `claude-code-action` appends here** — `claude.yml`,
`draft-design-doc.yml`, and `generate-issues.yml` alike, each recording which workflow the
entry came from in a `Workflow:` field. `ai-app-factory` (the predecessor) only ever journaled
`claude.yml`'s own per-issue runs, which made the other two workflows' token spend invisible
for its entire build.

## What "Estimated Cost" means

This pipeline authenticates via a **Claude subscription** (OAuth), not pay-per-token API
billing. The cost figure is notional — what the run *would* cost at standard list rates —
useful as a consistent yardstick for comparing runs, not an actual charge.

---

## Build velocity

Recomputed by `.github/scripts/journal-entry.sh` on every run.

<!-- VELOCITY_START -->
| Metric | Value |
|---|---|
| Issues with recorded metrics | 0 |
| Successful runs | 0 |
| Mean time per issue | — |
| Mean turns per issue | — |
| Mean output tokens per issue | — |
| Mean estimated cost per issue | — |
<!-- VELOCITY_END -->

---

## Entries

<!-- ENTRIES_START -->
<!-- New entries are appended below this marker, newest last. -->
