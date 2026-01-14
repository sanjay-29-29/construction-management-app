from rest_framework import serializers

from labours import models as labours_models

from . import models as models


class RateWorkPaymentSerializer(serializers.ModelSerializer):

    class Meta:
        fields = ["id", "amount", "note", "date_created"]
        read_only_fields = ["date_created"]
        model = models.RatePayment


class RateWorkListSerializer(serializers.ModelSerializer):
    quantity = serializers.FloatField()
    cost_per_unit = serializers.FloatField()
    labour_name = serializers.CharField(source="labour.name", read_only=True)

    class Meta:
        model = models.RateWork
        fields = [
            "name",
            "quantity",
            "cost_per_unit",
            "id",
            "is_completed",
            "labour_name",
            "unit",
        ]


class RateWorkRetrieveSerializer(serializers.ModelSerializer):
    quantity = serializers.FloatField()
    cost_per_unit = serializers.FloatField()
    labour_name = serializers.CharField(source="labour.name", read_only=True)
    payments = RateWorkPaymentSerializer(many=True, read_only=True)
    paid = serializers.FloatField(read_only=True)

    class Meta:
        model = models.RateWork
        fields = [
            "paid",
            "name",
            "quantity",
            "cost_per_unit",
            "id",
            "is_completed",
            "labour_name",
            "unit",
            "payments",
        ]


class RateWorkUpdateSerializer(serializers.ModelSerializer):
    labour = serializers.PrimaryKeyRelatedField(
        queryset=labours_models.Labour.objects.all(),
    )

    class Meta:
        model = models.RateWork
        fields = [
            "name",
            "quantity",
            "cost_per_unit",
            "id",
            "labour",
            "unit",
            "is_completed",
        ]
