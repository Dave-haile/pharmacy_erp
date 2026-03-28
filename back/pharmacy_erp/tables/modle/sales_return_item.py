from django.db import models


class SalesReturnItem(models.Model):
    sales_return = models.ForeignKey(
        "salesreturn",
        on_delete=models.CASCADE,
        related_name="items",
    )
    medicine = models.ForeignKey("medicine", on_delete=models.PROTECT)
    batch = models.ForeignKey("batches", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "SalesReturnItem"
        verbose_name_plural = "Sales Return Items"
        indexes = [
            models.Index(fields=["sales_return", "medicine"]),
        ]

