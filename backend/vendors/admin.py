from django.contrib import admin

from .models import Vendor, VendorPayment


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    pass


@admin.register(VendorPayment)
class VendorPaymentAdmin(admin.ModelAdmin):
    pass
