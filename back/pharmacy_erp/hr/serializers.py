from rest_framework import serializers

from .models import Department, Employee


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


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    employment_type_label = serializers.CharField(
        source="get_employment_type_display",
        read_only=True,
    )
    gender_label = serializers.CharField(source="get_gender_display", read_only=True)
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
            "designation",
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
            "profile_photo",
            "profile_photo_url",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        hire_date = attrs.get("hire_date")
        confirmation_date = attrs.get("confirmation_date")
        date_of_birth = attrs.get("date_of_birth")

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

        department_name = attrs.get("department")
        if department_name:
            department = Department.objects.filter(
                name__iexact=department_name.strip()
            ).first()
            if not department:
                raise serializers.ValidationError(
                    {"department": "Please select a valid department."}
                )
            attrs["department"] = department.name

        return attrs

    def get_profile_photo_url(self, obj):
        if not obj.profile_photo:
            return ""

        request = self.context.get("request")
        photo_url = obj.profile_photo.url
        if request:
            return request.build_absolute_uri(photo_url)
        return photo_url
