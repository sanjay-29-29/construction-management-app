from django.urls.conf import path
from rest_framework.routers import DefaultRouter

from .views import SiteViewSet, SiteDropdown

router = DefaultRouter()

router.register("sites", SiteViewSet, basename="site")

urlpatterns = [
    path("sites/dropdown/", SiteDropdown.as_view()),
]

urlpatterns += router.urls
