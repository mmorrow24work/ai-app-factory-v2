# Backlog

Deferred-consideration items, recorded but not acted on. Each entry below is a one-line
pointer for a future pass, not a commitment or a design decision.

## Initial build (this repo's from-scratch construction)

Carried forward from `ai-app-factory` (the predecessor)'s own backlog, still genuinely open
here since a fresh implementation doesn't solve any of these by construction:

- **Reliability / failure recovery.** No distinction between a run that's silently stalled and
  one still legitimately in progress; no retry or alerting path for either.
- **Cross-project observability.** No single "what's stuck across every tracked project" view.
- **State integrity.** `projects.json` is hand-maintained at provisioning time, never
  reconciled against actual repo/Actions state.
- **Cost tracking beyond tokens.** `docs/journal.md` tracks notional token cost; nothing
  combines that with Actions minutes or real API $.
- **Extensibility of project types.** Only `nautobot-app`, `netbox-plugin`, `custom-script`
  exist; no documented path for a fourth template type.
- **Onboarding continuity.** Unverified whether a fresh Claude Code session, given only this
  repo's own docs, actually reconstructs the same mental model a human building it
  incrementally would have — worth a deliberate cold-start test once this repo has some real
  history of its own to test against.

Addressed proactively in this initial build, unlike the predecessor (see `DESIGN.md`'s M7):
testing/CI on the factory itself, and Dependabot for `site/`'s npm dependencies — both cheap
enough relative to a from-scratch rebuild to include from the start rather than defer twice.
