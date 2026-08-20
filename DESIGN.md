# Design: ai-app-factory-v2

## Problem

`ai-app-factory` (the predecessor to this repo, built over ~3 days of Claude Code sessions
with human collaboration) proved the pattern: templates + CLI + a static dashboard that turns
a vague ask into a running unattended Claude Code build pipeline. It also accumulated a long
list of bugs found live, fixed, and documented in its own `DESIGN.md` and `docs/journal.md` —
some of which were fixed in the templates but never ported back to the factory's own copy,
some of which were fixed once and are easy to reintroduce by a future contributor who hasn't
read the full history. This repo is a from-scratch rebuild of the same two things, with every
one of those lessons folded into the initial design rather than left to be rediscovered.

This is **not** a fork or a clone of `ai-app-factory` — no shared git history, no shared
Actions run history, no shared `docs/journal.md`. It is a new implementation of the same
proven pattern, informed by the old one's mistakes.

## Goal

Same as the predecessor:

1. **Templates + CLI** (`templates/`, `scripts/`) — package the repo-scaffolding boilerplate
   (`claude-go`/`model:opus`/`model:sonnet`/`model:haiku`/`lane:*` labels, `claude.yml`,
   `docs/journal.md`, secrets, `.env`) as reusable templates (`nautobot-app`, `netbox-plugin`,
   `custom-script`) plus a CLI that provisions a new repo in one step.
2. **The factory site** (`site/`) — a static SvelteKit dashboard (GitHub Pages, custom domain)
   that turns a vague ask into a drafted design doc, an approved design doc into GitHub
   milestones/issues, and shows every tracked project in one place.

## Non-goals

Unchanged from the predecessor, for the same reasons — see its `DESIGN.md` if the "why" isn't
obvious from the line alone:

- Scraping the claude.ai usage page (no public API; `docs/journal.md` is the real source of
  token-burn data).
