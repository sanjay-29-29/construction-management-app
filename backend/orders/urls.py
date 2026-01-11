from rest_framework.routers import DefaultRouter
from django.urls.conf import path
from .views import (
    OrderViewSet,
    ListOrderBySite,
    ListOrderByVendor,
    OrderImageUploadView,
    OrderImageDeleteView,
)

router = DefaultRouter()

router.register("orders", OrderViewSet, basename="orders")

urlpatterns = [
    path("sites/<uuid:site_id>/orders/", ListOrderBySite.as_view()),
    path("vendors/<uuid:vendor_id>/orders/", ListOrderByVendor.as_view()),
    path("orders/<uuid:order_id>/images/", OrderImageUploadView.as_view()),
    path(
        "orders/<uuid:order_id>/images/<uuid:image_id>/", OrderImageDeleteView.as_view()
    ),
]

urlpatterns += router.urls
