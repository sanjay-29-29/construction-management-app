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


labour_detail = views.LabourViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)


labour_list = views.LabourViewSet.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

labour_detail = views.LabourViewSet.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)

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


urlpatterns = [
    path(
        "sites/<uuid:site_id>/labours/<uuid:labour_id>/rate-work/",
        rate_work_list,
        name="rate-work-list",
    ),
    path(
        "sites/<uuid:site_id>/labours/<uuid:labour_id>/rate-work/<uuid:pk>/",
        rate_work_detail,
        name="rate-work-detail",
    ),
    path("sites/<uuid:site_id>/labours/", labour_list, name="site-labour-list"),
    path(
        "sites/<uuid:site_id>/labours/<uuid:pk>/",
        labour_detail,
        name="site-labour-detail",
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
    path("sites/<uuid:site_id>/weeks/", views.WeekListCreateView.as_view()),
    path("sites/<uuid:site_id>/weeks/<uuid:pk>/", views.WeekRetrieveView.as_view()),
    path(
        "sites/<uuid:site_id>/weeks/<uuid:week_id>/days/<uuid:pk>/",
        views.DailyEntryRetrieveUpdateView.as_view(),
    ),
]
