# pharmacy/models/reorder_alert.py
"""
Reorder Alert model for managing stock reorder notifications.
"""

from django.db import models
from django.conf import settings


class ReorderAlert(models.Model):
    """
    Reorder Alert configuration and tracking for medicines.
    Tracks when stock falls below reorder level and manages notifications.
    """

    STATUS_ACTIVE = "Active"
    STATUS_ACKNOWLEDGED = "Acknowledged"
    STATUS_RESOLVED = "Resolved"
    STATUS_DISMISSED = "Dismissed"

    STATUS_CHOICES = [
        (STATUS_ACTIVE, STATUS_ACTIVE),
        (STATUS_ACKNOWLEDGED, STATUS_ACKNOWLEDGED),
        (STATUS_RESOLVED, STATUS_RESOLVED),
        (STATUS_DISMISSED, STATUS_DISMISSED),
    ]

    PRIORITY_LOW = "Low"
    PRIORITY_MEDIUM = "Medium"
    PRIORITY_HIGH = "High"
    PRIORITY_CRITICAL = "Critical"

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, PRIORITY_LOW),
        (PRIORITY_MEDIUM, PRIORITY_MEDIUM),
        (PRIORITY_HIGH, PRIORITY_HIGH),
        (PRIORITY_CRITICAL, PRIORITY_CRITICAL),
    ]

    medicine = models.ForeignKey(
        "tables.Medicine",
        on_delete=models.CASCADE,
        related_name="reorder_alerts",
        db_index=True,
    )
    current_stock = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Stock level when alert was triggered"
    )
    reorder_level = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Configured reorder level"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True
    )
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM, db_index=True
    )
    notes = models.TextField(blank=True)
    triggered_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acknowledged_reorder_alerts",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = "inventory"
        db_table = "ReorderAlert"
        ordering = ["-triggered_at"]
        indexes = [
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["medicine", "status"]),
        ]

    def __str__(self):
        return f"Reorder Alert - {self.medicine.name} ({self.status})"

    @property
    def shortage_quantity(self):
        """How much below reorder level."""
        return self.reorder_level - self.current_stock

    @property
    def suggested_order_quantity(self):
        """Suggested quantity to order (reorder_level * 2 as default)."""
        # Common practice: order enough to have buffer stock
        # Default: order double the reorder level
        return self.reorder_level * 2


class ReorderConfig(models.Model):
    """
    Global and per-medicine reorder configuration.
    Stores reorder level and safety stock settings.
    """

    medicine = models.OneToOneField(
        "tables.Medicine",
        on_delete=models.CASCADE,
        related_name="reorder_config",
        db_index=True,
    )
    reorder_level = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=10,
        help_text="Stock level that triggers reorder alert",
    )
    safety_stock = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=5,
        help_text="Minimum safety stock to maintain",
    )
    reorder_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=50,
        help_text="Default quantity to order when reorder is triggered",
    )
    lead_time_days = models.PositiveIntegerField(
        default=7, help_text="Expected lead time for restocking in days"
    )
    is_active = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "inventory"
        db_table = "ReorderConfig"

    def __str__(self):
        return f"Reorder Config - {self.medicine.name}"

    def should_trigger_alert(self, current_stock):
        """Check if an alert should be triggered based on current stock."""
        return current_stock <= self.reorder_level and self.is_active
