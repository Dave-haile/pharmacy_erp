# pharmacy/models/expiry_notification.py
"""
Expiry Notification model for tracking medicine expiration alerts.
"""

from django.db import models
from django.conf import settings


class ExpiryNotification(models.Model):
    """
    Expiry Notification for medicines approaching expiration.
    Tracks notifications sent and their acknowledgment status.
    """

    STATUS_PENDING = "Pending"
    STATUS_ACKNOWLEDGED = "Acknowledged"
    STATUS_ACTIONED = "Actioned"
    STATUS_DISMISSED = "Dismissed"

    STATUS_CHOICES = [
        (STATUS_PENDING, STATUS_PENDING),
        (STATUS_ACKNOWLEDGED, STATUS_ACKNOWLEDGED),
        (STATUS_ACTIONED, STATUS_ACTIONED),
        (STATUS_DISMISSED, STATUS_DISMISSED),
    ]

    PRIORITY_LOW = "Low"  # > 90 days
    PRIORITY_MEDIUM = "Medium"  # 60-90 days
    PRIORITY_HIGH = "High"  # 30-60 days
    PRIORITY_CRITICAL = "Critical"  # < 30 days

    PRIORITY_CHOICES = [
        (PRIORITY_LOW, PRIORITY_LOW),
        (PRIORITY_MEDIUM, PRIORITY_MEDIUM),
        (PRIORITY_HIGH, PRIORITY_HIGH),
        (PRIORITY_CRITICAL, PRIORITY_CRITICAL),
    ]

    batch = models.ForeignKey(
        "tables.Batches",
        on_delete=models.CASCADE,
        related_name="expiry_notifications",
        db_index=True,
    )
    medicine = models.ForeignKey(
        "tables.Medicine",
        on_delete=models.CASCADE,
        related_name="expiry_notifications",
        db_index=True,
    )
    expiry_date = models.DateField(db_index=True)
    days_to_expiry = models.PositiveIntegerField(help_text="Days until expiration")
    quantity_at_risk = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Quantity that will expire"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM, db_index=True
    )
    notification_type = models.CharField(
        max_length=50,
        default="expiry_warning",
        help_text="Type: expiry_warning, expired, or disposal_required",
    )
    notes = models.TextField(blank=True)
    action_taken = models.TextField(
        blank=True, help_text="Description of action taken (discount, return, dispose)"
    )
    notified_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acknowledged_expiry_notifications",
    )
    actioned_at = models.DateTimeField(null=True, blank=True)
    actioned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="actioned_expiry_notifications",
    )

    class Meta:
        app_label = "inventory"
        db_table = "ExpiryNotification"
        ordering = ["expiry_date", "-priority"]
        indexes = [
            models.Index(
                fields=["status", "priority"],
                name="expnotif_stat_prio_idx",
            ),
            models.Index(fields=["expiry_date"], name="expnotif_expiry_idx"),
            models.Index(
                fields=["medicine", "status"],
                name="expnotif_med_stat_idx",
            ),
        ]

    def __str__(self):
        return f"Expiry Alert - {self.medicine.name} (expires {self.expiry_date})"

    @property
    def is_expired(self):
        """Check if the batch has already expired."""
        from django.utils import timezone

        return self.expiry_date < timezone.localdate()

    @property
    def is_critical(self):
        """Check if this is a critical (near expiry) notification."""
        return self.priority == self.PRIORITY_CRITICAL

    @property
    def unit_value(self):
        """Calculate unit value at risk."""
        batch = self.batch
        return batch.purchase_price if batch else None

    @property
    def total_value_at_risk(self):
        """Calculate total value at risk."""
        if self.unit_value:
            return self.quantity_at_risk * self.unit_value
        return None

    @staticmethod
    def calculate_priority(days_to_expiry):
        """Determine notification priority based on days to expiry."""
        if days_to_expiry <= 30:
            return ExpiryNotification.PRIORITY_CRITICAL
        elif days_to_expiry <= 60:
            return ExpiryNotification.PRIORITY_HIGH
        elif days_to_expiry <= 90:
            return ExpiryNotification.PRIORITY_MEDIUM
        return ExpiryNotification.PRIORITY_LOW


class ExpiryConfig(models.Model):
    """
    Global configuration for expiry notifications.
    Controls when and how expiry alerts are generated.
    """

    name = models.CharField(max_length=100, unique=True, default="default")
    warning_days = models.PositiveIntegerField(
        default=90, help_text="Days before expiry to start warnings"
    )
    critical_days = models.PositiveIntegerField(
        default=30, help_text="Days before expiry for critical alert"
    )
    notification_frequency_days = models.PositiveIntegerField(
        default=7, help_text="How often to send recurring notifications"
    )
    auto_dispose_expired = models.BooleanField(
        default=False, help_text="Automatically mark expired batches for disposal"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "inventory"
        db_table = "ExpiryConfig"

    def __str__(self):
        return f"Expiry Config - {self.warning_days} days warning"

    @classmethod
    def get_config(cls):
        """Get the active configuration."""
        config, _ = cls.objects.get_or_create(name="default", defaults={"is_active": True})
        return config
