import hashlib
import json

from django.core.paginator import EmptyPage, Paginator
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from tables.modle.user_log import UserLog

from hr.models import Department, Employee
from hr.serializers import DepartmentSerializer, EmployeeSerializer


def _require_roles(request, allowed_roles):
    role = getattr(request.user, "role", None)
    if role in allowed_roles:
        return None
    return JsonResponse(
        {"error": "You do not have permission to perform this action."},
        status=403,
    )


def _is_truthy_query_value(value):
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _serialize_employee(employee: Employee, request=None):
    return EmployeeSerializer(employee, context={"request": request}).data


def _employee_changes(before, after):
    changes = {}
    tracked_fields = [
        "first_name",
        "middle_name",
        "last_name",
        "work_email",
        "personal_email",
        "phone",
        "alternate_phone",
        "department",
        "designation",
        "employment_type",
        "status",
        "gender",
        "date_of_birth",
        "hire_date",
        "confirmation_date",
        "salary",
        "manager_name",
        "emergency_contact_name",
        "emergency_contact_phone",
        "address",
        "notes",
        "profile_photo_url",
        "is_active",
    ]

    for field in tracked_fields:
        if before.get(field) != after.get(field):
            changes[field] = {"from": before.get(field), "to": after.get(field)}

    return changes


