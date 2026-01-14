from django_filters import rest_framework as filters

from rest_framework import status
from rest_framework import viewsets
from rest_framework import generics

from sites import models as sites_models

from . import filters as labours_filters
from . import serializers as serializers
from . import models as models


class LabourViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.LabourSerializer
    filter_backends = [
        filters.DjangoFilterBackend,
    ]
    filterset_class = labours_filters.LabourFilter

    def get_serializer_class(self):
        if self.action == "list" or self.action == "retrieve":
            return serializers.LabourRetrieveSerializer
        return serializers.LabourCreateUpdateSerializer

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = generics.get_object_or_404(sites_models.Site, pk=site_id)
        serializer.save(site=site_instance)

    def get_queryset(self):
        site = self.kwargs.get("site_id")
        return models.Labour.objects.filter(site=site).prefetch_related("documents")


class LabourDropdownView(generics.ListAPIView):
    serializer_class = serializers.LabourDropdownSerializer
    filter_backends = [
        filters.DjangoFilterBackend,
    ]
    filterset_class = labours_filters.LabourFilter

    def get_queryset(self):
        site_id = self.kwargs.get("site_id")
        queryset = models.Labour.objects.filter(site=site_id)
        return queryset


class LabourDocumentCreateView(generics.CreateAPIView):
    def create(self, request, labour_id):
        data = {"documents": request.FILES.getlist("documents")}
        labour = generics.get_object_or_404(models.Labour, pk=labour_id)
        serializer = serializers.LabourDocumentCreateSerializer(
            data=data, context={"labour": labour}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Documents uploaded successfully"},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LabourDocumentDeleteView(generics.DestroyAPIView):
    def get_queryset(self):
        labour_id = self.kwargs.get("labour_id")
        return models.LabourDocument.objects.filter(labour=labour_id)
