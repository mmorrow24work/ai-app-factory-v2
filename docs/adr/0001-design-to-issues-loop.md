# ADR 0001: The ask → design doc → provision → seed → claude-go loop

## Status

Accepted from M0. Adapted from `ai-app-factory` (predecessor)'s identical ADR — the loop
itself was validated there and isn't being redesigned here, only reproduced with its lessons
already applied (see this repo's `DESIGN.md`, "Lessons carried forward").

## Context

The whole point of this repo is to remove the by-hand steps between "someone has a vague idea
for a project" and "the unattended pipeline is grinding through labeled issues for it." Since
none of the workflows involved can be exercised by a human mid-run (all are
`workflow_dispatch`/`push`-triggered, unattended Actions jobs), the handoff between them —
what file lands where, what triggers what, who does what by hand in between — needs to be
written down somewhere more durable than the workflow files themselves.

## The loop

1. **Ask.** A requester fills in the `/new` page on the site with a project name and freeform
   requirements, and submits it — the site builds a pre-filled GitHub "New issue" deep link
   (`title=[new-project-ask] ...`, a placeholder body, real requirements text on the clipboard)
   and hands off to GitHub's own submit button. No credential of any kind touches the
   requester's browser.
2. **Draft PR.** `draft-design-doc.yml` triggers on the `[new-project-ask] ` title prefix, runs
   Opus against the ask, writes a design doc shaped like this repo's own `DESIGN.md` to
   `docs/proposals/<slug>.md` on a `design/<slug>` branch, and opens it as a PR titled
   `Design: <project name>` against `main`. A follow-up step stamps
   `**Requested by:** @<github-login>` onto the doc and PR body from the issue's authenticated
   author — never left to the LLM step to write itself.
3. **Review and merge — approval gate #1.** A human reviews and edits the design doc in GitHub's
   own PR review UI and merges it once it's a plan worth building.
4. **Provisioning plan.** The merge triggers `generate-issues.yml`, which reads the merged doc,
   determines the project type, works out the exact `scripts/factory-new.sh` invocation
   (including every required `--set` placeholder), and opens an issue **in this repo** —
   `Provision <owner>/<slug>` — with those commands spelled out. It does not create the target
   repo or touch any other repo, and applies no `claude-go` label: this step always needs a
   human.
5. **Provision — approval gate #2.** A human runs, locally, using their own `gh auth`:
   ```
   scripts/factory-new.sh <type> <slug> --ask "..." [--set KEY=VALUE ...]
   scripts/factory-secrets.sh <slug>
   git add projects.json && git commit -m "Register <owner>/<slug>" && git push
   ```
   This is where the project actually starts to exist, and it's a deliberate second gate,
   separate from gate #1: it's where a human decides whether it's worth spending real tokens on
   before any Opus run against the new repo happens.
6. **Seed — manual trigger.** The human fires the new repo's own `seed-milestones.yml`
   (`workflow_dispatch`, no inputs). It fetches the approved design doc directly from this
   repo's public `main` branch over an unauthenticated `raw.githubusercontent.com` request,
   then creates one GitHub milestone per doc milestone and one or more `claude-go`-labeled
   issues per milestone — using *that repo's own* `CLAUDE_CODE_OAUTH_TOKEN`/`GH_PAT`, never
   reaching back into this repo.
7. **Pipeline picks it up.** The moment `seed-milestones.yml` applies `claude-go` to an issue,
   the same repo's own `claude.yml` (copied from the template in step 5) fires.

## Why provisioning is a human step, not automated

`generate-issues.yml` never calls `scripts/factory-new.sh` itself and never creates a repo.
Repo creation forces broad token scope (a fine-grained PAT scoped to "Only select repositories"
structurally cannot cover a repo that doesn't exist yet), and folding that into an unattended
step reintroduces exactly the shared-credential blast radius `DESIGN.md`'s "GH_PAT: token
strategy" exists to prevent. This repo starts with that separation rather than discovering the
need for it mid-build.

## Consequences

- Steps 2→3 are a PR a human can inspect and edit before anything downstream acts on it. Step
  4→5 is a plain-text checklist, not a PR, since nothing gets written to `main` at that point.
- `generate-issues.yml` and `seed-milestones.yml` are both idempotent by design (skip a
  provisioning issue, milestone, or issue that already exists).
- `seed-milestones.yml` trusts this repo's `main` branch content unauthenticated — safe
  specifically because this repo is public and the file it fetches already went through PR
  review in step 3.