def _serialize_department(department: Department):
    if not hasattr(department, "employee_count"):
        department.employee_count = Employee.objects.filter(
            department=department.name
        ).count()
    return DepartmentSerializer(department).data


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def department_list(request):
    page_size = min(max(int(request.GET.get("page_size", 10)), 1), 100)
    page = max(int(request.GET.get("page", 1)), 1)
    search = (request.GET.get("search") or "").strip()
    include_inactive = _is_truthy_query_value(request.GET.get("include_inactive"))

    queryset = Department.objects.all()
    if not include_inactive:
        queryset = queryset.filter(is_active=True)

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(description__icontains=search)
            | Q(manager_name__icontains=search)
        )

    queryset = queryset.order_by("name", "id")
    paginator = Paginator(queryset, page_size)

    try:
        departments_page = paginator.page(page)
    except EmptyPage:
        departments_page = paginator.page(1)

    return JsonResponse(
        {
            "results": [
                _serialize_department(department) for department in departments_page
            ],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": departments_page.number,
            "page_size": page_size,
            "has_next": departments_page.has_next(),
            "has_previous": departments_page.has_previous(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def department_create(request):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    serializer = DepartmentSerializer(data=request.data)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    with transaction.atomic():
        department = serializer.save()
        UserLog.objects.create(
            user=request.user,
            action="Department Created",
            details=json.dumps(
                {
                    "department_id": department.id,
                    "name": department.name,
                }
            ),
        )

    return JsonResponse(
        {
            "message": "Department created successfully",
            "department": _serialize_department(department),
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def department_detail(request, department_id):
    try:
        department = Department.objects.get(id=department_id)
    except Department.DoesNotExist:
        return JsonResponse({"error": "Department not found"}, status=404)

    return JsonResponse(_serialize_department(department))


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def department_update(request, department_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        department = Department.objects.get(id=department_id)
    except Department.DoesNotExist:
        return JsonResponse({"error": "Department not found"}, status=404)

    partial = request.method == "PATCH"
    previous_name = department.name
    serializer = DepartmentSerializer(department, data=request.data, partial=partial)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    with transaction.atomic():
        updated_department = serializer.save()
        if previous_name != updated_department.name:
            Employee.objects.filter(department=previous_name).update(
                department=updated_department.name
            )
        UserLog.objects.create(
            user=request.user,
            action="Department Updated",
            details=json.dumps(
                {
                    "department_id": updated_department.id,
                    "name": updated_department.name,
                }
            ),
        )

    return JsonResponse(
        {
            "message": "Department updated successfully",
            "department": _serialize_department(updated_department),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def department_delete(request, department_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        department = Department.objects.get(id=department_id)
    except Department.DoesNotExist:
        return JsonResponse({"error": "Department not found"}, status=404)

    employee_count = Employee.objects.filter(department=department.name).count()
    if employee_count:
        return JsonResponse(
            {
                "error": "This department has linked employees and cannot be deleted.",
                "employee_count": employee_count,
            },
            status=400,
        )

    payload = {
        "department_id": department.id,
        "name": department.name,
    }

    with transaction.atomic():
        department.delete()
        UserLog.objects.create(
            user=request.user,
            action="Department Deleted",
            details=json.dumps(payload),
        )

    return JsonResponse({"message": "Department deleted successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_list(request):
    page_size = min(max(int(request.GET.get("page_size", 10)), 1), 100)
    page = max(int(request.GET.get("page", 1)), 1)
    search = (request.GET.get("search") or "").strip()
    department = (request.GET.get("department") or "").strip()
    designation = (request.GET.get("designation") or "").strip()
    status_value = (request.GET.get("status") or "").strip()
    employment_type = (request.GET.get("employment_type") or "").strip()
    include_inactive = _is_truthy_query_value(request.GET.get("include_inactive"))

    raw_key = (
        f"employees:{page}:{page_size}:{search}:{department}:{designation}:"
        f"{status_value}:{employment_type}:{include_inactive}"
    )
    cache_key = hashlib.md5(raw_key.encode()).hexdigest()

    queryset = Employee.objects.all()
    if not include_inactive:
        queryset = queryset.filter(is_active=True)

    if search:
        queryset = queryset.filter(
            Q(naming_series__icontains=search)
            | Q(first_name__icontains=search)
            | Q(middle_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(work_email__icontains=search)
            | Q(phone__icontains=search)
            | Q(department__icontains=search)
            | Q(designation__icontains=search)
        )
    if department:
        queryset = queryset.filter(department__icontains=department)
    if designation:
        queryset = queryset.filter(designation__icontains=designation)
    if status_value:
        queryset = queryset.filter(status=status_value)
    if employment_type:
        queryset = queryset.filter(employment_type=employment_type)

    queryset = queryset.order_by("-created_at", "-id")
    paginator = Paginator(queryset, page_size)

    try:
        employees_page = paginator.page(page)
    except EmptyPage:
        employees_page = paginator.page(1)

    response_data = {
        "results": [
            _serialize_employee(employee, request=request)
            for employee in employees_page
        ],
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": employees_page.number,
        "page_size": page_size,
        "has_next": employees_page.has_next(),
        "has_previous": employees_page.has_previous(),
        "cache_key": cache_key,
    }
    response_data.pop("cache_key", None)
    return JsonResponse(response_data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def employee_create(request):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    serializer = EmployeeSerializer(data=request.data)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    with transaction.atomic():
        employee = serializer.save()
        UserLog.objects.create(
            user=request.user,
            action="Employee Created",
            details=json.dumps(
                {
                    "employee_id": employee.id,
                    "naming_series": employee.naming_series,
                    "full_name": employee.full_name,
                    "department": employee.department,
                    "designation": employee.designation,
                    "status": employee.status,
                },
                default=str,
            ),
        )

    return JsonResponse(
        {
            "message": "Employee created successfully",
            "employee": _serialize_employee(employee, request=request),
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_detail(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

    return JsonResponse(_serialize_employee(employee, request=request))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_detail_by_naming_series(request, naming_series):
    try:
        employee = Employee.objects.get(naming_series=naming_series)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

    return JsonResponse(_serialize_employee(employee, request=request))


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def employee_update(request, employee_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

    partial = request.method == "PATCH"
    before = _serialize_employee(employee, request=request)
    serializer = EmployeeSerializer(employee, data=request.data, partial=partial)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    with transaction.atomic():
        updated_employee = serializer.save()
        after = _serialize_employee(updated_employee, request=request)
        UserLog.objects.create(
            user=request.user,
            action="Employee Updated",
            details=json.dumps(
                {
                    "employee_id": updated_employee.id,
                    "naming_series": updated_employee.naming_series,
                    "changes": _employee_changes(before, after),
                },
                default=str,
            ),
        )

    return JsonResponse(
        {
            "message": "Employee updated successfully",
            "employee": _serialize_employee(updated_employee, request=request),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def employee_delete(request, employee_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

    payload = {
        "employee_id": employee.id,
        "naming_series": employee.naming_series,
        "full_name": employee.full_name,
        "work_email": employee.work_email,
    }

    with transaction.atomic():
        employee.delete()
        UserLog.objects.create(
            user=request.user,
            action="Employee Deleted",
            details=json.dumps(payload, default=str),
        )

    return JsonResponse({"message": "Employee deleted successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_filters(request):
    departments = list(
        Department.objects.filter(is_active=True)
        .order_by("name")
        .values_list("name", flat=True)
    )
    designations = list(
        Employee.objects.order_by("designation")
        .values_list("designation", flat=True)
        .distinct()
    )
    return JsonResponse(
        {
            "departments": [item for item in departments if item],
            "designations": [item for item in designations if item],
            "statuses": [
                {"value": value, "label": label}
                for value, label in Employee.STATUS_CHOICES
            ],
            "employment_types": [
                {"value": value, "label": label}
                for value, label in Employee.EMPLOYMENT_CHOICES
            ],
            "genders": [
                {"value": value, "label": label}
                for value, label in Employee.GENDER_CHOICES
            ],
        }
    )
