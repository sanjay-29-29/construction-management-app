from rest_framework.permissions import IsAuthenticated
from django.db.models.fields import DecimalField
from django.db.models.expressions import ExpressionWrapper
from django.db.models.functions.comparison import Coalesce
from rest_framework import viewsets
from django.db.models import Sum

from users import models as users_models

from .models import Vendor
from .serializers import VendorSerializer


class VendorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Vendor.objects.all()

    def get_queryset(self):
        if self.request.user.role == users_models.Roles.HEAD_OFFICE:
            return self.queryset.annotate(
                amount_paid=ExpressionWrapper(
                    Coalesce(Sum("orders__cost"), 0),
                    output_field=DecimalField(),
                ),
                order_cost=ExpressionWrapper(
                    Coalesce(Sum("orders__paid"), 0),
                    output_field=DecimalField(),
                ),
            )
            return self.queryset
        return None

    serializer_class = VendorSerializer
