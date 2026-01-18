from rest_framework.permissions import IsAuthenticated
from django.db.models.fields import DecimalField
from django.db.models.expressions import ExpressionWrapper
from django.db.models.functions.comparison import Coalesce
from rest_framework import viewsets
from django.db.models import Sum

from users import models as users_models

from . import models as models
from . import serializers as serializers


class VendorPaymentCreateView(viewsets.generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.VendorPaymentCreateSerializer

    def get_queryset(self):
        queryset = models.VendorPayment.objects.all()
        return queryset

    def perform_create(self, serializer):
        vendor_id = self.kwargs.get("vendor_id")
        vendor_instance = viewsets.generics.get_object_or_404(
            models.Vendor, pk=vendor_id
        )
        serializer.save(vendor=vendor_instance)


class VendorPaymentDeleteView(viewsets.generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        vendor_id = self.kwargs.get("vendor_id")
        queryset = models.VendorPayment.objects.filter(vendor=vendor_id)
        return queryset


class VendorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.VendorRetrieveSerializer
        return serializers.VendorListSerializer

    def get_queryset(self):
        queryset = models.Vendor.objects.all()

        if (
            self.request.user.role != users_models.Roles.HEAD_OFFICE
            and self.request.user.role != users_models.Roles.ADMIN
        ):
            return None

        if self.action == "retrieve":
            return queryset.prefetch_related("payments").annotate(
                amount_paid=ExpressionWrapper(
                    Coalesce(Sum("orders__cost"), 0),
                    output_field=DecimalField(),
                ),
                order_cost=ExpressionWrapper(
                    Coalesce(Sum("payments__amount"), 0),
                    output_field=DecimalField(),
                ),
            )

        return queryset
