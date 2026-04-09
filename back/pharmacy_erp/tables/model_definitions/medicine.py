# pharmacy/models/medicine.py

from django.db import models

from .category import Category
from .naming_series import MedicineNamingSeries
from .supplier import Supplier


class Medicine(models.Model):
    STATUS_DRAFT = "Draft"
    STATUS_SUBMITTED = "Submitted"
    STATUS_CHOICES = [
        (STATUS_DRAFT, STATUS_DRAFT),
        (STATUS_SUBMITTED, STATUS_SUBMITTED),
    ]

    # Costing method choices
    COST_FIFO = "fifo"
    COST_LIFO = "lifo"
    COST_FEFO = "fefo"
    COST_AVERAGE = "average"

    COSTING_METHOD_CHOICES = [
        (COST_FIFO, "FIFO (First In, First Out)"),
        (COST_LIFO, "LIFO (Last In, First Out)"),
        (COST_FEFO, "FEFO (First Expired First Out)"),
        (COST_AVERAGE, "Average Cost"),
    ]

    name = models.CharField(max_length=200, db_index=True)
    generic_name = models.CharField(max_length=200, blank=True, db_index=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="medicines",
        db_index=True,
    )

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medicines",
        db_index=True,
    )

    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)

    barcode = models.CharField(max_length=100, unique=True)
    print = models.ForeignKey(
        "tables.PrintFormat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medicines",
    )
    naming_series = models.CharField(
        max_length=20, unique=True, blank=True, null=True, db_index=True
    )
    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
    )

    costing_method = models.CharField(
        max_length=20,
        choices=COSTING_METHOD_CHOICES,
        default=COST_FIFO,
        db_index=True,
        help_text="Costing method for calculating COGS on stock out",
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate naming series if it's a new medicine and doesn't have one
        if not self.pk and not self.naming_series:
            self.naming_series = MedicineNamingSeries.get_next_number()

        super().save(*args, **kwargs)

    class Meta:
        db_table = "Medicine"
        verbose_name_plural = "Medicines"
