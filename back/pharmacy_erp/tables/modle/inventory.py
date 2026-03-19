# pharmacy/models/inventory.py

from django.db import models
from .medicine import Medicine

class Inventory(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="inventory_batches"
    )

    quantity = models.PositiveIntegerField()
    batch_number = models.CharField(max_length=100)
    expiry_date = models.DateField()

    location = models.CharField(max_length=150, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("medicine", "batch_number")

    def __str__(self):
        return f"{self.medicine.name} - Batch {self.batch_number}"

    class Meta:
        db_table = 'Inventory'
        verbose_name_plural = 'Inventory'
        indexes = [
            models.Index(fields=['medicine', 'batch_number']),
        ]