- A custom rich-text editor for design docs (GitHub's own PR review UI is the editor).
- A separate hosting account (everything runs on GitHub: Pages + Actions).

## Lessons carried forward from `ai-app-factory` (predecessor)

Each of these was a real bug found live in the predecessor, documented in its `DESIGN.md`
and/or `docs/journal.md`, sometimes fixed in one place and not another. Baked in here from
the start instead of left to be rediscovered a second time.

**GitHub Pages / SvelteKit deployment**

- `svelte.config.js`'s `base` path must not be hardcoded to a project-pages subpath
  (`/repo-name`) if the intent is a custom domain — the predecessor shipped with
  `base: '/ai-app-factory'` baked in from M3, which silently broke every asset URL the moment
  a custom domain was configured, and the mismatch went unnoticed for weeks because the HTML
  shell itself still loaded (just every JS/CSS 404'd). This repo's `site/svelte.config.js`
  uses `base: ''` unconditionally, documented as an intentional custom-domain assumption, with
  a comment pointing at *why* a subpath base would break it.
- Route params must use two real path segments (`/projects/[owner]/[name]`), never a single
  `encodeURIComponent('owner/name')` segment — `adapter-static` prerenders the encoded file
  correctly, but GitHub Pages decodes `%2F` in the incoming request path before matching it to
  a file, so the URL never resolves regardless of how correctly the file was built. This repo
  starts with the two-segment route from M3, not the collapsed one.
- **Repo Settings → Pages → Build and deployment → Source must be "GitHub Actions", not
  "Deploy from a branch."** The predecessor's custom domain was configured while Source was
  still on the branch-based default (pointed at `main`/`/docs`, a folder with no `index.html`
  at all) — the Actions-based `pages-deploy.yml` ran "successfully" the whole time and
  published nothing anyone could see, a completely silent failure mode with no error in any
  workflow run. `README.md`'s Setup section here spells out this exact setting as a required
  step, in the order it needs doing (Source first, custom domain second — see "GH_PAT: token
  strategy" for why order matters for the credential side too).

**GH_PAT scoping**

- A single, stored, shared `GH_PAT` — copied into every generated project's own secret — was
  tried and rejected in the predecessor: one leak from any one generated repo would expose a
  token that can act on all of them. This repo's `factory-secrets.sh` prompts for `GH_PAT`
  interactively (input hidden) on every run and never persists it, from the first version of
  the script — see "GH_PAT: token strategy" below for the full reasoning, reproduced rather
  than re-derived.
- `ai-app-factory-v2`'s own `GH_PAT` (used by `generate-issues.yml` if present, and Claude's
  PRs against this repo) is scoped to this one repo only: `Contents`, `Issues`,
  `Pull requests`, `Actions`, `Secrets` (Read and write) — never `Administration`, never
  `Workflows`, never "All repositories." Provisioning a new project's repo is a human step run
  locally with the human's own `gh auth`, exactly as the predecessor settled on after finding
  that repo-creation rights force broad token scope — this repo starts there instead of
  re-deriving it.
- **`workflow` scope is structurally unavailable to any fine-grained PAT**, regardless of repo
  grants — confirmed the hard way against the predecessor when even a repo-scoped PAT with
  `Contents: write` was rejected pushing to `.github/workflows/*.yml`. Any change to a workflow
  file has to be pushed by a human (or a classic PAT with `workflow` scope, which is a
  different credential entirely and out of scope for the narrowly-scoped `GH_PAT` this repo
  uses). Documented in `README.md`'s "Known limitations" from the start, not discovered three
  times before being written down.

**`claude.yml` prompt and authorization**

- An `@claude` follow-up comment's actual text must be fetched into the prompt (via
  `gh api .../issues/comments/<id> --jq .body`), not just used as a re-trigger signal — the
  predecessor shipped without this for its own root `claude.yml` even after fixing it in every
  generated project's template, so its own `@claude` retries silently re-solved the original
  issue text. This repo's `claude.yml` (root and all three templates) fetches the comment body
  from the start, identically in every copy.
- A run should check for an unmerged milestone dependency *before* any other exploration, and
  bail out immediately with a blocking comment if found. The predecessor's own journal records
  multiple runs that spent 100+ turns and most of a dollar in notional cost only to conclude
  "blocked" at the very end — the prompt here puts that check first, explicitly, rather than
  leaving it to be inferred from "if genuinely ambiguous, post a comment."
- A generated project's requester (its GitHub login, recorded from the intake issue's
  authenticated author) should be able to direct changes via `@claude` comments, not just
  approve/reject a PR that already exists — the predecessor initially left `@claude` gated to
  `OWNER`/`MEMBER`/`COLLABORATOR` only, which a requester structurally never is, so their only
  real input was binary accept/reject on something already drafted. This repo's per-project
  `claude.yml` template authorizes a collaborator's comment immediately and falls back to
  checking the comment author against the project's own recorded requester (parsed from
  `README.md`'s "Requested by" line) from the start.
- That requester-extraction grep must tolerate zero matches (`|| true`) rather than let
  `pipefail` propagate a "no match" exit code into `set -e` killing the whole step before the
  authorization check ever runs — the predecessor hit this live on its first real non-`Requested
  by` repo. Written defensively from the start here.
- Never write literal `${{ }}` GitHub Actions expression syntax inside a `run:` block's
  comments, even purely as documentation of what to avoid — GitHub substitutes `${{ }}` across
  the *entire* raw text of a `run:` block before bash ever sees it, including inside `#`
  comments, and untrusted comment text spliced into a mis-worded warning comment executed as
  shell commands in the predecessor's own history. Every comment in this repo's workflow files
  that discusses this pattern describes it in prose without ever writing the literal syntax.

**Intake and requester identity**

- The `/new` intake flow uses a pre-filled GitHub "New issue" deep link
  (`issues/new?title=...&body=...`), never an authenticated `workflow_dispatch` call from the
  browser — the predecessor's original design assumed every requester already had a
  fine-grained PAT to paste into `/settings`, true only for the repo's own operator. This repo
  starts with the zero-credential deep-link flow from M5, not as a mid-build revision.
