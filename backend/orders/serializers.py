from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from fcm_django.models import FCMDevice
from firebase_admin.messaging import Message, Notification

from users.serializers import UserSerializer
from users.models import Roles

from .models import Material, Order, OrderImage


class OrderImageListSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderImage
        fields = ["image", "id"]


class OrderImageCreateSerializer(serializers.Serializer):

    images = serializers.ListField(child=serializers.ImageField(), allow_empty=False)

    def create(self, validated_data):
        order = self.context["order"]
        images = validated_data["images"]

        objs = [OrderImage(order=order, image=image) for image in images]

        OrderImage.objects.bulk_create(objs)
        return objs


class OrderImageDeleteSerializer(serializers.Serializer):

    def delete(self):
        order = self.context["order"]
        image_ids = self.validated_data["image_ids"]

        images = OrderImage.objects.filter(site=order, id__in=image_ids)

        for img in images:
            img.delete()

        return image_ids


class OrderMaterialSerializer(serializers.ModelSerializer):

    class Meta:
        model = Material
        fields = [
            "id",
            "name",
            "quantity",
            "unit",
            "price",
            "received_quantity",
        ]


class OrderMaterialReadSerializer(serializers.ModelSerializer):

    price = serializers.FloatField()
    quantity = serializers.FloatField()
    received_quantity = serializers.FloatField()

    class Meta:
        model = Material
        fields = [
            "id",
            "name",
            "quantity",
            "unit",
            "price",
            "received_quantity",
        ]


class OrderSerializer(serializers.ModelSerializer):

    materials = OrderMaterialSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = [
            "name",
            "site",
            "vendor",
            "materials",
            "number",
            "remarks",
            "is_completed",
        ]

    def create(self, validated_data):
        materials_data = validated_data.pop("materials")
        total_cost = Decimal("0.00")

        with transaction.atomic():
            order = Order.objects.create(**validated_data)

            materials = []
            for item in materials_data:
                line_total = item["price"] * item["quantity"]
                total_cost += line_total

                materials.append(
                    Material(
                        order=order,
                        name=item["name"],
                        quantity=item["quantity"],
                        unit=item["unit"],
                        price=item["price"],
                    )
                )

            Material.objects.bulk_create(materials)

            order.cost = total_cost
            order.save(update_fields=["cost"])

        return order

    def update(self, instance, validated_data):

        # 1️⃣ Extract materials if present
        materials_data = validated_data.pop("materials", None)

        # 2️⃣ Update order fields normally
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # 3️⃣ Update materials ONLY if provided
        if materials_data is not None:
            instance.materials.all().delete()
            Material.objects.bulk_create(
                [Material(order=instance, **material) for material in materials_data]
            )
            instance.cost = sum(
                material["quantity"] * material["price"] for material in materials_data
            )

        is_completed = validated_data.pop("is_completed", None)

        if is_completed is not None and is_completed:
            request = self.context.get("request")
            user = request.user if request else None
            user_name = user.get_full_name() if user else "Someone"

            FCMDevice.objects.filter(
                user__role__in=[
                    Roles.HEAD_OFFICE,
                    Roles.ADMIN,
                ]
            ).send_message(
                Message(
                    notification=Notification(
                        title="Order Updated",
                        body=f"Order {instance.name} is marked as completed by {user_name}",
                    ),
                    data={"internalRoute": f"orders/{instance.id}"},
                )
            )
            instance.completed_by = request.user

        instance.save()
        return instance


class OrderListSerializer(serializers.ModelSerializer):

    site = serializers.CharField(source="site.name")
    vendor = serializers.CharField(source="vendor.name")
    cost = serializers.FloatField()

    class Meta:
        model = Order
        fields = [
            "id",
            "name",
            "site",
            "vendor",
            "created_at",
            "is_completed",
            "cost",
            "remarks",
            "number",
        ]


class OrderRetrieveSerializer(serializers.ModelSerializer):

    materials = OrderMaterialReadSerializer(many=True)
    images = OrderImageListSerializer(many=True)
    site = serializers.CharField(source="site.name")
    vendor = serializers.CharField(source="vendor.name")
    completed_by = UserSerializer(read_only=True)
    cost = serializers.FloatField()

    class Meta:
        model = Order
        fields = [
            "id",
            "name",
            "site",
            "vendor",
            "materials",
            "created_at",
            "is_completed",
            "completed_by",
            "cost",
            "remarks",
            "images",
            "number",
        ]
