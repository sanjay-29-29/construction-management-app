from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, generics

from sites import models as sites_models

from . import models as models
from . import serializers as serializers


class HeadViewset(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.HeadSerializer

    def get_queryset(self):
        site_id = self.kwargs.get("site_id")
        queryset = models.Head.objects.all()

        if self.action == "list":
            queryset = queryset.filter(Q(site=site_id) | Q(is_common=True))

        return queryset

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = generics.get_object_or_404(
            sites_models.Site,
            pk=site_id,
        )
        serializer.save(site=site_instance)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class EntryViewset(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return serializers.EntrySerializer
        return serializers.EntryListSerializer

    def get_queryset(self):
        site_id = self.kwargs.get("site_id")
        queryset = models.Entry.objects.filter(site=site_id).order_by("-created_at")

        return queryset

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = generics.get_object_or_404(
            sites_models.Site,
            pk=site_id,
        )
        serializer.save(created_by=self.request.user, site=site_instance)
