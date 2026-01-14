from django.contrib import admin

from . import models as models


@admin.register(models.RateWork)
class RateWorkAdmin(admin.ModelAdmin):
    pass


@admin.register(models.Payment)
class PaymentAdmin(admin.ModelAdmin):
    pass


@admin.register(models.RatePayment)
class RatePaymentAdmin(admin.ModelAdmin):
    pass
