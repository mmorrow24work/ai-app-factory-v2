# custom-script template

Scaffold for a general-purpose script/CLI project driven by the ai-app-factory-v2 unattended
(Lane B) pipeline. Not copied into generated repos itself -- `factory-new.sh` renders every
other file in this directory (stripping `.tmpl` suffixes and substituting double-curly placeholder tokens
values) into the new repo; this meta README is skipped.

See `../_shared/labels.json` for the label taxonomy applied to every generated repo, and this
repo's own `DESIGN.md` for the pipeline this template plugs into.

Placeholders this template needs: `PROJECT_NAME`, `PROJECT_DESCRIPTION`, `BASE_BRANCH`,
`OWNER_GITHUB_HANDLE`, `REQUESTER_GITHUB`, `ENTRY_POINT` (no default -- always required),
`ADDITIONAL_CONVENTIONS`, `TEST_COMMAND`, `FACTORY_REPO`.
