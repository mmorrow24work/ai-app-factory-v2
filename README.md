# ai-app-factory-v2

Turns a vague project ask into a running unattended Claude Code build pipeline, and gives you
one dashboard across every project built that way.

This is a from-scratch rebuild of `ai-app-factory` (the predecessor, built over ~3 days of
Claude Code sessions) — same pattern, informed by every lesson that build's own `DESIGN.md`
and `docs/journal.md` documented. See `DESIGN.md`'s "Lessons carried forward" section for the
specific bugs this repo was built to avoid reintroducing.

Two things live here:

1. **Templates + CLI** (`templates/`, `scripts/`) — the repo-scaffolding boilerplate every one
   of these projects needs: a `claude-go`/`model:opus`/`model:haiku`/`lane:*` label taxonomy, a
   `.github/workflows/claude.yml` that runs `claude-code-action` per labeled issue, a
   `docs/journal.md` metrics log, secrets (`CLAUDE_CODE_OAUTH_TOKEN`, `GH_PAT`), and a `.env`.
   Packaged as `nautobot-app`, `netbox-plugin`, and `custom-script` project types.
2. **The factory site** (`site/`) — a static SvelteKit dashboard (GitHub Pages) that takes a
   vague ask, drafts a design doc via Opus, and — once you approve it — generates the GitHub
   milestones/issues that drive the pipeline above. Every tracked project shows up in a grouped
   sidebar with its original ask, elapsed time, token-burn history, latest Actions run status,
   and a commit heatmap.

Live dashboard (once deployed): **https://\<your-custom-domain\>** — see "Setup" below for why
the deployment order matters.

See `DESIGN.md` for the full design, `docs/adr/0001-design-to-issues-loop.md` for the ask →
design doc → milestones/issues → `claude-go` loop step by step, `docs/journal.md` for the
build log of this repo's own (dogfooded) construction, and
[`docs/cowork-sandbox-handoff.md`](docs/cowork-sandbox-handoff.md) if you're curious how a repo
like this one gets built inside a Cowork sandbox and handed off to GitHub in the first place.

## Setup

### 1. This repo's own secrets

The `claude-go` pipeline on *this* repo (and `draft-design-doc.yml` / `generate-issues.yml`,
which run here too) needs two Actions secrets:

```sh
claude setup-token   # mint a Claude Code OAuth token, paste it at the prompt below
gh secret set CLAUDE_CODE_OAUTH_TOKEN -R <owner>/ai-app-factory-v2

gh secret set GH_PAT -R <owner>/ai-app-factory-v2   # fine-grained PAT, see scripts/README.md
```

`GH_PAT` here only ever needs to operate on this repo itself — `Contents`, `Issues`,
`Pull requests`, `Actions`, `Secrets` (Read and write), scoped to "Only select repositories:
this repo." Not `Administration`, not "All repositories" — this repo's own automation never
creates or touches another repo (provisioning a new project is a human step, run locally). Note
also that GitHub withholds `workflow` scope from fine-grained PATs used this way regardless: any
change to a `.github/workflows/*.yml` file has to be pushed by a human — see "Known
limitations" below.

Also add the label taxonomy to this repo itself — `templates/_shared/labels.json` is only ever
applied automatically to *newly generated* projects by `factory-new.sh`, never to this repo:

```sh
gh label create model:opus --color 5319E7 -R <owner>/ai-app-factory-v2
gh label create model:haiku --color C5DEF5 -R <owner>/ai-app-factory-v2
gh label create claude-go --color 0E8A16 -R <owner>/ai-app-factory-v2
gh label create lane:interactive --color 1D76DB -R <owner>/ai-app-factory-v2
gh label create lane:manual --color B60205 -R <owner>/ai-app-factory-v2
gh label create lane:unattended --color 0E8A16 -R <owner>/ai-app-factory-v2
gh label create new-project-ask --color FBCA04 -R <owner>/ai-app-factory-v2
```

Or use this loop.

```
read -rp "GitHub owner: " OWNER
declare -A LABELS=(
  ["model:opus"]="5319E7"
  ["model:haiku"]="C5DEF5"
  ["claude-go"]="0E8A16"
  ["lane:interactive"]="1D76DB"
  ["lane:manual"]="B60205"
  ["lane:unattended"]="0E8A16"
  ["new-project-ask"]="FBCA04"
)
for name in "${!LABELS[@]}"; do
  gh label create "$name" --color "${LABELS[$name]}" -R "$OWNER/ai-app-factory-v2"
done
```


### 2. The local secrets store (`factory-new.sh` / `factory-secrets.sh`)

```sh
cp .env.example .env
# fill in CLAUDE_CODE_OAUTH_TOKEN (a fresh token is fine, or reuse step 1's)
```

`GH_PAT` is deliberately **not** in `.env` — `factory-secrets.sh` prompts for it fresh (input
hidden) every time it runs, scoped to just the one repo being provisioned, and never writes it
to disk. See `.env.example` and `DESIGN.md`'s "GH_PAT: token strategy" for why a shared, stored
`GH_PAT` was rejected before this repo's first commit, not partway through it.

