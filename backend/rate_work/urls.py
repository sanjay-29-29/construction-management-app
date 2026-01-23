from django.urls.conf import path

from . import views as views


urlpatterns = [
    path(
        "labours/<uuid:labour_id>/rate-work/",
        views.RateWorkCreateView.as_view(),
    ),
    path(
        "labours/<uuid:labour_id>/rate-work/<uuid:pk>/",
        views.RateWorkUpdateDestroyView.as_view(),
    ),
    path(
        "labours/<uuid:labour_id>/rate-work/payments/",
        views.RateWorkPaymentCreateView.as_view(),
    ),
    path(
        "labours/<uuid:labour_id>/rate-work/payments/<uuid:pk>/",
        views.RateWorkPaymentDeleteView.as_view(),
    ),
]
