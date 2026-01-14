from django.urls.conf import path

from . import views as views


weekly_labour_list = views.WeekLabourAssignmentViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

weekly_labour_detail = views.WeekLabourAssignmentViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)

week_list = views.WeekViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

week_detail = views.WeekViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)


urlpatterns = [
    path(
        "weeks/<uuid:week_id>/payment/",
        views.WeekPaymentListSerializer.as_view(),
    ),
    path(
        "sites/<uuid:site_id>/weeks/",
        week_list,
        name="week-list",
    ),
    path(
        "sites/<uuid:site_id>/weeks/<uuid:pk>/",
        week_detail,
        name="weeky-detail",
    ),
    path(
        "sites/<uuid:site_id>/weeks/<uuid:week_id>/days/<uuid:pk>/",
        views.DailyEntryRetrieveUpdateView.as_view(),
    ),
    path(
        "sites/<uuid:site_id>/weeks/<uuid:week_id>/labours/",
        weekly_labour_list,
        name="weeky-labour-list",
    ),
    path(
        "sites/<uuid:site_id>/weeks/<uuid:week_id>/labours/<uuid:pk>/",
        weekly_labour_detail,
        name="weeky-labour-detail",
    ),
]
