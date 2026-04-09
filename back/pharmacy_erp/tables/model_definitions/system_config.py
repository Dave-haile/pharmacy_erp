# pharmacy/models/system_config.py

from django.db import models


class SystemConfig(models.Model):
    """Global system configuration for inventory costing."""

    METHOD_FIFO = "fifo"
    METHOD_LIFO = "lifo"
    METHOD_FEFO = "fefo"
    METHOD_AVERAGE = "average"

    METHOD_CHOICES = [
        (METHOD_FIFO, "FIFO (First In, First Out)"),
        (METHOD_LIFO, "LIFO (Last In, First Out)"),
        (METHOD_FEFO, "FEFO (First Expired First Out)"),
        (METHOD_AVERAGE, "Average Cost"),
    ]

    # Default costing method for new medicines
    default_costing_method = models.CharField(
        max_length=20,
        choices=METHOD_CHOICES,
        default=METHOD_FIFO,
    )

    # Whether to allow changing costing method after transactions
    allow_costing_method_change = models.BooleanField(
        default=False,
        help_text="Changing costing method after transactions requires recalculation of all history",
    )

    # Warnings
    low_stock_threshold_days = models.PositiveIntegerField(
        default=30,
        help_text="Warn when stock will expire within this many days",
    )

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "SystemConfig"
        verbose_name_plural = "System Configuration"

    def save(self, *args, **kwargs):
        # Ensure only one config record exists
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_config(cls):
        """Get or create the singleton config."""
        config, created = cls.objects.get_or_create(pk=1)
        return config

    @classmethod
    def get_default_costing_method(cls):
        """Get the default costing method."""
        return cls.get_config().default_costing_method
