from django.db.models.functions.comparison import Coalesce
from django.db.models import Sum, OuterRef, Subquery, DecimalField, Value, F, ExpressionWrapper
from django.db import transaction

from rest_framework import serializers

from labours import serializers as labours_serializer

from . import models as models


class LabourAttendanceRetrieveSerializer(serializers.ModelSerializer):
    advance_taken = serializers.FloatField()

    class Meta:
        model = models.LabourAttendance
        fields = [
            "labour",
            "is_present",
            "advance_taken",
            "payment_type",
            "multiplier",
        ]


class WeekLabourRetrieveSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="labour.id", read_only=True)
    name = serializers.CharField(source="labour.name")
    amount_paid = serializers.FloatField(source="week_payment.amount_paid")
    payment_type = serializers.IntegerField(source="week_payment.payment_type")
    weekly_daily_wage = serializers.FloatField()
    opening_balance = serializers.FloatField(read_only=True)
    total_due_to_date = serializers.FloatField(read_only=True)
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
            "payment_type",
            "gender",
            "total_due_to_date",
            "amount_paid",
        ]
        model = models.WeekLabourAssignment


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


class WeekLabourAssignmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.WeekLabourAssignment
        fields = [
            "labour",
            "weekly_daily_wage",
        ]


class WeekListSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Week
        fields = [
            "id",
            "site",
            "start_date",
            "end_date",
        ]


class LabourPaymentCreateSerailizer(serializers.ModelSerializer):
    labour = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = models.LabourPayment
        fields = ["labour", "amount_paid", "payment_type"]


