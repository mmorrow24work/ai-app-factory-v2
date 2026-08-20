# Sidebar: building a GitHub repo inside a Cowork sandbox

Not part of this repo's design or architecture — a standalone note on the mechanics of how a
repo like this one gets built by Claude in a Cowork sandbox session and handed to a human,
since that process left visible fingerprints on `ai-app-factory-v2`'s own early history (see
`DESIGN.md`'s "Provenance" section for the specific, concrete example).

## Why a bundle/archive handoff, not a direct push

A Cowork sandbox is an ephemeral, isolated cloud container. It has a working git installation
and can run any git command locally, but it has **no standing GitHub credential of its own**,
and even when a human hands one over mid-session (a PAT, pasted into the conversation), the
sandbox's outbound network sits behind a proxy that only permits pushes to repositories
explicitly authorized for that session — a brand-new repo that doesn't exist yet cannot be
pre-authorized, because nothing has told the proxy about it. Separately, even a correctly
-scoped fine-grained PAT is structurally denied `workflow` scope by GitHub itself, so it can
never push `.github/workflows/*.yml` changes regardless of proxy rules — a second, unrelated
limitation that shows up any time a sandbox-authored change touches a workflow file (this
repo's own predecessor, `ai-app-factory`, hit exactly this — see its own `README.md`'s "Known
limitations").

Net effect: a sandbox can build a complete, working repository on local disk, but cannot be the
thing that pushes it to GitHub for the first time. Two ways around that:

1. **A fine-grained PAT scoped to an already-existing repo** — works for ongoing changes to a
   repo that already exists on GitHub (this is how the hardening pass on `ai-app-factory`
   itself was delivered: branch pushed, PR opened, all via a PAT the human minted and revoked
   afterward). Doesn't work for creating a *brand-new* repo from nothing, both because of the
   proxy's authorized-repository-set restriction and because repo creation itself needs
   broader token scope than a single-repo-scoped PAT grants.
2. **Package the whole repo as a portable artifact and hand it to the human to push
   themselves** — the only option when there's no existing GitHub repo yet to scope a
   credential to. This is what produced `ai-app-factory-v2`.

## Bundle vs. plain archive

Two formats came out of the `ai-app-factory-v2` build, for different purposes:

- **`git bundle`** — a single file containing the full git history (every commit, not just the
  working tree). `git clone <bundle-file> <destination>` reconstructs a real git repository
  from it, ready to add a `origin` remote and push — this is the one actually meant to be used
  to stand the repo up, since it preserves the commit history rather than starting fresh.
- **Plain `.tar.gz` archive** — just the files as they existed at hand-off time, no git history
  at all. Unpacking it means running `git init` yourself, which is a real, separate decision
  point: git's actual built-in default branch name is `master`, not `main` — `main` only
  happens if something (GitHub, your OS's git packaging, a dotfile) explicitly configured
  `init.defaultBranch = main` first. If you unpack the tarball and just run `git init`, you may
  end up on `master` while every workflow in the repo assumes `main`, reproducing the exact
  branch-mismatch history documented in `DESIGN.md`'s "Provenance" section — this time for real
  keystrokes-you-typed reasons rather than a Cowork sandbox's own `git init` default.

`ai-app-factory-v2.tar.gz` is kept in this repo (see wherever it's stored, e.g.
[`artifacts/`](../artifacts/) — check the repo root or a release asset for the current
location) specifically so anyone curious can reproduce that path deliberately: unpack it fresh,
run a bare `git init`, and watch the same branch-default mismatch happen live, rather than just
reading about it after the fact.

## What to actually do differently

If you're the one running the sandbox-to-GitHub handoff for a future repo built this way:

- Prefer the bundle over the tarball when both are available — it's directly `git clone`-able
  and skips the `git init` default-branch question entirely, since the bundle already carries
  whatever branch name the sandbox used.
- If you do start from a tarball (or any fresh `git init`, sandbox-built or not), run
  `git init -b main` explicitly rather than a bare `git init` — don't rely on your local
  environment's default matching whatever branch name the repo's own workflow files assume.
- If a mismatch happens anyway, `DESIGN.md`'s "Provenance" section has the full remediation
  command sequence used to fix it here, including the less-obvious second half (a GitHub Pages
  deployment environment's branch lock not following a later default-branch rename).
