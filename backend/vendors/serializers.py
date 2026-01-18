from rest_framework import serializers

from .models import Vendor, VendorPayment


class VendorPaymentCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = VendorPayment
        fields = [
            "id",
            "note",
            "amount",
            "date_created",
        ]


class VendorPaymentListSerializer(serializers.ModelSerializer):
    amount = serializers.FloatField()

    class Meta:
        model = VendorPayment
        fields = [
            "id",
            "note",
            "amount",
            "date_created",
        ]


class VendorListSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vendor
        fields = [
            "id",
            "name",
            "address",
            "notes",
            "gst_number",
            "bank_account_number",
            "ifsc_code",
            "created_at",
        ]
        read_only_fields = (
            "id",
            "created_at",
        )


class VendorRetrieveSerializer(serializers.ModelSerializer):
    amount_paid = serializers.FloatField(read_only=True, required=False)
    order_cost = serializers.FloatField(read_only=True, required=False)
    payments = VendorPaymentListSerializer(many=True, required=False, read_only=True)

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
            "payments",
            "bank_account_number",
            "ifsc_code",
            "gst_number",
        ]
        read_only_fields = (
            "id",
            "created_at",
        )
