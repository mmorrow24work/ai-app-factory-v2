"""{{PROJECT_NAME}} -- a Nautobot App.

NOTE: this package is literally named `app` in the template -- factory-new.sh only substitutes
double-curly placeholder tokens inside file content, never directory names. If {{PYTHON_PACKAGE}}
differs from `app`, rename this directory (and update pyproject.toml's `packages`/`plugins`
entries) to match before adding functionality -- see CLAUDE.md's "Repo map".
"""

from importlib import metadata

from nautobot.apps import NautobotAppConfig

try:
    __version__ = metadata.version("{{APP_NAME}}")
except metadata.PackageNotFoundError:
    # Package not installed (e.g. running straight from a checkout without `poetry install`).
    __version__ = "0.1.0-dev"


# Class name deliberately generic (not derived from {{PROJECT_NAME}}/{{APP_NAME}}) --
# factory-new.sh has no placeholder that renders a project name as a PascalCase Python
# identifier, and introducing one here would add a new required --set value to every
# scaffold run for a cosmetic class name. Rename it by hand if this app grows enough that a
# generic name stops being clear.
class AppConfig(NautobotAppConfig):
    """Nautobot App configuration for {{PROJECT_NAME}}."""

    name = "app"
    verbose_name = "{{PROJECT_NAME}}"
    description = "{{PROJECT_DESCRIPTION}}"
    version = __version__
    author = "{{AUTHOR_NAME}}"
    base_url = "app"
    required_settings = []
    min_version = "2.0.0"
    max_version = "3.9999"
    default_settings = {}
    caching_config = {}


config = AppConfig
