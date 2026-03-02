from django.urls import path

from . import views as views

entry_list = views.EntryViewset.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

entry_detail = views.EntryViewset.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)

head_list = views.HeadViewset.as_view(
    {
        "get": "list",
        "post": "create",
    }
)

head_detail = views.HeadViewset.as_view(
    {
        "get": "retrieve",
        "put": "update",
        "patch": "partial_update",
        "delete": "destroy",
    }
)

urlpatterns = [
    path(
        "sites/<uuid:site_id>/entries/",
        entry_list,
    ),
    path(
        "sites/<uuid:site_id>/entries/<uuid:pk>/",
        entry_detail,
    ),
    path(
        "sites/<uuid:site_id>/heads/",
        head_list,
    ),
    path(
        "sites/<uuid:site_id>/heads/<uuid:pk>/",
        head_detail,
    ),
]
