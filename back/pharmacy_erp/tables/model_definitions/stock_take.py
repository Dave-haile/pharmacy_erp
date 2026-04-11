# pharmacy/models/stock_take.py
"""
Stock Take model for physical inventory counting.
Records the actual counted quantity vs system quantity.
"""

from django.db import models
from django.conf import settings


class StockTake(models.Model):
    """
    Stock Take document for periodic physical inventory counting.
    Records the difference between system quantity and actual counted quantity.
    """

    STATUS_DRAFT = "Draft"
    STATUS_IN_PROGRESS = "In Progress"
    STATUS_COMPLETED = "Completed"
    STATUS_CANCELLED = "Cancelled"

    STATUS_CHOICES = [
        (STATUS_DRAFT, STATUS_DRAFT),
        (STATUS_IN_PROGRESS, STATUS_IN_PROGRESS),
        (STATUS_COMPLETED, STATUS_COMPLETED),
        (STATUS_CANCELLED, STATUS_CANCELLED),
    ]

    posting_number = models.CharField(
        max_length=20, unique=True, blank=True, null=True, db_index=True
    )
    title = models.CharField(max_length=200, help_text="Stock take title/reference")
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="stock_takes",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.posting_number} - {self.title}"

    def calculate_totals(self):
        """Calculate and return totals for all items."""
        items = self.items.all()
        total_items = items.count()
        matched_items = sum(1 for item in items if item.variance == 0)
        positive_variance_items = sum(1 for item in items if item.variance > 0)
        negative_variance_items = sum(1 for item in items if item.variance < 0)
        total_variance_value = sum(
            item.variance * (item.unit_cost or 0) for item in items
        )
        return {
            "total_items": total_items,
            "matched_items": matched_items,
            "positive_variance_items": positive_variance_items,
            "negative_variance_items": negative_variance_items,
            "total_variance_value": total_variance_value,
            "accuracy_rate": (
                (matched_items / total_items * 100) if total_items > 0 else 100
            ),
        }

    class Meta:
        app_label = "inventory"
        db_table = "StockTake"
        ordering = ["-created_at"]


class StockTakeItem(models.Model):
    """
    Individual item counted during a stock take.
    Records system quantity, counted quantity, and variance.
    """

    stock_take = models.ForeignKey(
        StockTake, on_delete=models.CASCADE, related_name="items"
    )
    medicine = models.ForeignKey(
        "tables.Medicine", on_delete=models.PROTECT, related_name="stock_take_items"
    )
    batch = models.ForeignKey(
        "tables.Batches",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_take_items",
        help_text="Optional batch reference for batch-specific counting",
    )
    system_quantity = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Quantity in system before count"
    )
    counted_quantity = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Actual counted quantity"
    )
    unit_cost = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    notes = models.TextField(blank=True)
    counted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="counted_stock_take_items",
    )
    counted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def variance(self):
        """Calculate variance (counted - system)."""
        return self.counted_quantity - self.system_quantity

    @property
    def variance_percentage(self):
        """Calculate variance percentage."""
        if self.system_quantity == 0:
            if self.counted_quantity == 0:
                return 0
            return 100  # Infinite variance
        return (self.variance / self.system_quantity) * 100

    @property
    def variance_status(self):
        """Return variance status: matched, surplus, shortage."""
        variance = self.variance
        if variance == 0:
            return "matched"
        elif variance > 0:
            return "surplus"
        return "shortage"

    def __str__(self):
        return f"{self.stock_take.posting_number} - {self.medicine.name}"

    class Meta:
        app_label = "inventory"
        db_table = "StockTakeItem"
        ordering = ["stock_take", "medicine__name"]
        unique_together = ["stock_take", "medicine", "batch"]
