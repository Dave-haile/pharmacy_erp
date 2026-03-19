from django.db import models

from .batches import Batches
from .medicine import Medicine
from .stock_entry import StockEntry


class StockEntryItem(models.Model):
    stock_entry = models.ForeignKey(
        StockEntry,
        on_delete=models.CASCADE,
        related_name="items",
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT,
        related_name="stock_entry_items",
    )
    batch = models.ForeignKey(
        Batches,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_entry_items",
    )
    batch_number = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    manufacturing_date = models.DateField()
    expiry_date = models.DateField()
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.stock_entry.posting_number} - {self.medicine.name}"

    class Meta:
        db_table = "StockEntryItem"
        verbose_name_plural = "Stock Entry Items"
        indexes = [
            models.Index(fields=["stock_entry", "medicine"]),
            models.Index(fields=["batch"]),
        ]
