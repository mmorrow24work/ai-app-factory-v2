"""{{PROJECT_NAME}} -- a NetBox plugin.

NOTE: this package is literally named `plugin` in the template -- factory-new.sh only
substitutes double-curly placeholder tokens inside file content, never directory names. If
{{PYTHON_PACKAGE}} differs from `plugin`, rename this directory (and update pyproject.toml's
`packages.find`/`package-data` entries) to match before adding functionality -- see
CLAUDE.md's "Repo map".
"""

from netbox.plugins import PluginConfig


# Class name deliberately generic (not derived from {{PROJECT_NAME}}/{{APP_NAME}}) --
# factory-new.sh has no placeholder that renders a project name as a PascalCase Python
# identifier, and introducing one here would add a new required --set value to every scaffold
# run for a cosmetic class name.
class NetBoxPluginConfig(PluginConfig):
    """NetBox plugin configuration for {{PROJECT_NAME}}."""

    name = "plugin"
    verbose_name = "{{PROJECT_NAME}}"
    description = "{{PROJECT_DESCRIPTION}}"
    version = "0.1.0"
    author = "{{AUTHOR_NAME}}"
    base_url = "plugin"
    required_settings = []
    default_settings = {}
    min_version = "4.0.0"


config = NetBoxPluginConfig
