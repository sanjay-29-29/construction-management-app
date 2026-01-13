from django.urls.conf import path
from rest_framework import routers

from . import views as views

router = routers.DefaultRouter()

router.register("vendors", views.VendorViewSet, basename="vendors")

urlpatterns = [
    path(
        "vendors/<uuid:vendor_id>/payments/",
        views.VendorPaymentCreateView.as_view(),
    ),
    path(
        "vendors/<uuid:vendor_id>/payments/<uuid:pk>/",
        views.VendorPaymentDeleteView.as_view(),
    ),
]

urlpatterns += router.urls
