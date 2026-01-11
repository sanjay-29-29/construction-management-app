from rest_framework import routers

from .views import VendorViewSet

router = routers.DefaultRouter()

router.register("vendors", VendorViewSet, basename="vendors")

urlpatterns = router.urls
