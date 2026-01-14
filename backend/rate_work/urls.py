from django.urls.conf import path

from . import views as views

rate_work_list = views.RateWorkViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

rate_work_detail = views.RateWorkViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)


urlpatterns = [
    path(
        "sites/<uuid:site_id>/rate-work/",
        rate_work_list,
        name="rate-work-list",
    ),
    path(
        "sites/<uuid:site_id>/rate-work/<uuid:pk>/",
        rate_work_detail,
        name="rate-work-detail",
    ),
    path(
        "rate-work/<uuid:rate_work_id>/payments/",
        views.RateWorkPaymentCreateView.as_view(),
    ),
    path(
        "rate-work/<uuid:rate_work_id>/payments/<uuid:pk>/",
        views.RateWorkPaymentDeleteUpdateView.as_view(),
    ),
]
