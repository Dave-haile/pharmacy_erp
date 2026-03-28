from django.conf import settings
from django.db import models


class StockAdjustment(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_POSTED = "posted"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_POSTED, "Posted"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    REASON_COUNT = "cycle_count"
    REASON_WRITE_OFF = "write_off"
    REASON_DAMAGE = "damage"
    REASON_EXPIRY = "expiry"

    REASON_CHOICES = [
        (REASON_COUNT, "Cycle Count"),
        (REASON_WRITE_OFF, "Write-off"),
        (REASON_DAMAGE, "Damage"),
        (REASON_EXPIRY, "Expiry Disposal"),
    ]

    posting_number = models.CharField(max_length=30, unique=True, blank=True)
    reason = models.CharField(
        max_length=30,
        choices=REASON_CHOICES,
        default=REASON_COUNT,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="stock_adjustments",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.posting_number:
            self.posting_number = f"ADJ-{self.created_at.year}-{self.pk:04d}"
            super().save(update_fields=["posting_number"])

    def __str__(self):
        return self.posting_number or f"Adjustment #{self.id}"

    class Meta:
        db_table = "StockAdjustment"
        verbose_name_plural = "Stock Adjustments"

