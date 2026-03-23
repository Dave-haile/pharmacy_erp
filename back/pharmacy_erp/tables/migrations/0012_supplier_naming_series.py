from django.db import migrations, models, transaction
from django.utils import timezone


def populate_supplier_naming_series(apps, schema_editor):
    Supplier = apps.get_model("tables", "Supplier")
    MedicineNamingSeries = apps.get_model("tables", "MedicineNamingSeries")

    for supplier in Supplier.objects.filter(naming_series__isnull=True).order_by("id"):
        with transaction.atomic():
            current_year = timezone.now().year
            series, created = MedicineNamingSeries.objects.get_or_create(
                prefix="SUP",
                year=current_year,
                defaults={
                    "series_name": f"supplier_series_{current_year}",
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
                series.series_name = f"supplier_series_{current_year}"

            series.save()
            naming_series = f"SUP-{current_year}-{series.current_number:04d}"
        Supplier.objects.filter(pk=supplier.pk).update(naming_series=naming_series)


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0011_supplier_status_and_activity"),
    ]

    operations = [
        migrations.AddField(
            model_name="supplier",
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
            populate_supplier_naming_series,
            migrations.RunPython.noop,
        ),
    ]
