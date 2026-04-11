import hashlib
import json

from django.core.paginator import EmptyPage, Paginator
from django.db import transaction
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from tables.model_definitions.user_log import UserLog

from hr.models import AttendanceRecord, Department, Designation, Employee, LeaveRequest, LeaveType
from hr.serializers import (
    AttendanceRecordSerializer,
    DepartmentSerializer,
    DesignationSerializer,
    EmployeeSerializer,
    LeaveRequestSerializer,
    LeaveTypeSerializer,
)


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


def _serialize_leave_request(leave_request: LeaveRequest):
    return LeaveRequestSerializer(leave_request).data


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
        "designation_id",
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
        "system_user",
        "user_email",
        "user_full_name",
        "profile_photo_url",
        "is_active",
    ]

    for field in tracked_fields:
        if before.get(field) != after.get(field):
            changes[field] = {"from": before.get(field), "to": after.get(field)}

    return changes


def _serialize_department(department: Department):
    if not hasattr(department, "employee_count"):
        department.employee_count = Employee.objects.filter(department=department).count()
    return DepartmentSerializer(department).data


def _serialize_designation(designation: Designation):
    if not hasattr(designation, "employee_count"):
        designation.employee_count = Employee.objects.filter(
            designation_ref=designation
        ).count()
    return DesignationSerializer(designation).data


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def department_list(request):
    page_size = min(max(int(request.GET.get("page_size", 10)), 1), 100)
    page = max(int(request.GET.get("page", 1)), 1)
    search = (request.GET.get("search") or "").strip()
    include_inactive = _is_truthy_query_value(request.GET.get("include_inactive"))

    queryset = Department.objects.annotate(employee_count=Count("employees"))
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
        department = Department.objects.annotate(employee_count=Count("employees")).get(id=department_id)
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
    serializer = DepartmentSerializer(department, data=request.data, partial=partial)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    with transaction.atomic():
        updated_department = serializer.save()
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

    employee_count = Employee.objects.filter(department=department).count()
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

    queryset = Employee.objects.select_related("department", "designation_ref", "system_user")
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
            | Q(department__name__icontains=search)
            | Q(designation__icontains=search)
        )
    if department:
        queryset = queryset.filter(department__name__icontains=department)
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
                    "department": employee.department.name,
                    "designation": employee.designation,
                    "system_user": getattr(employee.system_user, "email", ""),
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
        employee = Employee.objects.select_related(
            "department", "designation_ref", "system_user"
        ).get(id=employee_id)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

    return JsonResponse(_serialize_employee(employee, request=request))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def employee_detail_by_naming_series(request, naming_series):
    try:
        employee = Employee.objects.select_related(
            "department", "designation_ref", "system_user"
        ).get(naming_series=naming_series)
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
        employee = Employee.objects.select_related(
            "department", "designation_ref", "system_user"
        ).get(id=employee_id)
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
        employee = Employee.objects.select_related(
            "department", "designation_ref", "system_user"
        ).get(id=employee_id)
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
        Designation.objects.filter(is_active=True)
        .order_by("name")
        .values_list("name", flat=True)
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def designation_list(request):
    page_size = min(max(int(request.GET.get("page_size", 10)), 1), 100)
    page = max(int(request.GET.get("page", 1)), 1)
    search = (request.GET.get("search") or "").strip()
    include_inactive = _is_truthy_query_value(request.GET.get("include_inactive"))

    queryset = Designation.objects.select_related("department").annotate(
        employee_count=Count("employees")
    )
    if not include_inactive:
        queryset = queryset.filter(is_active=True)
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(description__icontains=search)
            | Q(department__name__icontains=search)
        )

    paginator = Paginator(queryset.order_by("name", "id"), page_size)
    try:
        designation_page = paginator.page(page)
    except EmptyPage:
        designation_page = paginator.page(1)

    return JsonResponse(
        {
            "results": [_serialize_designation(item) for item in designation_page],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": designation_page.number,
            "page_size": page_size,
            "has_next": designation_page.has_next(),
            "has_previous": designation_page.has_previous(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def designation_create(request):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    serializer = DesignationSerializer(data=request.data)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    designation = serializer.save()
    UserLog.objects.create(
        user=request.user,
        action="Designation Created",
        details=json.dumps(
            {"designation_id": designation.id, "name": designation.name},
            default=str,
        ),
    )
    return JsonResponse(
        {
            "message": "Designation created successfully",
            "designation": _serialize_designation(designation),
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def designation_detail(request, designation_id):
    try:
        designation = Designation.objects.select_related("department").annotate(
            employee_count=Count("employees")
        ).get(id=designation_id)
    except Designation.DoesNotExist:
        return JsonResponse({"error": "Designation not found"}, status=404)

    return JsonResponse(_serialize_designation(designation))


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def designation_update(request, designation_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        designation = Designation.objects.get(id=designation_id)
    except Designation.DoesNotExist:
        return JsonResponse({"error": "Designation not found"}, status=404)

    previous_name = designation.name
    serializer = DesignationSerializer(
        designation,
        data=request.data,
        partial=request.method == "PATCH",
    )
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    updated = serializer.save()
    if previous_name != updated.name:
        Employee.objects.filter(designation_ref=updated).update(designation=updated.name)

    UserLog.objects.create(
        user=request.user,
        action="Designation Updated",
        details=json.dumps(
            {"designation_id": updated.id, "name": updated.name},
            default=str,
        ),
    )
    return JsonResponse(
        {
            "message": "Designation updated successfully",
            "designation": _serialize_designation(updated),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def designation_delete(request, designation_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        designation = Designation.objects.annotate(employee_count=Count("employees")).get(
            id=designation_id
        )
    except Designation.DoesNotExist:
        return JsonResponse({"error": "Designation not found"}, status=404)

    if designation.employee_count:
        return JsonResponse(
            {
                "error": "This designation has linked employees and cannot be deleted.",
                "employee_count": designation.employee_count,
            },
            status=400,
        )

    payload = {"designation_id": designation.id, "name": designation.name}
    designation.delete()
    UserLog.objects.create(
        user=request.user,
        action="Designation Deleted",
        details=json.dumps(payload, default=str),
    )
    return JsonResponse({"message": "Designation deleted successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leave_meta(request):
    employees = [
        {
            "id": employee.id,
            "naming_series": employee.naming_series,
            "full_name": employee.full_name,
            "department": employee.department.name,
        }
        for employee in Employee.objects.select_related("department")
        .filter(is_active=True)
        .order_by("first_name", "last_name")
    ]
    leave_types = [
        LeaveTypeSerializer(item).data
        for item in LeaveType.objects.filter(is_active=True).order_by("name")
    ]
    return JsonResponse(
        {
            "employees": employees,
            "leave_types": leave_types,
            "statuses": [
                {"value": value, "label": label}
                for value, label in LeaveRequest.STATUS_CHOICES
            ],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leave_type_list(request):
    include_inactive = _is_truthy_query_value(request.GET.get("include_inactive"))
    queryset = LeaveType.objects.all()
    if not include_inactive:
        queryset = queryset.filter(is_active=True)
    queryset = queryset.order_by("name", "id")
    return JsonResponse(
        {
            "results": [LeaveTypeSerializer(item).data for item in queryset],
            "count": queryset.count(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def leave_type_create(request):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    serializer = LeaveTypeSerializer(data=request.data)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    leave_type = serializer.save()
    UserLog.objects.create(
        user=request.user,
        action="Leave Type Created",
        details=json.dumps({"leave_type_id": leave_type.id, "name": leave_type.name}),
    )
    return JsonResponse(
        {"message": "Leave type created successfully", "leave_type": LeaveTypeSerializer(leave_type).data},
        status=201,
    )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def leave_type_update(request, leave_type_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        leave_type = LeaveType.objects.get(id=leave_type_id)
    except LeaveType.DoesNotExist:
        return JsonResponse({"error": "Leave type not found"}, status=404)

    serializer = LeaveTypeSerializer(
        leave_type,
        data=request.data,
        partial=request.method == "PATCH",
    )
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    updated = serializer.save()
    UserLog.objects.create(
        user=request.user,
        action="Leave Type Updated",
        details=json.dumps({"leave_type_id": updated.id, "name": updated.name}),
    )
    return JsonResponse(
        {"message": "Leave type updated successfully", "leave_type": LeaveTypeSerializer(updated).data}
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def leave_type_delete(request, leave_type_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        leave_type = LeaveType.objects.get(id=leave_type_id)
    except LeaveType.DoesNotExist:
        return JsonResponse({"error": "Leave type not found"}, status=404)

    if leave_type.leave_requests.exists():
        return JsonResponse(
            {"error": "This leave type already has requests and cannot be deleted."},
            status=400,
        )

    payload = {"leave_type_id": leave_type.id, "name": leave_type.name}
    leave_type.delete()
    UserLog.objects.create(
        user=request.user,
        action="Leave Type Deleted",
        details=json.dumps(payload),
    )
    return JsonResponse({"message": "Leave type deleted successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leave_request_list(request):
    page_size = min(max(int(request.GET.get("page_size", 10)), 1), 100)
    page = max(int(request.GET.get("page", 1)), 1)
    search = (request.GET.get("search") or "").strip()
    status_value = (request.GET.get("status") or "").strip()
    employee_id = (request.GET.get("employee") or "").strip()
    leave_type_id = (request.GET.get("leave_type") or "").strip()

    queryset = LeaveRequest.objects.select_related(
        "employee",
        "employee__department",
        "leave_type",
        "approved_by",
    )

    if search:
        queryset = queryset.filter(
            Q(employee__naming_series__icontains=search)
            | Q(employee__first_name__icontains=search)
            | Q(employee__last_name__icontains=search)
            | Q(leave_type__name__icontains=search)
            | Q(reason__icontains=search)
        )
    if status_value:
        queryset = queryset.filter(status=status_value)
    if employee_id:
        queryset = queryset.filter(employee_id=employee_id)
    if leave_type_id:
        queryset = queryset.filter(leave_type_id=leave_type_id)

    paginator = Paginator(queryset.order_by("-created_at", "-id"), page_size)
    try:
        requests_page = paginator.page(page)
    except EmptyPage:
        requests_page = paginator.page(1)

    return JsonResponse(
        {
            "results": [_serialize_leave_request(item) for item in requests_page],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": requests_page.number,
            "page_size": page_size,
            "has_next": requests_page.has_next(),
            "has_previous": requests_page.has_previous(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def leave_request_create(request):
    serializer = LeaveRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    leave_request = serializer.save()
    UserLog.objects.create(
        user=request.user,
        action="Leave Request Created",
        details=json.dumps(
            {
                "leave_request_id": leave_request.id,
                "employee_id": leave_request.employee_id,
                "leave_type_id": leave_request.leave_type_id,
                "status": leave_request.status,
            },
            default=str,
        ),
    )
    return JsonResponse(
        {
            "message": "Leave request created successfully",
            "leave_request": _serialize_leave_request(leave_request),
        },
        status=201,
    )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def leave_request_update(request, leave_request_id):
    try:
        leave_request = LeaveRequest.objects.select_related("employee", "employee__department", "leave_type").get(id=leave_request_id)
    except LeaveRequest.DoesNotExist:
        return JsonResponse({"error": "Leave request not found"}, status=404)

    if leave_request.status != LeaveRequest.STATUS_PENDING:
        return JsonResponse(
            {"error": "Only pending leave requests can be edited."},
            status=400,
        )

    serializer = LeaveRequestSerializer(
        leave_request,
        data=request.data,
        partial=request.method == "PATCH",
    )
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    updated = serializer.save()
    UserLog.objects.create(
        user=request.user,
        action="Leave Request Updated",
        details=json.dumps({"leave_request_id": updated.id, "status": updated.status}, default=str),
    )
    return JsonResponse(
        {
            "message": "Leave request updated successfully",
            "leave_request": _serialize_leave_request(updated),
        }
    )


def _leave_request_status_change(request, leave_request_id, next_status, action_label):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        leave_request = LeaveRequest.objects.select_related("employee", "employee__department", "leave_type").get(id=leave_request_id)
    except LeaveRequest.DoesNotExist:
        return JsonResponse({"error": "Leave request not found"}, status=404)

    if leave_request.status != LeaveRequest.STATUS_PENDING:
        return JsonResponse(
            {"error": "Only pending leave requests can be approved or rejected."},
            status=400,
        )

    leave_request.status = next_status
    leave_request.approval_note = (request.data.get("approval_note") or "").strip()
    leave_request.approved_by = request.user
    leave_request.approved_at = timezone.now()
    leave_request.save(update_fields=["status", "approval_note", "approved_by", "approved_at", "updated_at"])

    if next_status == LeaveRequest.STATUS_APPROVED:
        employee = leave_request.employee
        if employee.status == Employee.STATUS_ACTIVE:
            employee.status = Employee.STATUS_ON_LEAVE
            employee.save(update_fields=["status", "updated_at"])

    UserLog.objects.create(
        user=request.user,
        action=action_label,
        details=json.dumps(
            {
                "leave_request_id": leave_request.id,
                "employee_id": leave_request.employee_id,
                "status": leave_request.status,
            },
            default=str,
        ),
    )
    return JsonResponse(
        {
            "message": f"Leave request {next_status.replace('_', ' ')} successfully",
            "leave_request": _serialize_leave_request(leave_request),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def leave_request_approve(request, leave_request_id):
    return _leave_request_status_change(
        request,
        leave_request_id,
        LeaveRequest.STATUS_APPROVED,
        "Leave Request Approved",
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def leave_request_reject(request, leave_request_id):
    return _leave_request_status_change(
        request,
        leave_request_id,
        LeaveRequest.STATUS_REJECTED,
        "Leave Request Rejected",
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def leave_request_cancel(request, leave_request_id):
    try:
        leave_request = LeaveRequest.objects.select_related("employee", "employee__department", "leave_type").get(id=leave_request_id)
    except LeaveRequest.DoesNotExist:
        return JsonResponse({"error": "Leave request not found"}, status=404)

    if leave_request.status != LeaveRequest.STATUS_PENDING:
        return JsonResponse(
            {"error": "Only pending leave requests can be cancelled."},
            status=400,
        )

    leave_request.status = LeaveRequest.STATUS_CANCELLED
    leave_request.approval_note = (request.data.get("approval_note") or "").strip()
    leave_request.approved_by = request.user
    leave_request.approved_at = timezone.now()
    leave_request.save(update_fields=["status", "approval_note", "approved_by", "approved_at", "updated_at"])

    UserLog.objects.create(
        user=request.user,
        action="Leave Request Cancelled",
        details=json.dumps(
            {
                "leave_request_id": leave_request.id,
                "employee_id": leave_request.employee_id,
                "status": leave_request.status,
            },
            default=str,
        ),
    )
    return JsonResponse(
        {
            "message": "Leave request cancelled successfully",
            "leave_request": _serialize_leave_request(leave_request),
        }
    )


def _serialize_attendance_record(attendance_record: AttendanceRecord):
    return AttendanceRecordSerializer(attendance_record).data


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_meta(request):
    employees = [
        {
            "id": employee.id,
            "naming_series": employee.naming_series,
            "full_name": employee.full_name,
            "department": employee.department.name,
        }
        for employee in Employee.objects.select_related("department")
        .filter(is_active=True)
        .order_by("first_name", "last_name")
    ]
    return JsonResponse(
        {
            "employees": employees,
            "statuses": [
                {"value": value, "label": label}
                for value, label in AttendanceRecord.STATUS_CHOICES
            ],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_record_list(request):
    page_size = min(max(int(request.GET.get("page_size", 10)), 1), 100)
    page = max(int(request.GET.get("page", 1)), 1)
    search = (request.GET.get("search") or "").strip()
    status_value = (request.GET.get("status") or "").strip()
    employee_id = (request.GET.get("employee") or "").strip()
    date_from = (request.GET.get("date_from") or "").strip()
    date_to = (request.GET.get("date_to") or "").strip()

    queryset = AttendanceRecord.objects.select_related(
        "employee",
        "employee__department",
        "marked_by",
    )

    if search:
        queryset = queryset.filter(
            Q(naming_series__icontains=search)
            | Q(employee__naming_series__icontains=search)
            | Q(employee__first_name__icontains=search)
            | Q(employee__last_name__icontains=search)
            | Q(notes__icontains=search)
        )
    if status_value:
        queryset = queryset.filter(status=status_value)
    if employee_id:
        queryset = queryset.filter(employee_id=employee_id)
    if date_from:
        queryset = queryset.filter(attendance_date__gte=date_from)
    if date_to:
        queryset = queryset.filter(attendance_date__lte=date_to)

    paginator = Paginator(queryset.order_by("-attendance_date", "-id"), page_size)
    try:
        records_page = paginator.page(page)
    except EmptyPage:
        records_page = paginator.page(1)

    return JsonResponse(
        {
            "results": [_serialize_attendance_record(item) for item in records_page],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": records_page.number,
            "page_size": page_size,
            "has_next": records_page.has_next(),
            "has_previous": records_page.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_record_detail_by_naming_series(request, naming_series):
    try:
        attendance_record = AttendanceRecord.objects.select_related(
            "employee",
            "employee__department",
            "marked_by",
        ).get(naming_series=naming_series)
    except AttendanceRecord.DoesNotExist:
        return JsonResponse({"error": "Attendance record not found"}, status=404)

    return JsonResponse(_serialize_attendance_record(attendance_record))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def attendance_record_create(request):
    serializer = AttendanceRecordSerializer(data=request.data)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    attendance_record = serializer.save(marked_by=request.user)
    UserLog.objects.create(
        user=request.user,
        action="Attendance Record Created",
        details=json.dumps(
            {
                "attendance_record_id": attendance_record.id,
                "employee_id": attendance_record.employee_id,
                "attendance_date": str(attendance_record.attendance_date),
                "status": attendance_record.status,
            }
        ),
    )
    return JsonResponse(
        {
            "message": "Attendance record created successfully",
            "attendance_record": _serialize_attendance_record(attendance_record),
        },
        status=201,
    )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def attendance_record_update(request, naming_series):
    try:
        attendance_record = AttendanceRecord.objects.select_related(
            "employee",
            "employee__department",
            "marked_by",
        ).get(naming_series=naming_series)
    except AttendanceRecord.DoesNotExist:
        return JsonResponse({"error": "Attendance record not found"}, status=404)

    serializer = AttendanceRecordSerializer(
        attendance_record,
        data=request.data,
        partial=request.method == "PATCH",
    )
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    updated = serializer.save(marked_by=request.user)
    UserLog.objects.create(
        user=request.user,
        action="Attendance Record Updated",
        details=json.dumps(
            {
                "attendance_record_id": updated.id,
                "employee_id": updated.employee_id,
                "attendance_date": str(updated.attendance_date),
                "status": updated.status,
            }
        ),
    )
    return JsonResponse(
        {
            "message": "Attendance record updated successfully",
            "attendance_record": _serialize_attendance_record(updated),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def attendance_check_in(request):
    employee_id = request.data.get("employee")
    attendance_date = request.data.get("attendance_date") or timezone.localdate()

    if not employee_id:
        return JsonResponse({"error": "Employee is required."}, status=400)

    try:
        employee = Employee.objects.select_related("department").get(id=employee_id)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

    attendance_record, _ = AttendanceRecord.objects.get_or_create(
        employee=employee,
        attendance_date=attendance_date,
        defaults={
            "status": AttendanceRecord.STATUS_PRESENT,
            "marked_by": request.user,
        },
    )
    attendance_record.status = AttendanceRecord.STATUS_PRESENT
    if not attendance_record.check_in_time:
        attendance_record.check_in_time = timezone.localtime().time().replace(microsecond=0)
    attendance_record.marked_by = request.user
    attendance_record.save()

    UserLog.objects.create(
        user=request.user,
        action="Attendance Checked In",
        details=json.dumps(
            {
                "attendance_record_id": attendance_record.id,
                "employee_id": attendance_record.employee_id,
                "attendance_date": str(attendance_record.attendance_date),
            }
        ),
    )
    return JsonResponse(
        {
            "message": "Check-in recorded successfully",
            "attendance_record": _serialize_attendance_record(attendance_record),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def attendance_check_out(request):
    employee_id = request.data.get("employee")
    attendance_date = request.data.get("attendance_date") or timezone.localdate()

    if not employee_id:
        return JsonResponse({"error": "Employee is required."}, status=400)

    try:
        employee = Employee.objects.select_related("department").get(id=employee_id)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

    attendance_record, _ = AttendanceRecord.objects.get_or_create(
        employee=employee,
        attendance_date=attendance_date,
        defaults={
            "status": AttendanceRecord.STATUS_PRESENT,
            "marked_by": request.user,
            "check_in_time": timezone.localtime().time().replace(microsecond=0),
        },
    )
    attendance_record.status = AttendanceRecord.STATUS_PRESENT
    if not attendance_record.check_in_time:
        attendance_record.check_in_time = timezone.localtime().time().replace(microsecond=0)
    attendance_record.check_out_time = timezone.localtime().time().replace(microsecond=0)
    attendance_record.marked_by = request.user
    attendance_record.save()

    UserLog.objects.create(
        user=request.user,
        action="Attendance Checked Out",
        details=json.dumps(
            {
                "attendance_record_id": attendance_record.id,
                "employee_id": attendance_record.employee_id,
                "attendance_date": str(attendance_record.attendance_date),
            }
        ),
    )
    return JsonResponse(
        {
            "message": "Check-out recorded successfully",
            "attendance_record": _serialize_attendance_record(attendance_record),
        }
    )

