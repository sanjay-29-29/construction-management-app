from django.urls.conf import path

from . import views as views

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

urlpatterns = [
    path(
        "sites/<uuid:site_id>/labours/",
        labour_list,
        name="site-labour-list",
    ),
    path(
        "sites/<uuid:site_id>/labours/<uuid:pk>/",
        labour_detail,
        name="site-labour-detail",
    ),
    path(
        "sites/<uuid:site_id>/labours/dropdown/",
        views.LabourDropdownView.as_view(),
    ),
    path(
        "labours/<uuid:labour_id>/documents/",
        views.LabourDocumentCreateView.as_view(),
    ),
    path(
        "labours/<uuid:labour_id>/documents/<uuid:pk>/",
        views.LabourDocumentDeleteView.as_view(),
    ),
]
