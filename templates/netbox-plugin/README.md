# netbox-plugin template

Scaffold for a NetBox plugin project driven by the ai-app-factory-v2 unattended (Lane B)
pipeline. Not copied into generated repos itself -- `factory-new.sh` renders every other file
in this directory (stripping `.tmpl` suffixes and substituting double-curly placeholder tokens) into
the new repo; this meta README is skipped.

See `../_shared/labels.json` for the label taxonomy applied to every generated repo, and this
repo's own `DESIGN.md` for the pipeline this template plugs into.

Placeholders this template needs: `PROJECT_NAME`, `PROJECT_DESCRIPTION`, `BASE_BRANCH`,
`OWNER_GITHUB_HANDLE`, `REQUESTER_GITHUB`, `APP_NAME` (defaults to the repo name),
`PYTHON_PACKAGE` (defaults to a slugified repo name), `AUTHOR_NAME`, `NETBOX_VERSION`
(defaults to `v4.5.0`), `ADDITIONAL_CONVENTIONS`, `FACTORY_REPO`.

The shipped `plugin/` package directory is a literal, un-templated name -- see
`CLAUDE.md.tmpl`'s "Repo map" for why, and rename it to match `{{PYTHON_PACKAGE}}` if it
differs from `plugin`.
