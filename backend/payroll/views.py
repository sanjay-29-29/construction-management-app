from django.db.models.expressions import Subquery
from django.db.models.expressions import OuterRef
from django.db.models import Sum, F, DecimalField
from django.db.models.functions import Coalesce

from rest_framework.generics import get_object_or_404
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.response import Response

from sites import models as sites_models

from . import serializers as serializers
from . import models as models


class LabourViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.LabourSerializer

    def get_serializer_class(self):
        if self.action == "list" or self.action == "retrieve":
            return serializers.LabourSerializer
        return serializers.LabourCreateUpdateSerializer

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = get_object_or_404(sites_models.Site, pk=site_id)
        serializer.save(site=site_instance)

    def get_queryset(self):
        site = self.kwargs.get("site_id")
        return models.Labour.objects.filter(site=site)


class WeekLabourAssignmentViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]

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


class WeekListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.WeekSerializer

    def get_queryset(self):
        site = self.kwargs.get("site_id")
        return models.Week.objects.filter(site=site)

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = get_object_or_404(models.Site, pk=site_id)
        serializer.save(site=site_instance)


class WeekRetrieveView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.WeekRetrieveSerializer

    def get_queryset(self):
        site_id = self.kwargs.get("site_id")
        # We use select_related for ForeignKey and prefetch_related for ManyToMany/Reverse FK
        return models.Week.objects.filter(site_id=site_id).prefetch_related(
            "days", "days__attendances"
        )

    def retrieve(self, _request, *args, **kwargs):
        instance = self.get_object()  # Current Week
        start_date = instance.start_date

        # -------------------------------------------------------
        # SUBQUERY 1: TOTAL EARNED (Past weeks, present days only)
        # -------------------------------------------------------
        historical_daily_wage_sql = models.WeekLabourAssignment.objects.filter(
            week=OuterRef("daily_entry__week"),
            labour=OuterRef("labour"),
        ).values("weekly_daily_wage")[:1]

        history_earned_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__date__lt=start_date,
                is_present=True,
            )
            .annotate(
                day_wage=Subquery(
                    historical_daily_wage_sql,
                    output_field=DecimalField(),
                )
            )
            .values("labour")
            .annotate(total=Sum("day_wage"))
            .values("total")
        )

        # -------------------------------------------------------
        # SUBQUERY 2: TOTAL PAID
        # -------------------------------------------------------
        history_paid_subquery = (
            models.LabourAttendance.objects.filter(
                labour=OuterRef("labour"),
                daily_entry__date__lt=start_date,
            )
            .values("labour")
            .annotate(total=Sum("wage_for_day"))
            .values("total")
        )

        # -------------------------------------------------------
        # SUBQUERY 3: TOTAL ADVANCE
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
        # MAIN QUERY (WeekLabourAssignment BASED)
        # -------------------------------------------------------
        assignments = (
            models.WeekLabourAssignment.objects.filter(week=instance)
            .select_related("labour")
            .annotate(
                hist_earned=Coalesce(
                    Subquery(history_earned_subquery),
                    0,
                    output_field=DecimalField(),
                ),
                hist_paid=Coalesce(
                    Subquery(history_paid_subquery),
                    0,
                    output_field=DecimalField(),
                ),
                hist_advance=Coalesce(
                    Subquery(history_advance_subquery),
                    0,
                    output_field=DecimalField(),
                ),
                opening_balance=(
                    F("labour__previous_balance")
                    + F("hist_earned")
                    - F("hist_paid")
                    - F("hist_advance")
                ),
            )
        )
        serializer = self.get_serializer(
            instance,
            context={"labours": assignments},
        )
        return Response(serializer.data)


class DailyEntryRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return serializers.DailyEntryWithLabourRetrieveSerializer
        return serializers.DailyEntryUpdateSerializer

    def get_queryset(self):
        site = self.kwargs.get("site_id")
        week = self.kwargs.get("week_id")
        pk = self.kwargs.get("pk")

        return models.DailyEntry.objects.filter(
            week__site=site,
            week=week,
            id=pk,
        ).prefetch_related("attendances", "week__labours")


class RateWorkViewSet(ModelViewSet):

    def get_serializer_class(self):
        if self.action == "list" or self.action == "retrieve":
            return serializers.RateWorkSerializerListRetrieveSerializer
        return serializers.RateWorkUpdateSerializer

    def get_queryset(self):
        labour_id = self.kwargs.get("labour_id")
        return models.RateWork.objects.filter(labour=labour_id).prefetch_related(
            "payments"
        )
