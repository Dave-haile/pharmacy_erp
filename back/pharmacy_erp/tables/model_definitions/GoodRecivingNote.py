from django.db import models
from django.conf import settings

class GoodRecivingNote(models.Model):
    good_reciving_note_id = models.AutoField(primary_key=True)
    purchase = models.ForeignKey('Purchase', on_delete=models.SET_NULL, null=True)
    print = models.ForeignKey(
        "tables.PrintFormat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="goods_receiving_notes",
    )
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    supplier_id = models.ForeignKey('Supplier', on_delete=models.SET_NULL, null=True)
    invoice_number = models.CharField(max_length=50)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    received_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Good Reciving Note #{self.good_reciving_note_id}"

    class Meta:
        db_table = 'Good Reciving Note'
        verbose_name_plural = 'Good Reciving Notes'
