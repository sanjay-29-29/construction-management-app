from rest_framework.response import Response
from django.db.models import Subquery
from django.db.models import F
from django.db.models import OuterRef
from django.db.models import Value
from django.db.models.functions import Coalesce
from django.db.models import DecimalField
from django.db.models import Sum
from django_filters import rest_framework as filters

from rest_framework import status
from rest_framework import viewsets
from rest_framework import generics

from sites import models as sites_models
from rate_work import models as rate_work_models

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
        if self.action == "list":
            return serializers.LabourListSerializer
        if self.action == "retrieve":
            return serializers.LabourRetrieveSerializer
        return serializers.LabourCreateUpdateSerializer

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = generics.get_object_or_404(sites_models.Site, pk=site_id)
        serializer.save(site=site_instance)

    def get_queryset(self):
        site = self.kwargs.get("site_id")
        queryset = models.Labour.objects.filter(site=site)

        if self.action == "retrieve":
            rate_work_payments_subquery = (
                rate_work_models.RateWork.objects.filter(
                    labour=OuterRef("id"),
                )
                .values("labour")
                .annotate(total=Sum(F("cost_per_unit") * F("quantity")))
                .values("total")
            )

            queryset = queryset.prefetch_related(
                "documents",
                "rate_work_payments",
                "rate_works",
            ).annotate(
                amount_paid=Coalesce(
                    Sum("rate_work_payments__amount"),
                    Value(
                        0, output_field=DecimalField(max_digits=12, decimal_places=2)
                    ),
                ),
                rate_work_payment_total=Subquery(
                    rate_work_payments_subquery, output_field=DecimalField()
                ),
            )

        return queryset


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
    def create(self, request, *args, **kwargs):
        data = {"documents": request.FILES.getlist("documents")}
        labour = generics.get_object_or_404(models.Labour, pk=kwargs.get("labour_id"))
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
