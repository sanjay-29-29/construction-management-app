from django.db.models.aggregates import Sum
from django.db.models.fields import FloatField
from django.db.models.functions.comparison import Coalesce

from rest_framework import viewsets
from rest_framework import generics

from labours import models as labours_models

from . import serializers as serializers
from . import models as models


class RateWorkCreateView(generics.CreateAPIView):
    serializer_class = serializers.RateWorkCreateUpdateSerializer
    queryset = models.RateWork.objects.all()

    def perform_create(self, serializer):
        labour_id = self.kwargs.get("labour_id")
        labour_instance = generics.get_object_or_404(
            labours_models.Labour, pk=labour_id
        )
        serializer.save(labour=labour_instance)


class RateWorkUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = serializers.RateWorkCreateUpdateSerializer
    queryset = models.RateWork.objects.all()


class RateWorkPaymentCreateView(generics.ListCreateAPIView):
    serializer_class = serializers.RateWorkPaymentSerializer

    def get_queryset(self):
        labour_id = self.kwargs.get("labour_id")
        queryset = models.RatePayment.objects.filter(labour=labour_id)
        return queryset

    def perform_create(self, serializer):
        labour_id = self.kwargs.get("labour_id")
        labour_instance = generics.get_object_or_404(
            labours_models.Labour, pk=labour_id
        )
        serializer.save(labour=labour_instance)


class RateWorkPaymentDeleteView(generics.DestroyAPIView):
    serializer_class = serializers.RateWorkPaymentSerializer

    def get_queryset(self):
        labour_id = self.kwargs.get("labour_id")
        queryset = models.RatePayment.objects.filter(labour=labour_id)
        return queryset