- The `labels=` query param on an `issues/new` deep link is silently dropped for anyone who
  isn't already a repo collaborator with label-write access — the predecessor's first live test
  passed only because it was run by the repo owner, who has that permission and structurally
  couldn't have caught the failure. This repo's `draft-design-doc.yml` triggers on a
  `[new-project-ask] ` title prefix from the start; the label is applied server-side afterward,
  for bookkeeping only.
- Long requirements text must not go in the `body=` query param — GitHub's URL-length limit
  breaks on anything past a one-liner. This repo's `/new` page carries only a short title in
  the URL and puts the real requirements text on the visitor's clipboard
  (`navigator.clipboard.writeText()`) for them to paste over a placeholder body on GitHub's own
  page, with a status message covering the clipboard-write-failed case, from the start.
- `claude-code-action` refuses to run for an actor without write access to the repo, and
  separately refuses a `workflow_dispatch` initiated by a bot actor, both by default. Every
  workflow here that must serve a non-collaborator requester or self-dispatch via a bot token
  sets `allowed_non_write_users`/`allowed_bots` explicitly and narrowly, documented with why
  the resulting blast radius is still bounded, from the first version of each workflow.
- The `**Requested by:**` stamp is written by a script step reading the issue's authenticated
  `author.login`, never left to the LLM drafting step to write itself — unspoofable, unskippable
  by construction, not a convention that depends on the model remembering it every time.
- Requester identity is the GitHub login only — no name/email/phone form field. The
  predecessor tried collecting more, shipped it, and reverted the same day once it was clear a
  free-text field is both unverifiable and unnecessary PII to republish on a fully public
  static site. This repo never has that field to remove.

**`factory-new.sh` / templating**

