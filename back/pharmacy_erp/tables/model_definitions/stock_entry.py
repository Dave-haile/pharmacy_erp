from django.conf import settings
from django.db import models

from .purchase import Purchase
from .GoodRecivingNote import GoodRecivingNote
from .supplier import Supplier


class StockEntry(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_POSTED = "posted"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_POSTED, "Posted"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    posting_number = models.CharField(max_length=30, unique=True, blank=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name="stock_entries",
    )
    purchase = models.ForeignKey(
        Purchase,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_entries",
    )
    goods_receiving_note = models.ForeignKey(
        GoodRecivingNote,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_entries",
    )
    print = models.ForeignKey(
        "tables.PrintFormat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_entries",
    )
    invoice_number = models.CharField(max_length=50, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
    )
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="stock_entries_received",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.posting_number:
            self.posting_number = f"STIN-{self.created_at.year}-{self.pk:04d}"
            super().save(update_fields=["posting_number"])

    def __str__(self):
        return self.posting_number or f"Stock Entry #{self.pk}"

    class Meta:
        db_table = "StockEntry"
        verbose_name_plural = "Stock Entries"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["supplier", "created_at"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["invoice_number"]),
        ]
