from django.db.models.aggregates import Sum
from django.db.models.fields import FloatField
from django.db.models.functions.comparison import Coalesce

from rest_framework import viewsets
from rest_framework import generics

from sites import models as sites_models

from . import serializers as serializers
from . import models as models


class RateWorkViewSet(viewsets.ModelViewSet):

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.RateWorkRetrieveSerializer
        if self.action == "list":
            return serializers.RateWorkListSerializer
        return serializers.RateWorkUpdateSerializer

    def get_queryset(self):
        site_id = self.kwargs.get("site_id")

        queryset = (
            models.RateWork.objects.filter(labour__site=site_id)
            .prefetch_related("payments")
            .select_related("labour")
        )

        if self.action == "retrieve":
            return queryset.annotate(
                paid=Coalesce(
                    Sum("payments__amount"),
                    0,
                    output_field=FloatField(),
                )
            )

        return queryset

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = generics.get_object_or_404(sites_models.Site, pk=site_id)
        serializer.save(site=site_instance)


class RateWorkPaymentCreateView(generics.CreateAPIView):
    serializer_class = serializers.RateWorkPaymentSerializer
    queryset = models.RatePayment.objects.all()

    def perform_create(self, serializer):
        rate_work_id = self.kwargs.get("rate_work_id")
        rate_work_instance = generics.get_object_or_404(
            models.RateWork, pk=rate_work_id
        )
        serializer.save(rate_work=rate_work_instance)


class RateWorkPaymentDeleteUpdateView(generics.RetrieveDestroyAPIView):
    serializer_class = serializers.RateWorkPaymentSerializer

    def get_queryset(self):
        rate_work_id = self.kwargs.get("rate_work_id")
        queryset = models.RatePayment.objects.filter(rate_work=rate_work_id)
        return queryset
