from rest_framework import serializers

from labours import models as labours_models

from . import models as models


class RateWorkPaymentSerializer(serializers.ModelSerializer):

    class Meta:
        fields = ["id", "amount", "note", "date_created"]
        read_only_fields = ["date_created"]
        model = models.RatePayment


class RateWorkListSerializer(serializers.ModelSerializer):
    quantity = serializers.FloatField(read_only=True)
    cost_per_unit = serializers.FloatField(read_only=True)
    paid = serializers.FloatField(read_only=True)

    class Meta:
        model = models.RateWork
        fields = [
            "id",
            "paid",
            "name",
            "quantity",
            "cost_per_unit",
            "is_completed",
            "date_created",
            "total_cost",
            "unit",
        ]


class RateWorkCreateUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.RateWork
        fields = [
            "name",
            "quantity",
            "cost_per_unit",
            "id",
            "unit",
            "is_completed",
        ]
