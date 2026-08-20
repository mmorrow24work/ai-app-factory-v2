"""Smoke test for {{PROJECT_NAME}}'s plugin config -- run via
`python manage.py test plugin` (or `{{PYTHON_PACKAGE}}` if the `plugin/` directory has been
renamed to match, see CLAUDE.md's "Repo map")."""

from django.apps import apps
from django.test import TestCase


class PluginConfigTestCase(TestCase):
    def test_plugin_is_installed(self):
        self.assertIn("plugin", [cfg.name for cfg in apps.get_app_configs()])
