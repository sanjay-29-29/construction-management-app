from django.db.models.fields import FloatField
from django.db.models.expressions import Subquery
from django.db.models.expressions import OuterRef
from django.db.models import Sum, F, DecimalField
from django.db.models.functions import Coalesce

from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from django_filters import rest_framework as filters

from sites import models as sites_models

from . import filters as payroll_filters
from . import serializers as serializers
from . import models as models


class LabourViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.LabourSerializer
    filter_backends = [
        filters.DjangoFilterBackend,
    ]
    filterset_class = payroll_filters.LabourFilter

    def get_serializer_class(self):
        if self.action == "list" or self.action == "retrieve":
            return serializers.LabourRetrieveSerializer
        return serializers.LabourCreateUpdateSerializer

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = generics.get_object_or_404(sites_models.Site, pk=site_id)
        serializer.save(site=site_instance)

    def perform_updates(self, serializer):
        instance = self.get_object()
        new_photo = self.request.FILES.get("photo")

        if new_photo and instance.photo:
            instance.photo.delete()

        serializer.save()

    def get_queryset(self):
        site = self.kwargs.get("site_id")
        return models.Labour.objects.filter(site=site).prefetch_related("documents")


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
        site_instance = generics.get_object_or_404(sites_models.Site, pk=site_id)
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
        if self.action == "retrieve":
            return serializers.RateWorkRetrieveSerializer
        if self.action == "list":
            return serializers.RateWorkListSerializer
        return serializers.RateWorkUpdateSerializer

    def get_queryset(self):
        site_id = self.kwargs.get("site_id")

        queryset = (
            models.RateWork.objects.filter(labour__site=site_id)
            .prefetch_related("payments")
            .select_related("labour")
        )

        if self.action == "retrieve":
            return queryset.annotate(
                paid=Coalesce(
                    Sum("payments__amount"),
                    0,
                    output_field=FloatField(),
                )
            )

        return queryset

    def perform_create(self, serializer):
        site_id = self.kwargs.get("site_id")
        site_instance = generics.get_object_or_404(sites_models.Site, pk=site_id)
        serializer.save(site=site_instance)


class RateWorkPaymentCreateView(generics.CreateAPIView):
    serializer_class = serializers.RateWorkPaymentSerializer
    queryset = models.RatePayment.objects.all()

    def perform_create(self, serializer):
        rate_work_id = self.kwargs.get("rate_work_id")
        rate_work_instance = generics.get_object_or_404(
            models.RateWork, pk=rate_work_id
        )
        serializer.save(rate_work=rate_work_instance)


class RateWorkPaymentDeleteUpdateView(generics.RetrieveDestroyAPIView):
    serializer_class = serializers.RateWorkPaymentSerializer

    def get_queryset(self):
        rate_work_id = self.kwargs.get("rate_work_id")
        queryset = models.RatePayment.objects.filter(rate_work=rate_work_id)
        return queryset


class LabourDropdownView(generics.ListAPIView):
    serializer_class = serializers.LabourDropdownSerializer
    filter_backends = [
        filters.DjangoFilterBackend,
    ]
    filterset_class = payroll_filters.LabourFilter

    def get_queryset(self):
        site_id = self.kwargs.get("site_id")
        queryset = models.Labour.objects.filter(site=site_id)
        return queryset


class LabourDocumentCreateView(generics.CreateAPIView):
    def create(self, request, labour_id):
        data = {"documents": request.FILES.getlist("documents")}
        labour = generics.get_object_or_404(models.Labour, pk=labour_id)
        serializer = serializers.LabourDocumentCreateSerializer(
            data=data, context={"labour": labour}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Documents uploaded successfully"},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LabourDocumentDeleteView(generics.DestroyAPIView):
    def get_queryset(self):
        labour_id = self.kwargs.get("labour_id")
        return models.LabourDocument.objects.filter(labour=labour_id)
