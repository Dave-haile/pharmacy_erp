from django.db import models


class GoodRecivingNoteItem(models.Model):
    good_reciving_note = models.ForeignKey("GoodRecivingNote", on_delete=models.CASCADE)
    medicine = models.ForeignKey("Medicine", on_delete=models.PROTECT)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    batch_number = models.ForeignKey("batches", on_delete=models.PROTECT, null=True)
    expiry_date = models.DateField()

    def __str__(self):
        return f"{self.medicine.name} x {self.quantity}"

    class Meta:
        db_table = "GoodRecivingNoteItem"
        verbose_name_plural = "Good Reciving Note Items"
