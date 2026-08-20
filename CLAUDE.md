# CLAUDE.md

Conventions for unattended (Lane B) work on `ai-app-factory-v2`. Read `DESIGN.md` for the full
design, milestone list, and — critically — the "Lessons carried forward" section before
starting any issue: it documents real bugs found and fixed in this repo's predecessor,
`ai-app-factory`, that this repo was built to avoid reintroducing. Re-breaking one of those is
worse than an ordinary bug, since it was already paid for once.

## Repo map

```
templates/_shared/labels.json   Label taxonomy applied to every generated project
templates/<type>/                Per-project-type scaffold (nautobot-app, netbox-plugin, custom-script) — M1
scripts/                         factory-new.sh, factory-secrets.sh CLI — M2
site/                             SvelteKit dashboard, adapter-static for GitHub Pages — M3+
projects.json                    Registry of tracked projects; sidebar source of truth
docs/journal.md                  Per-issue build metrics, appended by the workflow only — never edit by hand
docs/backlog.md                  Deliberately deferred work, dated entries, no design decisions
docs/adr/                        Architecture decision records
.github/workflows/claude.yml     The Lane B driver itself
.github/scripts/journal-entry.sh Metrics-append script every Claude-running workflow calls
```

Only `templates/`, `scripts/`, `site/`, `docs/adr/`, and root docs exist as directories you
should create content in as milestones call for them — don't scaffold `site/` ahead of M3's
issue, or `scripts/` ahead of M2's.

## Conventions

- **Never edit `docs/journal.md` by hand or from within a PR branch.** It's appended by
  `.github/workflows/claude.yml` (and `draft-design-doc.yml`/`generate-issues.yml`, which also
  run Claude and should also journal their own runs) *after* the run, via
  `.github/scripts/journal-entry.sh`. Editing it in your branch reintroduces the PR-conflict
  problem `ai-app-factory`'s own journal documents as an already-solved lesson from
  `uk-wealth-tracker`: every open PR touching the same file at once goes conflicting the moment
  any other PR merges.
- **`templates/_shared/labels.json` is the single source of truth for the label taxonomy**
  (`claude-go`, `model:opus`, `model:haiku`, `lane:*`, plus the standard GitHub set). Per-type
  templates should reference it, not duplicate it. It is not automatically applied to this
  repo's own issues — see `README.md`'s Setup section for the one-time `gh label create`
  commands needed here.
- **The site is static.** No server-side code, no secrets committed anywhere in `site/`.
  Anything needing a secret (drafting a design doc, generating issues) is a GitHub Actions
  workflow triggered via `workflow_dispatch`, never a Svelte server route.
- **`site/svelte.config.js`'s `base` is `''` (empty), not a project-pages subpath** — this repo
  assumes a custom domain from the start (see `DESIGN.md`'s "Lessons carried forward"). If this
  repo is ever actually served from `<owner>.github.io/<repo>/` instead of a custom domain,
  that line needs to change back to a subpath base — don't "fix" it the other way without
  checking which URL is actually live.
- **JS/TS in `site/`**: use plain `fetch` against the GitHub REST/GraphQL API and
  raw.githubusercontent.com for `docs/journal.md`/`projects.json` — no bespoke GitHub API
  client library.
- **Project detail routes are two real path segments** (`/projects/[owner]/[name]`), never a
  single URL-encoded `owner%2Fname` segment — see `DESIGN.md`'s "Lessons carried forward" for
  why the collapsed form silently 404s on GitHub Pages specifically.
- Keep commit and PR scope to the files named in the issue or in this repo map above.
- **When an issue asks you to fetch reference files from another repo, write the decoded
  content directly to its real destination path in this working tree** — via the `Write` tool,
  or `... --jq .content | base64 -d > path/inside/this/repo`. Never stage it in `/tmp` or a
  scratch directory first: the sandbox only allows writes inside this checkout.
- **Never write literal `${{ }}` GitHub Actions expression syntax inside a workflow `run:`
  block's comments**, even to document what to avoid — GitHub substitutes it across the entire
  raw text of the block before bash ever runs, including inside `#` comments. Describe the
  pattern in prose instead.

## Definition of done

- The issue's acceptance criteria are met.
- If `package.json` exists (post-M3) and the issue touches `site/`: `npm run build` and
  `npm run lint` pass. If those scripts don't exist yet at the point your issue runs, say so
  plainly in the PR description rather than inventing a workaround.
- Any shell script added is `bash -n`-clean and executable (`chmod +x`).
- Any JSON added is valid (`jq . <file>` succeeds).
- Any YAML workflow file added is parseable (a Python `yaml.safe_load` check is fine if no
  better tool is available on the runner).
- PR description explains what you implemented, what you verified, and anything you could not
  verify unattended.
