from django.db import transaction
from rest_framework import serializers

from . import models as models


class RateWorkSerializerListRetrieveSerializer(serializers.ModelSerializer):
    quantity = serializers.FloatField()
    amount = serializers.FloatField()

    class Meta:
        model = models.RateWork
        fields = ["name", "quantity", "amount", "id"]


class RateWorkUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.RateWork
        fields = ["name", "quantity", "amount", "id"]


class LabourCreateUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Labour
        fields = [
            "name",
            "type",
            "gender",
            "previous_balance",
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


class WeekLabourAssignmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.WeekLabourAssignment
        fields = [
            "labour",
            "weekly_daily_wage",
        ]


class WeekSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Week
        fields = [
            "id",
            "site",
            "start_date",
            "end_date",
            "labours",
        ]
        read_only_fields = [
            "site",
            "end_date",
        ]

    def validate_start_date(self, value):
        if value.weekday() != 5:
            raise serializers.ValidationError("The start date must be a Saturday.")
        return value


class LabourAttendanceRetrieveSerializer(serializers.ModelSerializer):
    advance_taken = serializers.FloatField()
    wage_for_day = serializers.FloatField()

    class Meta:
        model = models.LabourAttendance
        fields = [
            "labour",
            "is_present",
            "wage_for_day",
            "advance_taken",
        ]


class DailyEntryRetrieveSerializer(serializers.ModelSerializer):
    attendance = LabourAttendanceRetrieveSerializer(source="attendances", many=True)

    class Meta:
        model = models.DailyEntry
        fields = [
            "id",
            "date",
            "is_editable",
            "attendance",
        ]


class DailyEntryWithLabourRetrieveSerializer(serializers.ModelSerializer):
    attendance = LabourAttendanceRetrieveSerializer(source="attendances", many=True)
    labours = LabourSerializer(source="week.labours", many=True, read_only=True)

    class Meta:
        model = models.DailyEntry
        fields = [
            "id",
            "date",
            "is_editable",
            "attendance",
            "labours",
        ]


class LabourAttendanceUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.LabourAttendance
        fields = [
            "labour",
            "is_present",
            "wage_for_day",
            "advance_taken",
        ]


class DailyEntryUpdateSerializer(serializers.ModelSerializer):
    attendances = LabourAttendanceUpdateSerializer(many=True)

    class Meta:
        model = models.DailyEntry
        fields = ["admin_unlocked", "attendances"]

    def update(self, instance, validated_data):
        attendance_data = validated_data.pop("attendances", None)
        admin_unlocked = validated_data.pop("admin_unlocked", False)

        with transaction.atomic():
            if admin_unlocked:
                instance.admin_unlocked = True
                instance.is_saved = False
            else:
                instance.admin_unlocked = False
                instance.is_saved = True

            if attendance_data:
                instance.attendances.all().delete()
                models.LabourAttendance.objects.bulk_create(
                    [
                        models.LabourAttendance(daily_entry=instance, **item)
                        for item in attendance_data
                    ]
                )

            instance.save()

        return instance


class WeekLabourRetrieveSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="labour.id", read_only=True)
    name = serializers.CharField(source="labour.name")
    weekly_daily_wage = serializers.FloatField()
    opening_balance = serializers.FloatField(read_only=True)
    type = serializers.CharField(source="labour.get_type_display", read_only=True)
    gender = serializers.CharField(source="labour.get_gender_display", read_only=True)
    week_link_id = serializers.CharField(source="id", read_only=True)

    class Meta:
        fields = [
            "id",
            "weekly_daily_wage",
            "name",
            "opening_balance",
            "type",
            "week_link_id",
            "gender",
        ]
        model = models.WeekLabourAssignment


class WeekRetrieveSerializer(serializers.ModelSerializer):
    labours = serializers.SerializerMethodField()
    daily_entry = DailyEntryRetrieveSerializer(source="days", many=True)

    class Meta:
        model = models.Week
        fields = [
            "id",
            "start_date",
            "end_date",
            "daily_entry",
            "labours",
        ]

    def get_labours(self, _instance):
        assignments = self.context.get("labours")

        if assignments is None:
            return []
        print(assignments)
        return WeekLabourRetrieveSerializer(assignments, many=True).data


class WeekLabourUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        fields = "__all__"
        model = models.WeekLabourAssignment
