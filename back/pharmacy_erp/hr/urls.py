from django.urls import path

from .views import (
    department_create,
    department_delete,
    department_detail,
    department_list,
    department_update,
    employee_create,
    employee_delete,
    employee_detail,
    employee_detail_by_naming_series,
    employee_filters,
    employee_list,
    employee_update,
)

urlpatterns = [
    path("departments/", department_list),
    path("departments/create/", department_create),
    path("departments/<int:department_id>/", department_detail),
    path("departments/<int:department_id>/update/", department_update),
    path("departments/<int:department_id>/delete/", department_delete),
    path("employees/", employee_list),
    path("employees/create/", employee_create),
    path("employees/filters/", employee_filters),
    path("employees/<int:employee_id>/", employee_detail),
    path("employees/<int:employee_id>/update/", employee_update),
    path("employees/<int:employee_id>/delete/", employee_delete),
    path(
        "employees/by-naming-series/<str:naming_series>/",
        employee_detail_by_naming_series,
    ),
]
