from django.contrib import admin

from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "naming_series",
        "full_name",
        "department",
        "designation",
        "status",
        "is_active",
    )
    search_fields = ("naming_series", "first_name", "last_name", "work_email")
    list_filter = (
        "department",
        "designation",
        "status",
        "employment_type",
        "is_active",
    )
