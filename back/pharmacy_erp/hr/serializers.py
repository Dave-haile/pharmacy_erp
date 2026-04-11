from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    AttendanceRecord,
    Department,
    Designation,
    Employee,
    LeaveRequest,
    LeaveType,
)

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "description",
            "manager_name",
            "is_active",
            "employee_count",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        normalized = value.strip()
        queryset = Department.objects.filter(name__iexact=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A department with this name already exists.")
        return normalized


class DesignationSerializer(serializers.ModelSerializer):
    department = serializers.SlugRelatedField(
        slug_field="name",
        queryset=Department.objects.all(),
        allow_null=True,
        required=False,
    )
    department_id = serializers.IntegerField(read_only=True)
    employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Designation
        fields = [
            "id",
            "name",
            "department",
            "department_id",
            "description",
            "is_active",
            "employee_count",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        normalized = value.strip()
        queryset = Designation.objects.filter(name__iexact=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A designation with this name already exists.")
        return normalized


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    employment_type_label = serializers.CharField(
        source="get_employment_type_display",
        read_only=True,
    )
    gender_label = serializers.CharField(source="get_gender_display", read_only=True)
    department = serializers.SlugRelatedField(
        slug_field="name",
        queryset=Department.objects.all(),
    )
    department_id = serializers.IntegerField(read_only=True)
    designation = serializers.CharField()
    designation_id = serializers.IntegerField(source="designation_ref_id", read_only=True)
    system_user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        allow_null=True,
        required=False,
    )
    user_email = serializers.EmailField(source="system_user.email", read_only=True)
    user_full_name = serializers.CharField(source="system_user.full_name", read_only=True)
    profile_photo_url = serializers.SerializerMethodField()
    profile_photo = serializers.FileField(
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Employee
        fields = [
            "id",
            "naming_series",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "work_email",
            "personal_email",
            "phone",
            "alternate_phone",
            "department",
            "department_id",
            "designation",
            "designation_id",
            "employment_type",
            "employment_type_label",
            "status",
            "status_label",
            "gender",
            "gender_label",
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
            "profile_photo",
            "profile_photo_url",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate_designation(self, value):
        return value.strip()

    def validate(self, attrs):
        hire_date = attrs.get("hire_date")
        confirmation_date = attrs.get("confirmation_date")
        date_of_birth = attrs.get("date_of_birth")
        system_user = attrs.get("system_user", getattr(self.instance, "system_user", None))

        if hire_date and confirmation_date and confirmation_date < hire_date:
            raise serializers.ValidationError(
                {
                    "confirmation_date": "Confirmation date cannot be earlier than hire date."
                }
            )

        if hire_date and date_of_birth and date_of_birth >= hire_date:
            raise serializers.ValidationError(
                {"date_of_birth": "Date of birth must be earlier than hire date."}
            )

        if system_user:
            queryset = Employee.objects.filter(system_user=system_user)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {"system_user": "This system user is already linked to another employee."}
                )

        return attrs

    def _resolve_designation(self, validated_data):
        designation_name = validated_data.get("designation")
        if not designation_name:
            return validated_data

        designation_obj, _ = Designation.objects.get_or_create(
            name=designation_name,
            defaults={"is_active": True},
        )
        validated_data["designation"] = designation_obj.name
        validated_data["designation_ref"] = designation_obj
        return validated_data

    def create(self, validated_data):
        return super().create(self._resolve_designation(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._resolve_designation(validated_data))

    def get_profile_photo_url(self, obj):
        if not obj.profile_photo:
            return ""

        request = self.context.get("request")
        photo_url = obj.profile_photo.url
        if request:
            return request.build_absolute_uri(photo_url)
        return photo_url


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = [
            "id",
            "name",
            "code",
            "description",
            "default_days",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        normalized = value.strip()
        queryset = LeaveType.objects.filter(name__iexact=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A leave type with this name already exists.")
        return normalized

    def validate_code(self, value):
        normalized = value.strip().upper()
        queryset = LeaveType.objects.filter(code__iexact=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A leave type with this code already exists.")
        return normalized


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_code = serializers.CharField(source="employee.naming_series", read_only=True)
    employee_department = serializers.CharField(source="employee.department.name", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.full_name", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "naming_series",
            "employee",
            "employee_name",
            "employee_code",
            "employee_department",
            "leave_type",
            "leave_type_name",
            "start_date",
            "end_date",
            "total_days",
            "reason",
            "status",
            "status_label",
            "approval_note",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["total_days", "approved_by", "approved_at"]

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        leave_type = attrs.get("leave_type", getattr(self.instance, "leave_type", None))

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date cannot be earlier than start date."}
            )

        if leave_type and not leave_type.is_active:
            raise serializers.ValidationError(
                {"leave_type": "Please select an active leave type."}
            )

        return attrs

    def _set_total_days(self, validated_data):
        start_date = validated_data.get("start_date", getattr(self.instance, "start_date", None))
        end_date = validated_data.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date:
            validated_data["total_days"] = (end_date - start_date).days + 1
        return validated_data

    def create(self, validated_data):
        return super().create(self._set_total_days(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._set_total_days(validated_data))


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_code = serializers.CharField(source="employee.naming_series", read_only=True)
    naming_series = serializers.CharField(read_only=True)
    employee_department = serializers.CharField(source="employee.department.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    marked_by_name = serializers.CharField(source="marked_by.full_name", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            "id",
            "naming_series",
            "employee",
            "employee_name",
            "employee_code",
            "employee_department",
            "attendance_date",
            "status",
            "status_label",
            "check_in_time",
            "check_out_time",
            "notes",
            "marked_by",
            "marked_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["marked_by"]

    def validate(self, attrs):
        status_value = attrs.get("status", getattr(self.instance, "status", None))
        check_in_time = attrs.get(
            "check_in_time",
            getattr(self.instance, "check_in_time", None),
        )
        check_out_time = attrs.get(
            "check_out_time",
            getattr(self.instance, "check_out_time", None),
        )

        if check_out_time and not check_in_time:
            raise serializers.ValidationError(
                {"check_out_time": "Check-out time requires a check-in time."}
            )

        if check_in_time and check_out_time and check_out_time < check_in_time:
            raise serializers.ValidationError(
                {"check_out_time": "Check-out time cannot be earlier than check-in time."}
            )

        if status_value == AttendanceRecord.STATUS_ABSENT:
            attrs["check_in_time"] = None
            attrs["check_out_time"] = None

        return attrs
