from django.db import models

class Batches(models.Model):
    batch_id = models.AutoField(primary_key=True)
    product_id=models.ForeignKey('medicine',on_delete=models.PROTECT)
    batch_number=models.CharField(max_length=50,unique=True)
    expiry_date=models.DateField()
    manufacturing_date=models.DateField()
    quantity=models.IntegerField()
    purchase_price=models.DecimalField(max_digits=10,decimal_places=2)
    supplier_id=models.ForeignKey('supplier',on_delete=models.PROTECT)
    created_at=models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.batch_number
    
    class Meta:
        db_table = 'Batches'
        verbose_name_plural = 'Batches'
