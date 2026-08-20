# scripts

The `ai-app-factory-v2` CLI: two commands that turn a template plus a target
GitHub account into a running project with its own `claude-go` pipeline.

```
factory-new.sh        Scaffold templates/<type>/ into a new GitHub repo, apply
                       labels, register it in projects.json
factory-secrets.sh    Set CLAUDE_CODE_OAUTH_TOKEN (from .env) and GH_PAT
                       (prompted fresh, never stored) on a repo
```

Both require `gh` (authenticated: `gh auth login`) and `jq` on `PATH`.

## factory-new.sh

```sh
scripts/factory-new.sh custom-script my-new-tool \
  --ask "A CLI that syncs X to Y" \
  --set ENTRY_POINT=run.py \
  --set REQUESTER_GITHUB=janedoe
```

- `<type>` is one of `nautobot-app`, `netbox-plugin`, `custom-script`.
- Creates `<owner>/<repo-name>` on GitHub. `--owner` defaults to whichever
  account `gh` is currently authenticated as (`gh api user --jq .login`);
  pass `--owner` explicitly to target an org, or `--private` for a private
  repo.
- Copies `templates/<type>/` into the new repo, stripping `.tmpl` extensions
  and substituting `{{PROJECT_NAME}}`-style placeholders. Placeholders with
  an obvious default (`PROJECT_NAME`, `BASE_BRANCH`, `OWNER_GITHUB_HANDLE`,
  `APP_NAME`, `PYTHON_PACKAGE`, `AUTHOR_NAME`, `ADDITIONAL_CONVENTIONS`,
  `TEST_COMMAND` → `pytest`, `NAUTOBOT_VERSION` → `^3.0.0`, `NETBOX_VERSION`
  → `v4.5.0`) are filled in automatically, overridable with `--set
  KEY=VALUE` (repeatable). `ENTRY_POINT` (`custom-script` only) has no
  default and always needs `--set ENTRY_POINT=...` — there is no defensible
  guess for a script's main file — or is prompted for interactively if the
  script is run at a terminal without it. `REQUESTER_GITHUB` likewise has no
  default, for every project type — the requester's GitHub account, not a
  self-reported name/email/phone (see `DESIGN.md`'s "Intake and requester
  identity") — rendered into the new repo's `README.md`.
- Substitution is byte-for-byte literal, including an explicit fix for a
  Bash footgun: `${var//pattern/replacement}` treats an unescaped `&` in the
  *replacement* text as "the matched pattern" (sed-style), not a literal
  ampersand. A value like `--description "Support & feedback"` rendered
  naively would splice the placeholder token back into the middle of its own
  output. `factory-new.sh` escapes `\` then `&` in every substituted value
  before replacement, so this can't happen regardless of what a human types.
- Applies `templates/_shared/labels.json` to the new repo via
  `gh label create --force`.
- Appends `{repo, type, createdAt, status: "active", ask, requesterGithub}`
  to this repo's own `projects.json` (written locally — commit and push it
  yourself, the script tells you the command at the end).
- `--dry-run` builds the scaffold under a temp directory and prints its path
  without touching GitHub or `projects.json` — useful for checking template
  rendering before creating anything.

Run `scripts/factory-secrets.sh` on the new repo next — a fresh repo has no
`claude-go` pipeline until its secrets are set.

## factory-secrets.sh

```sh
scripts/factory-secrets.sh my-new-tool
```

Reads `CLAUDE_CODE_OAUTH_TOKEN` from `.env` at this repo's root and prompts
for `GH_PAT` interactively (input hidden) every run — sets both as Actions
secrets on `<owner>/<repo-name>` (`--owner` defaults the same way as
`factory-new.sh`; `--env-file` for a different `.env` location). Errors
clearly if `.env` or `CLAUDE_CODE_OAUTH_TOKEN` is missing. After reading the
pasted `GH_PAT`, it prints a masked confirmation (`***...xyz (93 chars)`) —
everything but the last 3 characters — so a bad clipboard paste is
catchable with Ctrl-C before it's written anywhere, rather than surfacing
later as an opaque 401 in a workflow run.

### Why `GH_PAT` is handled differently from `CLAUDE_CODE_OAUTH_TOKEN`

`CLAUDE_CODE_OAUTH_TOKEN` is a Claude subscription credential, not a GitHub
one — safely reusable across every project, since a leak costs quota, not
repo access. It lives in `.env` like any other local secret.

`GH_PAT` is deliberately **never** read from `.env` and **never** written to
disk anywhere. `DESIGN.md`'s "GH_PAT: token strategy" has the full history:
a single, shared, `.env`-stored `GH_PAT` copied into every generated
project's own secret was tried in the predecessor and rejected — one leak
from any *one* generated repo would expose a token that can act on *all* of
them. Instead, mint a fresh fine-grained PAT scoped to "Only select
repositories: `<that one repo>`" (works because the repo already exists by
the time this script runs — run `factory-new.sh` first) with `Contents`,
`Issues`, `Pull requests`, `Actions`, `Secrets` (Read and write) — never
`Administration`, never "All repositories" — and paste it at the prompt.
`factory-secrets.sh` holds it only in process memory for the few seconds it
takes to call `gh secret set`, then `unset`s it before exiting.

### `.env`

Copy `.env.example` (this repo's root) to `.env` and fill in
`CLAUDE_CODE_OAUTH_TOKEN` (mint with `claude setup-token`) — gitignored,
never committed, structurally can't be `git add -A`-ed by accident since it
lives inside the checkout but outside anything git ever considers tracking.
`GH_PAT` is intentionally not part of this file — see above. `.env.example`
also documents optional `NAUTOBOT_VERSION`/`NETBOX_VERSION` defaults
consumed by `--set` overrides, not read directly by either script.
