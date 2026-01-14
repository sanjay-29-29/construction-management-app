from rest_framework import serializers

from . import models as models


class LabourDropdownSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source="name")
    value = serializers.CharField(source="id")

    class Meta:
        model = models.Labour
        fields = (
            "label",
            "value",
        )


class LabourDocumentCreateSerializer(serializers.Serializer):
    documents = serializers.ListField(
        child=serializers.FileField(),
        allow_empty=False,
    )

    def create(self, validated_data):
        documents_data = validated_data.get("documents", [])
        labour = self.context.get("labour")

        document_instances = models.LabourDocument.objects.bulk_create(
            [
                models.LabourDocument(
                    labour=labour,
                    document=document_file,
                    file_name=document_file.name,
                )
                for document_file in documents_data
            ]
        )
        return document_instances


class LabourCreateUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Labour
        fields = [
            "name",
            "type",
            "gender",
            "previous_balance",
            "bank_account_number",
            "aadhar_number",
            "ifsc_code",
            "branch_name",
            "photo",
        ]


class LabourDocumentRetrieveSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.LabourDocument
        fields = [
            "id",
            "document",
            "file_name",
        ]


class LabourRetrieveSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="get_type_display", read_only=True)
    gender = serializers.CharField(source="get_gender_display", read_only=True)
    documents = LabourDocumentRetrieveSerializer(many=True)

    class Meta:
        model = models.Labour
        fields = [
            "id",
            "name",
            "type",
            "gender",
            "aadhar_number",
            "bank_account_number",
            "ifsc_code",
            "branch_name",
            "photo",
            "documents",
        ]


class LabourSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="get_type_display", read_only=True)
    gender = serializers.CharField(source="get_gender_display", read_only=True)

    class Meta:
        model = models.Labour
        fields = [
            "id",
            "name",
            "type",
            "gender",
        ]