`.env` is gitignored — lives inside this checkout, but git can never touch it. See
`scripts/README.md` for the full CLI reference.

### 3. Running the site locally

```sh
cd site
npm install
npm run dev       # http://localhost:5173
npm run build     # static output to site/build/, what pages-deploy.yml ships
npm run lint       # prettier + eslint
npm run check      # svelte-check
```

The site is 100% static — no `.env` needed to run it locally, and no GitHub credential of any
kind touches the browser. `/settings` only holds display preferences (theme, palette,
typography), stored in `localStorage`. `/new` builds a pre-filled GitHub "New issue" link and
hands off to GitHub's own submit button — no authenticated API call from the browser, ever
(see `DESIGN.md`'s "Lessons carried forward" for why this repo starts here instead of a
PAT-in-`localStorage` design).

### 4. Running the site on GitHub, with a custom domain (Cloudflare example)

If you're working from a normal `git clone` or fork of this repo, `main` is already the
correct default branch and none of the branch-naming caveats in `DESIGN.md`'s "Provenance"
section apply to you — skip straight to step 1 below. That section exists to explain a
one-time detour in how the *first* copy of this repo got onto GitHub, not a routine setup step.

Order matters for what follows — doing it backwards is exactly how this dashboard silently
404'd for a stretch the first time it was set up:

**1. Repo Settings → Pages → Build and deployment → Source: "GitHub Actions."** Not "Deploy
from a branch" (GitHub's default when Pages is first enabled) — this repo deploys via
`pages-deploy.yml`'s `actions/deploy-pages`, which only publishes anything if Source reads from
Actions deployments. Leaving it on the branch-based default means the workflow can run green
forever while nothing is actually served.

**2. Repo Settings → Pages → Custom domain:** enter your domain (e.g.
`ai-app-factory-v2.yourdomain.com`) and save. GitHub will show "DNS check unsuccessful" until
step 3 is done — expected at this point, not an error. Confirm `site/svelte.config.js`'s
`base: ''` still matches this (it assumes a domain-root deploy — see `DESIGN.md`). If you're
deploying to the plain `<owner>.github.io/<repo>/` project-pages URL instead of a custom
domain, that line needs to become the repo name as a subpath
(`base: '/ai-app-factory-v2'`), or every built asset URL will be wrong.

**3. Add the DNS record at Cloudflare** (or whichever registrar/DNS host you use):

| Type  | Name                | Target                | Proxy status |
|-------|---------------------|------------------------|--------------|
| CNAME | `ai-app-factory-v2` | `<owner>.github.io`   | DNS only     |

"DNS only" (grey cloud, not orange) is the simpler starting point — a Cloudflare-proxied
(orange cloud) record works too, but adds a layer between you and GitHub's own HTTPS
certificate provisioning that's one more thing to debug if something looks wrong. Switch to
proxied later once you've confirmed the direct path works. DNS propagation and GitHub's
certificate issuance can both take a few minutes.

**4. Trigger the first real deploy** (it may already have fired automatically if step 1 was
done before any push touching `site/**`):

```sh
gh run list -R <owner>/<repo> --workflow=pages-deploy.yml --limit 3
# if nothing recent, or you want to force a fresh one:
gh workflow run pages-deploy.yml -R <owner>/<repo>
```

**5. Verify independent of DNS/CDN caching:**

```sh
gh api repos/<owner>/<repo>/pages
```

Check `status` (should be `built`) and `https_certificate.state` (should be `approved`). A
`curl -I https://<your-domain>/` can lag behind this by several minutes even after a successful
deploy, since GitHub's edge caches negative (404) responses — don't treat a stale `curl` result
as a live problem if `gh api .../pages` already looks correct.

## Using the factory

**Scaffold a new project by hand:**

```sh
scripts/factory-new.sh custom-script my-new-tool --ask "A CLI that syncs X to Y" \
  --set ENTRY_POINT=run.py --set TEST_COMMAND=pytest
scripts/factory-secrets.sh my-new-tool
```

**Or through the site:** open `/new`, describe the project in a sentence or two, submit.
Review the drafted `docs/proposals/<slug>.md` PR it opens here, edit if needed, and merge —
`generate-issues.yml` takes it from there. See the ADR for the full loop.

## Known limitations

- **`workflow` scope is structurally unavailable to a fine-grained PAT**, regardless of repo
  grants. Any change to a `.github/workflows/*.yml` file — here or in a generated project —
  has to be pushed by a human, or drafted by the pipeline and posted in a PR description/issue
  comment for a human to apply by hand.
- **`docs/journal.md`'s `Result: success/failure` reflects the Claude Code step's own execution
  outcome, not whether it achieved the issue's goal.** A run that correctly decides to post a
  blocking comment instead of opening a PR still records `Result: success`. Check the entry's
  `PR:` field (`—` vs an actual number) to tell the two apart.
- **Support & handoff, and forking:** see `DESIGN.md`'s "Support & handoff" section (once M1
  lands `templates/_shared/SUPPORT_HANDOFF.md.tmpl`) — every generated project documents this
  itself too.
- See `docs/backlog.md` for what's deliberately out of scope for this initial build.
