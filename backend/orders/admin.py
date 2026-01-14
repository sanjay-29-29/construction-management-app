from django.contrib import admin

from .models import Order, OrderImage


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    pass


@admin.register(OrderImage)
class OrderImageAdmin(admin.ModelAdmin):
    pass
