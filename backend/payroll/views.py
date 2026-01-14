from django.db.models.fields import DecimalField
from django.db.models.aggregates import Sum
from django.db.models.expressions import OuterRef
from django.db.models.expressions import F
from django.db.models.functions.comparison import Coalesce
from django.db.models.expressions import Value
from django.db.models.expressions import Subquery
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework import generics

from sites import models as sites_models

from . import serializers as serializers
from . import models as models


class WeekLabourAssignmentViewSet(ModelViewSet):

    def get_serializer_class(self):
        if self.action == "retrieve" or self.action == "list":
            return serializers.WeekLabourRetrieveSerializer
        return serializers.WeekLabourUpdateSerializer

    def get_queryset(self):
        site = self.kwargs.get("site_id")
        week = self.kwargs.get("week_id")

        return models.WeekLabourAssignment.objects.filter(
            week=week,
            week__site=site,
        ).select_related("labour")

    def perform_destroy(self, instance):
        models.LabourAttendance.objects.filter(
            labour=instance.labour,
            daily_entry__week=instance.week,
        ).delete()
        instance.delete()


class WeekViewSet(ModelViewSet):

    def get_queryset(self):
        site_id = self.kwargs.get("site_id")
        queryset = models.Week.objects.filter(site_id=site_id)

        if self.action in ["retrieve"]:
            queryset = queryset.prefetch_related("days__attendances")

        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.WeekRetrieveSerializer
        if self.action == "list":
            return serializers.WeekListSerializer
        return serializers.WeekCreateUpdateSerializer

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = generics.get_object_or_404(sites_models.Site, pk=site_id)
        serializer.save(site=site_instance)


class DailyEntryRetrieveUpdateView(generics.RetrieveUpdateAPIView):

    def get_serializer_class(self):
        if self.request.method == "GET":
            return serializers.DailyEntryWithLabourRetrieveSerializer
        return serializers.DailyEntryUpdateSerializer

    def get_queryset(self):
        week = self.kwargs.get("week_id")
        pk = self.kwargs.get("pk")

        queryset = models.DailyEntry.objects.filter(
            week=week,
            id=pk,
        )

        if self.request.method == "GET":
            return queryset.prefetch_related("attendances", "week__labours")
        return queryset


class WeekPaymentListSerializer(generics.ListAPIView):
    serializer_class = serializers.WeekLabourRetrieveSerializer

    def get_queryset(self):
        week_id = self.kwargs.get("week_id")
        instance = generics.get_object_or_404(models.Week, id=week_id)

        start_date = instance.start_date

        # 1. WAGE LOOKUP (For past earnings calculation)
        wage_lookup_sql = models.WeekLabourAssignment.objects.filter(
            week=OuterRef("daily_entry__week"),
            labour=OuterRef("labour"),
        ).values("weekly_daily_wage")[:1]

        # 2. HISTORICAL EARNINGS (Sum of [Wage * Present] for all days BEFORE this week)
        history_earned_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__date__lt=start_date,
                is_present=True,
            )
            .annotate(
                wage_for_day=Subquery(wage_lookup_sql, output_field=DecimalField())
            )
            .values("labour")
            .annotate(total=Sum("wage_for_day"))
            .values("total")
        )

        # 3. HISTORICAL ADVANCES (Sum of advances taken BEFORE this week)
        history_advance_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__date__lt=start_date,
            )
            .values("labour")
            .annotate(total=Sum("advance_taken"))
            .values("total")
        )

        # 4. HISTORICAL PAYMENTS (*** NEW ***)
        # Sum of actual money paid out in PREVIOUS weeks
        history_paid_subquery = (
            models.LabourPayment.objects.filter(
                # Link Payment -> Assignment -> Labour
                labour__labour=OuterRef("labour"),
                # Link Payment -> Assignment -> Week -> Start Date (Strictly Past)
                labour__week__start_date__lt=start_date,
            )
            .values("labour__labour")
            .annotate(total=Sum("amount_paid"))
            .values("total")
        )

        current_advance_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__week=instance,
            )
            .values("labour")
            .annotate(total=Sum("advance_taken"))
            .values("total")
        )

        current_present_count_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__week=instance,
                is_present=True,
            )
            .values("labour")
            .annotate(cnt=Sum(Value(1)))
            .values("cnt")
        )

        # -------------------------------------------------------
        # MAIN QUERY
        # -------------------------------------------------------
        return (
            models.WeekLabourAssignment.objects.filter(week=instance)
            .select_related("labour")
            .prefetch_related("week_payment")
            .annotate(
                # Bring in all subqueries (Coalesce handles Null -> 0)
                hist_earned=Coalesce(
                    Subquery(history_earned_subquery, output_field=DecimalField()),
                    Value(0, output_field=DecimalField()),
                ),
                hist_advance=Coalesce(
                    Subquery(history_advance_subquery, output_field=DecimalField()),
                    Value(0, output_field=DecimalField()),
                ),
                # *** ADDED HIST_PAID ***
                hist_paid=Coalesce(
                    Subquery(history_paid_subquery, output_field=DecimalField()),
                    Value(0, output_field=DecimalField()),
                ),
                curr_advance=Coalesce(
                    Subquery(current_advance_subquery, output_field=DecimalField()),
                    Value(0, output_field=DecimalField()),
                ),
                curr_earned=Coalesce(
                    Subquery(
                        current_present_count_subquery, output_field=DecimalField()
                    ),
                    Value(0, output_field=DecimalField()),
                )
                * F("weekly_daily_wage"),
            )
            .annotate(
                # Opening Balance = (Old Balance + History Earned) - (History Advances + History Payments)
                opening_balance=(
                    F("labour__previous_balance")
                    + F("hist_earned")
                    - (F("hist_advance") + F("hist_paid"))
                ),
                # Net for this week
                current_week_net=F("curr_earned") - F("curr_advance"),
                # Total Due Now = Opening Balance + Current Net
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

    def list(self, _request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
