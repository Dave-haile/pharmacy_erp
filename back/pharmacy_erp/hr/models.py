from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from tables.modle.naming_series import MedicineNamingSeries


class Department(models.Model):
    name = models.CharField(max_length=120, unique=True, db_index=True)
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
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    work_email = models.EmailField(unique=True, db_index=True)
    personal_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30)
    alternate_phone = models.CharField(max_length=30, blank=True)
    department = models.CharField(max_length=120, db_index=True)
    designation = models.CharField(max_length=120, db_index=True)
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
        super().save(*args, **kwargs)
