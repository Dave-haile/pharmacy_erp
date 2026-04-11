from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from tables.model_definitions.naming_series import MedicineNamingSeries


class Department(models.Model):
    name = models.CharField(max_length=120, unique=True, db_index=True)
    print = models.ForeignKey(
        "tables.PrintFormat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="departments",
    )
    description = models.TextField(blank=True)
    manager_name = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Department"
        ordering = ["name", "id"]

    def __str__(self):
        return self.name


class Designation(models.Model):
    name = models.CharField(max_length=120, unique=True, db_index=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="designations",
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Designation"
        ordering = ["name", "id"]

    def __str__(self):
        return self.name


class Employee(models.Model):
    STATUS_ACTIVE = "active"
    STATUS_ON_LEAVE = "on_leave"
    STATUS_SUSPENDED = "suspended"
    STATUS_TERMINATED = "terminated"
    STATUS_RESIGNED = "resigned"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_ON_LEAVE, "On Leave"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_TERMINATED, "Terminated"),
        (STATUS_RESIGNED, "Resigned"),
    ]

    EMPLOYMENT_FULL_TIME = "full_time"
    EMPLOYMENT_PART_TIME = "part_time"
    EMPLOYMENT_CONTRACT = "contract"
    EMPLOYMENT_INTERN = "intern"
    EMPLOYMENT_CHOICES = [
        (EMPLOYMENT_FULL_TIME, "Full Time"),
        (EMPLOYMENT_PART_TIME, "Part Time"),
        (EMPLOYMENT_CONTRACT, "Contract"),
        (EMPLOYMENT_INTERN, "Intern"),
    ]

    GENDER_MALE = "male"
    GENDER_FEMALE = "female"
    GENDER_OTHER = "other"
    GENDER_UNDISCLOSED = "undisclosed"
    GENDER_CHOICES = [
        (GENDER_MALE, "Male"),
        (GENDER_FEMALE, "Female"),
    ]

    naming_series = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
    )
    print = models.ForeignKey(
        "tables.PrintFormat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    work_email = models.EmailField(unique=True, db_index=True)
    personal_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30)
    alternate_phone = models.CharField(max_length=30, blank=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="employees",
        db_index=True,
    )
    designation = models.CharField(max_length=120, db_index=True)
    designation_ref = models.ForeignKey(
        Designation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
        db_index=True,
    )
    system_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employee_profile",
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_CHOICES,
        default=EMPLOYMENT_FULL_TIME,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        db_index=True,
    )
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        default=GENDER_MALE,
    )
    date_of_birth = models.DateField(blank=True, null=True)
    hire_date = models.DateField(db_index=True)
    confirmation_date = models.DateField(blank=True, null=True)
    salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    manager_name = models.CharField(max_length=200, blank=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    profile_photo = models.FileField(
        upload_to="employees/profile_photos/",
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Employee"
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["department", "designation"]),
            models.Index(fields=["designation_ref"]),
            models.Index(fields=["first_name", "last_name"]),
        ]

    def __str__(self):
        return f"{self.naming_series or self.pk} - {self.full_name}"

    @property
    def full_name(self):
        return " ".join(
            part for part in [self.first_name, self.middle_name, self.last_name] if part
        )

    def save(self, *args, **kwargs):
        if not self.pk and not self.naming_series:
            self.naming_series = MedicineNamingSeries.get_next_number("EMP")

        normalized_designation = (self.designation or "").strip()
        if self.designation_ref_id:
            self.designation = self.designation_ref.name
        elif normalized_designation:
            designation_obj, _ = Designation.objects.get_or_create(
                name=normalized_designation,
                defaults={"is_active": True},
            )
            self.designation_ref = designation_obj
            self.designation = designation_obj.name

        super().save(*args, **kwargs)


class LeaveType(models.Model):
    name = models.CharField(max_length=120, unique=True, db_index=True)
    code = models.CharField(max_length=20, unique=True, db_index=True)
    description = models.TextField(blank=True)
    default_days = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "LeaveType"
        ordering = ["name", "id"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class LeaveRequest(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name="leave_requests",
    )
    leave_type = models.ForeignKey(
        LeaveType,
        on_delete=models.PROTECT,
        related_name="leave_requests",
    )
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    total_days = models.PositiveIntegerField(default=1)
    reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    approval_note = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_leave_requests",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "LeaveRequest"
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["employee", "status"]),
            models.Index(fields=["leave_type", "status"]),
        ]

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.name}"


class AttendanceRecord(models.Model):
    STATUS_PRESENT = "present"
    STATUS_ABSENT = "absent"
    STATUS_ON_LEAVE = "on_leave"
    STATUS_CHOICES = [
        (STATUS_PRESENT, "Present"),
        (STATUS_ABSENT, "Absent"),
        (STATUS_ON_LEAVE, "On Leave"),
    ]

    naming_series = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name="attendance_records",
    )
    attendance_date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PRESENT,
        db_index=True,
    )
    check_in_time = models.TimeField(blank=True, null=True)
    check_out_time = models.TimeField(blank=True, null=True)
    notes = models.TextField(blank=True)
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_records_marked",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "AttendanceRecord"
        ordering = ["-attendance_date", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "attendance_date"],
                name="unique_employee_attendance_date",
            )
        ]
        indexes = [
            models.Index(fields=["naming_series"]),
            models.Index(fields=["employee", "attendance_date"]),
            models.Index(fields=["status", "attendance_date"]),
        ]

    def __str__(self):
        return f"{self.naming_series or self.pk} - {self.employee.full_name} - {self.attendance_date}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.naming_series:
            self.naming_series = MedicineNamingSeries.get_next_number("ATT")
        super().save(*args, **kwargs)
