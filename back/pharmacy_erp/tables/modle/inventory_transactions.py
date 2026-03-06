from django.db import models

class StockLedger(models.Model):
    transaction_id = models.AutoField(primary_key=True)
    medicine=models.ForeignKey('medicine',on_delete=models.SET_NULL, null=True)
    batch = models.ForeignKey('batches', on_delete=models.SET_NULL, null=True)
    transaction_type = models.CharField(max_length=20,choices=(('purchase', 'sale', 'return', 'adjustment', 'damage'))),
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    reference_document = models.CharField(max_length=50)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.transaction_id
    
    class Meta:
        db_table = 'StockLedger'
        verbose_name_plural = 'Stock Ledgers'