# pharmacy/models/category.py

from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    class Meta:
        db_table = 'Category'
        verbose_name_plural = 'Categories'