- Bash's `${var//pattern/replacement}` treats an unescaped `&` in the replacement text as "the
  matched pattern," `sed`-style — not a literal ampersand. Any value substituted into a
  template (a support-and-feedback heading, a project description, anything a human might type
  containing "&") must have `\` then `&` escaped before substitution. Written into
  `factory-new.sh`'s substitution function from the start, with a comment pointing at the
  specific repro (`X="AAA & BBB"` → `"AAA {{X}} BBB"` uncorrected) rather than an abstract
  warning.
- `custom-script`'s `ENTRY_POINT` placeholder has no defensible default and must always be
  required via `--set`; `nautobot-app`/`netbox-plugin` get built-in version defaults but no
  entry-point guess either. `generate-issues.yml`'s provisioning-plan prompt is told explicitly,
  per project type, which `--set` values are always required — the predecessor found this the
  hard way when its first few provisioning issues omitted required placeholders.

**Journal / model selection**

- `docs/journal.md` is appended only by `claude.yml`'s own post-run step, never by Claude
  inside a PR branch — every open PR touching the same file at once was the predecessor's
  (predecessor's-own-predecessor's, `uk-wealth-tracker`) exact merge-conflict problem. Stated
  as a hard rule in `CLAUDE.md` from the start, with the mechanism (not the workaround)
  documented.
- `model:opus`/`model:haiku` labels move off the Sonnet default in both directions from day
  one — the predecessor only got a `model:opus` escalation path initially and added
  `model:haiku` in a later hardening pass once it became clear purely mechanical issues
  (templating, formatting, status-only changes) were being run at Sonnet cost when Haiku would
  do, with no cheaper option available at all. Opus is reserved for genuinely high-judgment
  work: initial design-doc drafting (`draft-design-doc.yml`), and any issue explicitly labeled
  `model:opus` for ambiguity/complexity a human anticipates. `generate-issues.yml`'s
  provisioning-plan step — mechanical templating over an already-reviewed doc — runs Sonnet
  from the start, not Opus-then-downgraded.
- Every workflow that runs `claude-code-action` should append to `docs/journal.md` (or a
  workflow-specific equivalent log), not just the per-issue `claude.yml` — the predecessor's
  `draft-design-doc.yml` and `generate-issues.yml` runs were invisible in its own cost
  accounting for the entire build, which is exactly backwards for a repo whose whole pitch is
  visibility into build cost. See `.github/scripts/journal-entry.sh`, called from all three
  Claude-running workflows here, with a `WORKFLOW` column distinguishing which one ran.

**Dashboard UX**

- Per-project live Actions-run status is expensive: one unauthenticated GitHub API call per
  tracked project, and an unauthenticated visitor shares a 60-requests/hour-per-IP budget
  across the whole site. The predecessor's own `SessionStatusBadge` component documents that
  even *one* such poller on a single project detail page can exhaust that budget within an
  hour. This repo's sidebar shows elapsed-since-creation (free — pure client-side math over
  `projects.json`'s `createdAt`, no network call) rather than a live status dot per project,
  from the start, with the per-project detail page keeping the single live-status poll it
  actually needs.
- A design system (`templates/_shared/design-system/`) and a static-site dark-mode toggle
  (`templates/custom-script/theme.css` + `theme-toggle.js`) exist from the first version of
  the relevant templates, rather than being adopted mid-build from a sibling project.

## Architecture

Unchanged in shape from the predecessor — this pattern was validated, not broken:

**Read path (dashboard):** 100% static. SvelteKit + `adapter-static`, deployed to GitHub
Pages, reads `projects.json` (this repo) plus each tracked repo's public GitHub REST/GraphQL
API and raw `docs/journal.md` — directly from the browser, no server.

**Write path (drafting, generating issues):** `/new` builds a pre-filled GitHub issue link;
`draft-design-doc.yml` triggers on `issues: opened` (title-prefix filtered), drafts a design
doc via Opus, opens it as a PR. On merge, `generate-issues.yml` opens a provisioning issue in
*this* repo (never touches another repo). A human runs `scripts/factory-new.sh` +
`scripts/factory-secrets.sh` locally, then fires the new repo's own `seed-milestones.yml`. Full
loop: `docs/adr/0001-design-to-issues-loop.md`.

## GH_PAT: token strategy

Reproduced from the predecessor (where it was earned the hard way, twice) rather than
re-derived: **fine-grained PAT, scoped to "Only select repositories: this repo"**, with
`Contents`, `Issues`, `Pull requests`, `Actions`, `Secrets` (Read and write) — not
`Administration`, not `Workflows`. Repo creation is a human step (see "Lessons carried
forward" above), so this repo's own `GH_PAT` never needs to leave this repo. Generated
projects' own `GH_PAT` is minted fresh per project by `factory-secrets.sh`, prompted
interactively, never stored in `.env` or anywhere else — see the same section in the
predecessor's `DESIGN.md` for the full two-failed-attempts history behind this if the "why"
matters; not reproduced verbatim here to keep this doc from becoming a copy of that one.

## Milestones

- **M0 — Bootstrap.** This repo, `docs/journal.md`, `CLAUDE.md`, root `claude.yml`.
- **M1 — Template library.** `nautobot-app`, `netbox-plugin`, `custom-script`, each with the
  lessons above baked in from their first commit.
- **M2 — `factory` CLI.** `factory-new.sh`, `factory-secrets.sh`, with the `&`-escaping fix and
  never-stored `GH_PAT` from the start.
- **M3 — Dashboard shell.** Two-segment project routes, custom-domain-correct base path, grouped
  sidebar with elapsed time.
- **M4 — Usage widgets.** `docs/journal.md` parser, token-burn chart, per-project session status
  (single poll, not fanned out), commit heatmap.
- **M5 — Intake → design doc.** Zero-credential issue-deep-link flow, clipboard-based
  requirements text, title-prefix trigger, from the start.
- **M6 — Approve → provision → seed.** Provisioning issue only, no cross-repo write, from the
  start.
- **M7 — Polish.** CI on the factory itself (`site/` build+lint+check, `scripts/` `bash -n` +
  a smoke-test dry run, `templates/_shared/labels.json` JSON validation) and Dependabot for
  `site/`'s npm deps — both addressed here at M7 rather than deferred, since they're cheap
  relative to the rest of this rebuild and the predecessor's own backlog flagged both as gaps.

## Provenance: how this repo was first stood up

**If you're reading this because you cloned or forked `ai-app-factory-v2` from GitHub, this
section doesn't apply to you and you can skip it.** `main` is this repo's actual default
branch, and everything below describes a one-time detour in how the *first* copy of this repo
got from nowhere to existing on GitHub at all — not anything a normal `git clone`/`gh repo
fork` will reproduce.

This repo was built inside a Cowork sandbox session — an ephemeral cloud container with no
standing GitHub credential of its own, so it cannot push a brand-new repo into existence
directly (see [`docs/cowork-sandbox-handoff.md`](docs/cowork-sandbox-handoff.md) for the full
explanation of why, and the bundle-vs-archive tradeoff generally). The whole repo was instead
packaged as a portable `git bundle` and handed to a human, who cloned it locally and pushed it
to a newly created GitHub repo:

```sh
git clone <bundle-file> ~/git/ai-app-factory-v2
cd ~/git/ai-app-factory-v2 && git log
gh repo create ai-app-factory-v2 --public --source=. --remote=origin --push
git remote -v
git remote set-url origin https://github.com/<owner>/ai-app-factory-v2.git && git push -u origin main
git branch
git push -u origin master
git branch -m master main && git push -u origin main
```

### What went wrong, once

- **The sandbox's own `git init` had no `init.defaultBranch` override, so it fell back to
  git's real built-in default, `master`** — while every workflow file here (`pages-deploy.yml`,
  `claude.yml`, `draft-design-doc.yml`, `generate-issues.yml`) hardcodes `main`. The bundle
  faithfully preserved that `master`-named branch, so the first push attempt against `main`
  failed outright (`git branch` showed `master`, not `main`), and it took a rename-then-push to
  fix. `git init -b main` at the very start — inside the sandbox, before the bundle was even
  created — would have avoided this entirely; that's the actual fix, not anything inherent to
  building a repo this way.
- **GitHub's auto-created `github-pages` deployment environment locked to `master`** (the
  default branch at the moment Pages was first enabled) and did not follow the later rename to
  `main`, so every deploy from `main` was rejected until the environment's branch policy was
  updated to match:
  ```sh
  echo '{"deployment_branch_policy": null}' | \
    gh api -X PUT repos/<owner>/<repo>/environments/github-pages --input -
  ```

Both are now fixed at the GitHub-repo-settings level (not in git history), and this repo's
commit history has since been squashed to a single clean commit on `main` — so nothing about
this detour persists in what a normal clone or fork actually sees.

**If you're building a similar factory repo from scratch yourself** (not cloning this one) —
by hand, or via a future rebuild pass the way this repo itself was built — the one thing worth
carrying forward is: run `git init -b main` explicitly, don't rely on your environment's
default matching what your workflows assume, and check `git branch` *before* enabling GitHub
Pages rather than after.

A copy of the original hand-off archive, `ai-app-factory-v2.tar.gz`, is kept in this repo (see
[`artifacts/`](artifacts/) or this repo's Releases) for anyone who wants to reproduce this
exact detour deliberately — unpack it fresh and run a bare `git init` (no `-b main`) to watch
the same branch-default mismatch happen live, rather than just reading about it here.

## Known limitations (carried forward, still true here)

- `workflow` scope is structurally unavailable to a fine-grained PAT — any `.github/workflows/*`
  change needs a human push, always.
- `docs/journal.md`'s `Result: success/failure` reflects the Claude Code step's own execution
  outcome, not whether it achieved the issue's goal — check `PR:` (`—` vs a number).
- See `docs/backlog.md` for dimensions deliberately out of scope for this initial build:
  reliability/failure-recovery alerting, cross-project observability, `projects.json` state
  integrity (drift detection), extensibility beyond the three current project types, and a
  deliberate cold-start test of whether these docs alone let a fresh session pick up the
  mental model without this build's own history to lean on.
