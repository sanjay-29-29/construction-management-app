from django.db.models.expressions import Value, OuterRef, Subquery
from django.db.models.fields import DecimalField
from django.db.models.functions.comparison import Coalesce
from rest_framework import viewsets
from django.db.models import Sum

from users import models as users_models
from orders import models as orders_models

from . import models as models
from . import serializers as serializers


class VendorPaymentCreateView(viewsets.generics.CreateAPIView):
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

    def get_queryset(self):
        vendor_id = self.kwargs.get("vendor_id")
        queryset = models.VendorPayment.objects.filter(vendor=vendor_id)
        return queryset


class VendorViewSet(viewsets.ModelViewSet):

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.VendorRetrieveSerializer
        return serializers.VendorListSerializer

    def get_queryset(self):
        queryset = models.Vendor.objects.all().filter(is_deleted=False)

        if (
            self.request.user.role != users_models.Roles.HEAD_OFFICE
            and self.request.user.role != users_models.Roles.ADMIN
        ):
            return None

        if self.action == "retrieve":
            order_cost = (
                orders_models.Order.objects.filter(vendor=OuterRef("pk"))
                .values("vendor")
                .annotate(total=Sum("cost"))
                .values("total")
            )

            payment_sum = (
                models.VendorPayment.objects.filter(vendor=OuterRef("pk"))
                .values("vendor")
                .annotate(total=Sum("amount"))
                .values("total")
            )
            queryset = queryset.annotate(
                order_cost=Coalesce(
                    Subquery(
                        order_cost,
                        output_field=DecimalField(max_digits=12, decimal_places=2),
                    ),
                    Value(
                        0, output_field=DecimalField(max_digits=12, decimal_places=2)
                    ),
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                ),
                amount_paid=Coalesce(
                    Subquery(
                        payment_sum,
                        output_field=DecimalField(max_digits=12, decimal_places=2),
                    ),
                    Value(
                        0, output_field=DecimalField(max_digits=12, decimal_places=2)
                    ),
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                ),
            ).prefetch_related("payments")
        return queryset

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()
