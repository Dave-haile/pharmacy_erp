# pharmacy/models/sale.py

from django.conf import settings
from django.db import models


class Sale(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_POSTED = "posted"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_POSTED, "Posted"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    PAYMENT_METHOD_CASH = "cash"
    PAYMENT_METHOD_CARD = "card"
    PAYMENT_METHOD_MOBILE = "mobile_money"
    PAYMENT_METHOD_CREDIT = "credit"

    PAYMENT_METHOD_CHOICES = [
        (PAYMENT_METHOD_CASH, "Cash"),
        (PAYMENT_METHOD_CARD, "Card"),
        (PAYMENT_METHOD_MOBILE, "Mobile Money"),
        (PAYMENT_METHOD_CREDIT, "Credit"),
    ]

    posting_number = models.CharField(max_length=30, unique=True, blank=True)
    customer_name = models.CharField(max_length=200, blank=True)
    invoice_number = models.CharField(max_length=50, db_index=True)
    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sales_processed",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(
        max_length=50,
        choices=PAYMENT_METHOD_CHOICES,
        default=PAYMENT_METHOD_CASH,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.posting_number:
            self.posting_number = f"STOUT-{self.created_at.year}-{self.pk:04d}"
            super().save(update_fields=["posting_number"])

    def __str__(self):
        return self.posting_number or f"Sale #{self.id}"

    class Meta:
        db_table = "Sale"
        verbose_name_plural = "Sales"
        indexes = [
            models.Index(fields=["cashier", "created_at"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["invoice_number"]),
        ]
