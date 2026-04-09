# pharmacy/models/category.py

from django.db import models

from .naming_series import MedicineNamingSeries


class Category(models.Model):
    id = models.AutoField(primary_key=True)  # Keep existing id field
    name = models.CharField(
        max_length=150, unique=True, db_index=True
    )  # Keep existing name field
    category_name = models.CharField(
        max_length=150, unique=True, db_index=True, null=True, blank=True
    )  # New field
    print = models.ForeignKey(
        "tables.PrintFormat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="categories",
    )
    naming_series = models.CharField(
        max_length=20, unique=True, blank=True, null=True, db_index=True
    )
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name if self.name else self.category_name or f"Category {self.id}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.naming_series:
            self.naming_series = MedicineNamingSeries.get_next_number("CAT")

        super().save(*args, **kwargs)

    class Meta:
        db_table = "Category"
        verbose_name_plural = "Categories"
