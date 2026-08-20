"""REST API URL routing for {{PROJECT_NAME}}.

Empty on purpose -- register a NetBoxRouter and wire viewsets in as models are added.
"""

from netbox.api.routers import NetBoxRouter

router = NetBoxRouter()

app_name = "plugin-api"
urlpatterns = router.urls
