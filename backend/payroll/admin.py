from django.contrib import admin

from .models import (
    Week,
    LabourAttendance,
    Labour,
    DailyEntry,
    WeekLabourAssignment,
    Payment,
    RateWork,
)


@admin.register(Week)
class WeekAdmin(admin.ModelAdmin):
    pass


@admin.register(LabourAttendance)
class AttendanceAdmin(admin.ModelAdmin):
    pass


@admin.register(Labour)
class LabourAdmin(admin.ModelAdmin):
    pass


@admin.register(DailyEntry)
class DailyEntryAdmin(admin.ModelAdmin):
    pass


@admin.register(WeekLabourAssignment)
class WeekLabourAssignmentAdmin(admin.ModelAdmin):
    pass


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    pass


@admin.register(RateWork)
class RateWorkAdmin(admin.ModelAdmin):
    pass
