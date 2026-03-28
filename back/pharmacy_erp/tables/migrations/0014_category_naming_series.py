from django.db import migrations, models, transaction
from django.utils import timezone


def populate_category_naming_series(apps, schema_editor):
    Category = apps.get_model("tables", "Category")
    MedicineNamingSeries = apps.get_model("tables", "MedicineNamingSeries")

    for category in Category.objects.filter(naming_series__isnull=True).order_by("id"):
        with transaction.atomic():
            current_year = timezone.now().year
            series, created = MedicineNamingSeries.objects.get_or_create(
                prefix="CAT",
                year=current_year,
                defaults={
                    "series_name": f"category_series_{current_year}",
                    "current_number": 0,
                },
            )
            if not created:
                series = MedicineNamingSeries.objects.select_for_update().get(
                    pk=series.pk
                )
                series.current_number += 1
            else:
                series.current_number = 1

            if not series.series_name:
                series.series_name = f"category_series_{current_year}"

            series.save()
            naming_series = f"CAT-{current_year}-{series.current_number:04d}"

        Category.objects.filter(pk=category.pk).update(naming_series=naming_series)


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0013_sale_stock_out_workflow"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="naming_series",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=20,
                null=True,
                unique=True,
            ),
        ),
        migrations.RunPython(
            populate_category_naming_series,
            migrations.RunPython.noop,
        ),
    ]
