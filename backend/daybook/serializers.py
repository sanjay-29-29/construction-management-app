from rest_framework import serializers

from . import models as models


class HeadSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Head
        fields = [
            "id",
            "name",
            "created_at",
            "is_common",
            "is_deleted",
            "site",
        ]


class EntryListSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format="%Y-%m-%d")
    payment_type = serializers.SerializerMethodField()

    class Meta:
        model = models.Entry
        fields = [
            "id",
            "head",
            "description",
            "created_at",
            "created_by",
            "reference",
            "payment_type",
            "amount_db",
            "amount_cr",
        ]

    def get_payment_type(self, obj):
        return obj.get_payment_type_display()

    def get_created_by(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}"


class EntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Entry
        fields = [
            "head",
            "description",
            "reference",
            "payment_type",
            "amount_db",
            "amount_cr",
        ]
