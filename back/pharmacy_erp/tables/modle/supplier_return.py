from django.conf import settings
from django.db import models


class SupplierReturn(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_POSTED = "posted"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_POSTED, "Posted"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    posting_number = models.CharField(max_length=30, unique=True, blank=True)
    supplier = models.ForeignKey("supplier", on_delete=models.PROTECT)
    reference_document = models.CharField(max_length=50, blank=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="supplier_returns",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.posting_number:
            self.posting_number = f"PRET-{self.created_at.year}-{self.pk:04d}"
            super().save(update_fields=["posting_number"])

    def __str__(self):
        return self.posting_number or f"Supplier Return #{self.id}"

    class Meta:
        db_table = "SupplierReturn"
        verbose_name_plural = "Supplier Returns"

