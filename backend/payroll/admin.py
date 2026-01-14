from payroll.models import LabourPayment
from django.contrib import admin

from .models import (
    Week,
    LabourAttendance,
    DailyEntry,
    WeekLabourAssignment,
)


@admin.register(Week)
class WeekAdmin(admin.ModelAdmin):
    pass


@admin.register(LabourAttendance)
class AttendanceAdmin(admin.ModelAdmin):
    pass


@admin.register(DailyEntry)
class DailyEntryAdmin(admin.ModelAdmin):
    pass


@admin.register(WeekLabourAssignment)
class WeekLabourAssignmentAdmin(admin.ModelAdmin):
    pass


@admin.register(LabourPayment)
class LabourPaymentAdmin(admin.ModelAdmin):
    pass
