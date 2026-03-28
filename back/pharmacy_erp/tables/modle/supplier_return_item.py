from django.db import models


class SupplierReturnItem(models.Model):
    supplier_return = models.ForeignKey(
        "supplierreturn",
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
        db_table = "SupplierReturnItem"
        verbose_name_plural = "Supplier Return Items"
        indexes = [
            models.Index(fields=["supplier_return", "medicine"]),
        ]

