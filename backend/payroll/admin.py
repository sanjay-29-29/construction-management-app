from django.contrib import admin

from .models import (
    Week,
    LabourAttendance,
    Labour,
    DailyEntry,
    WeekLabourAssignment,
    Payment,
    RateWork,
    RatePayment,
    LabourDocument,
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


@admin.register(RatePayment)
class RatePaymentAdmin(admin.ModelAdmin):
    pass


@admin.register(LabourDocument)
class LabourDocumentAdmin(admin.ModelAdmin):
    pass
