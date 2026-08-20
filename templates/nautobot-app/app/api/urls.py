"""REST API URL routing for {{PROJECT_NAME}}.

Empty on purpose -- register a `NautobotAPIRouter` and wire viewsets in as models are added.
"""

from nautobot.apps.api import NautobotAPIRouter

router = NautobotAPIRouter()

app_name = "app-api"
urlpatterns = router.urls
