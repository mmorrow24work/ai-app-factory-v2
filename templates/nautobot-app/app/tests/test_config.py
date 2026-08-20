"""Smoke test for {{PROJECT_NAME}}'s app config -- run via
`poetry run nautobot-server test app` (or `{{PYTHON_PACKAGE}}` if the `app/` directory has been
renamed to match, see CLAUDE.md's "Repo map")."""

from django.apps import apps
from django.test import TestCase


class AppConfigTestCase(TestCase):
    def test_app_is_installed(self):
        self.assertIn("app", [cfg.name for cfg in apps.get_app_configs()])
