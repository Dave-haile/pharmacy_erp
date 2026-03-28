from django.db import models


class StockAdjustmentItem(models.Model):
    stock_adjustment = models.ForeignKey(
        "stockadjustment",
        on_delete=models.CASCADE,
        related_name="items",
    )
    medicine = models.ForeignKey("medicine", on_delete=models.PROTECT)
    batch = models.ForeignKey("batches", on_delete=models.PROTECT)
    quantity_change = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "StockAdjustmentItem"
        verbose_name_plural = "Stock Adjustment Items"
        indexes = [
            models.Index(fields=["stock_adjustment", "medicine"]),
        ]

