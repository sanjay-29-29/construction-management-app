from django.contrib.auth import get_user_model
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
    supervisors = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(), many=True, required=False
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
        supervisors = validated_data.pop("supervisors", [])
        site = Site.objects.create(**validated_data)

        SiteSupervisor.objects.bulk_create(
            [SiteSupervisor(site=site, user=s) for s in supervisors]
        )
        return site

    def update(self, instance, validated_data):
        supervisors = validated_data.pop("supervisors", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if supervisors is not None:
            SiteSupervisor.objects.filter(site=instance).delete()

            SiteSupervisor.objects.bulk_create(
                [SiteSupervisor(site=instance, user=user) for user in supervisors]
            )

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
