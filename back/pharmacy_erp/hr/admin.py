from django.contrib import admin

from .models import Department, Designation, Employee


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "manager_name", "is_active", "created_at")
    search_fields = ("name", "manager_name", "description")
    list_filter = ("is_active",)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "naming_series",
        "full_name",
        "department",
        "designation",
        "system_user",
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


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ("name", "department", "is_active", "created_at")
    search_fields = ("name", "description", "department__name")
    list_filter = ("is_active", "department")
