# pharmacy/models/supplier.py

from django.db import models

from .naming_series import MedicineNamingSeries


class Supplier(models.Model):
    STATUS_DRAFT = "Draft"
    STATUS_SUBMITTED = "Submitted"
    STATUS_CANCELLED = "Cancelled"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_SUBMITTED, "Submitted"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    name = models.CharField(max_length=200)
    print = models.ForeignKey(
        "tables.PrintFormat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="suppliers",
    )
    contact_person = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    naming_series = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.pk and not self.naming_series:
            self.naming_series = MedicineNamingSeries.get_next_number("SUP")

        super().save(*args, **kwargs)

    class Meta:
        db_table = "Supplier"
        verbose_name_plural = "Suppliers"
        indexes = [
            models.Index(fields=["name"]),
        ]
