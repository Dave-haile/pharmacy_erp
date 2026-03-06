# pharmacy/models/supplier.py

from django.db import models

class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'Supplier'
        verbose_name_plural = 'Suppliers'
        indexes = [
            models.Index(fields=['name']),
        ]
