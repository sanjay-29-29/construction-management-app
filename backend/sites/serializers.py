from django.db import transaction
import rest_framework.serializers as serializers

from users.serializers import UserSerializer
from users.models import SiteSupervisor


from .models import Site


class ListSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = "__all__"


class RetrieveSiteSerializer(ListSiteSerializer):
    total_order_cost = serializers.FloatField(read_only=True)
    supervisors = UserSerializer(many=True, read_only=True)


class CreateSiteSerializer(serializers.ModelSerializer):
    supervisors = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = Site
        fields = [
            "name",
            "address",
            "supervisors",
            "is_active",
        ]

    def create(self, validated_data):
        supervisor_ids = validated_data.pop("supervisors", [])

        with transaction.atomic():
            site = Site.objects.create(**validated_data)

            if supervisor_ids:
                SiteSupervisor.objects.bulk_create(
                    [SiteSupervisor(site=site, user_id=s_id) for s_id in supervisor_ids]
                )

        return site

    def update(self, instance, validated_data):
        supervisors_ids = validated_data.pop("supervisors", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if supervisors_ids is not None:
            instance.sitesupervisor_set.all().delete()
            SiteSupervisor.objects.bulk_create(
                [
                    SiteSupervisor(site=instance, user_id=s_id)
                    for s_id in supervisors_ids
                ]
            )

        instance.save()

        return instance


class SiteDropdownSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source="name")
    value = serializers.CharField(source="id")

    class Meta:
        model = Site
        fields = [
            "label",
            "value",
        ]
