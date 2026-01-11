from rest_framework import serializers

from .models import Vendor


class VendorSerializer(serializers.ModelSerializer):
    amount_paid = serializers.FloatField(read_only=True, required=False)
    order_cost = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = Vendor
        fields = [
            "id",
            "name",
            "address",
            "notes",
            "created_at",
            "amount_paid",
            "order_cost",
        ]
        read_only_fields = (
            "id",
            "created_at",
        )