class WeekCreateUpdateSerializer(serializers.ModelSerializer):
    payments = LabourPaymentCreateSerailizer(many=True, required=False)

    class Meta:
        model = models.Week
        fields = [
            "id",
            "site",
            "start_date",
            "end_date",
            "admin_unlocked",
            "payments",
        ]
        read_only_fields = [
            "site",
            "end_date",
        ]

    def validate_start_date(self, value):
        if value.weekday() != 5:
            raise serializers.ValidationError("The start date must be a Saturday.")
        return value

    def update(self, instance, validated_data):
        payments_data = validated_data.pop("payments", None)
        admin_unlocked = validated_data.pop("admin_unlocked", False)

        with transaction.atomic():
            if admin_unlocked:
                instance.admin_unlocked = True
            else:
                instance.admin_unlocked = False

            if payments_data:
                models.LabourPayment.objects.filter(labour__week=instance).delete()
                models.LabourPayment.objects.bulk_create(
                    [
                        models.LabourPayment(
                            amount_paid=payment["amount_paid"],
                            labour_id=payment["labour"],
                            payment_type=payment["payment_type"],
                        )
                        for payment in payments_data
                    ]
                )

            instance.save()

        return instance


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
            "is_editable",
        ]

    def get_labours(self, instance):
        start_date = instance.start_date

        # -------------------------------------------------------
        # SUBQUERY 1: WAGE LOOKUP (For Historical Earnings Calculation)
        # -------------------------------------------------------
        wage_lookup_sql = models.WeekLabourAssignment.objects.filter(
            week=OuterRef("daily_entry__week"),
            labour=OuterRef("labour"),
        ).values("weekly_daily_wage")[:1]

        # -------------------------------------------------------
        # SUBQUERY 2: HISTORICAL EARNINGS
        # Calculation: Sum of (Weekly_Wage * Multiplier) where Is_Present is True
        # -------------------------------------------------------
        history_earned_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__date__lt=start_date,
                is_present=True,
            )
            .annotate(
                # 1. Get the base wage for that specific day/week
                base_wage=Subquery(wage_lookup_sql, output_field=DecimalField())
            )
            .annotate(
                # 2. Calculate actual pay for that day: Base Wage * Multiplier
                # We use ExpressionWrapper to ensure the Float(multiplier) * Decimal(wage) returns a Decimal
                day_pay=ExpressionWrapper(
                    F("base_wage") * F("multiplier"),
                    output_field=DecimalField()
                )
            )
            .values("labour")
            .annotate(total=Sum("day_pay")) # 3. Sum the calculated daily pays
            .values("total")
        )

        # -------------------------------------------------------
        # SUBQUERY 3: HISTORICAL ADVANCES
        # (Unchanged)
        # -------------------------------------------------------
        history_advance_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__date__lt=start_date,
            )
            .values("labour")
            .annotate(total=Sum("advance_taken"))
            .values("total")
        )

        # -------------------------------------------------------
        # SUBQUERY 4: HISTORICAL PAYMENTS
        # (Unchanged)
        # -------------------------------------------------------
        history_paid_subquery = (
            models.LabourPayment.objects.filter(
                labour__labour=OuterRef("labour"),
                labour__week__start_date__lt=start_date,
            )
            .values("labour__labour")
            .annotate(total=Sum("amount_paid"))
            .values("total")
        )

        # -------------------------------------------------------
        # SUBQUERY 5: CURRENT WEEK ACTIVITY
        # -------------------------------------------------------
        
        # A. Current Advances (Unchanged)
        current_advance_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__week=instance,
            )
            .values("labour")
            .annotate(total=Sum("advance_taken"))
            .values("total")
        )

        # B. Current "Billable Days" (Sum of Multipliers)
        # Instead of counting rows (1 day = 1), we sum the multipliers (1 day could be 1.5 or 0.5)
        current_billable_units_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__week=instance,
                is_present=True,
            )
            .values("labour")
            .annotate(total_units=Sum("multiplier"))
            .values("total_units")
        )

        # -------------------------------------------------------
        # MAIN QUERY
        # -------------------------------------------------------
        assignments = (
            models.WeekLabourAssignment.objects.filter(week=instance)
            .select_related("labour")
            .prefetch_related("week_payment")
            .annotate(
                # 1. Bring in all subqueries
                hist_earned=Coalesce(
                    Subquery(history_earned_subquery, output_field=DecimalField()),
                    Value(0, output_field=DecimalField()),
                ),
                hist_advance=Coalesce(
                    Subquery(history_advance_subquery, output_field=DecimalField()),
                    Value(0, output_field=DecimalField()),
                ),
                hist_paid=Coalesce(
                    Subquery(history_paid_subquery, output_field=DecimalField()),
                    Value(0, output_field=DecimalField()),
                ),
                curr_advance=Coalesce(
                    Subquery(current_advance_subquery, output_field=DecimalField()),
                    Value(0, output_field=DecimalField()),
                ),
                # 2. Calculate Current Earnings
                # Logic: (Sum of Multipliers for this week) * (This Week's Daily Wage)
                curr_earned=ExpressionWrapper(
                    Coalesce(
                        Subquery(current_billable_units_subquery, output_field=DecimalField()),
                        Value(0, output_field=DecimalField()),
                    ) * F("weekly_daily_wage"),
                    output_field=DecimalField()
                )
            )
            .annotate(
                # 3. Opening Balance
                opening_balance=(
                    F("labour__previous_balance")
                    + F("hist_earned")
                    - (F("hist_advance") + F("hist_paid"))
                ),
                # 4. Current Week Net
                current_week_net=F("curr_earned") - F("curr_advance"),
                # 5. Total Due Now
                total_due_to_date=(
                    (
                        F("labour__previous_balance")
                        + F("hist_earned")
                        - (F("hist_advance") + F("hist_paid"))
                    )
                    + (F("curr_earned") - F("curr_advance"))
                ),
            )
        )

        if not assignments.exists():
            return []

        return WeekLabourRetrieveSerializer(assignments, many=True).data


class DailyEntryWithLabourRetrieveSerializer(serializers.ModelSerializer):
    attendance = LabourAttendanceRetrieveSerializer(source="attendances", many=True)
    labours = labours_serializer.LabourSerializer(
        source="week.labours", many=True, read_only=True
    )

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
    labour = serializers.UUIDField()

    class Meta:
        model = models.LabourAttendance
        fields = [
            "labour",
            "is_present",
            "advance_taken",
            "payment_type",
            "multiplier",
        ]


class DailyEntryUpdateSerializer(serializers.ModelSerializer):
    attendances = LabourAttendanceUpdateSerializer(
        many=True, required=False, write_only=True
    )

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

            if attendance_data is not None:
                models.LabourAttendance.objects.filter(daily_entry=instance).delete()
                models.LabourAttendance.objects.bulk_create(
                    [
                        models.LabourAttendance(
                            daily_entry=instance,
                            payment_type=item["payment_type"],
                            labour_id=item["labour"],
                            is_present=item["is_present"],
                            advance_taken=item["advance_taken"],
                            multiplier = item["multiplier"],
                        )
                        for item in attendance_data
                    ]
                )

            instance.save()

        return instance


class WeekLabourUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        fields = "__all__"
        model = models.WeekLabourAssignment
