from django.conf import settings
from django.db import migrations, models


def populate_posting_numbers(apps, schema_editor):
    Sale = apps.get_model("tables", "Sale")
    for sale in Sale.objects.filter(posting_number=""):
        created_at = getattr(sale, "created_at", None)
        year = created_at.year if created_at else 0
        sale.posting_number = f"STOUT-{year}-{sale.pk:04d}"
        sale.save(update_fields=["posting_number"])


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0012_supplier_naming_series"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="sale",
            name="customer_name",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="sale",
            name="invoice_number",
            field=models.CharField(db_index=True, default="", max_length=50),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="sale",
            name="notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="sale",
            name="posting_number",
            field=models.CharField(blank=True, max_length=30, unique=True),
        ),
        migrations.AddField(
            model_name="sale",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("posted", "Posted"),
                    ("cancelled", "Cancelled"),
                ],
                db_index=True,
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="sale",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
        ),
        migrations.AlterField(
            model_name="sale",
            name="cashier",
            field=models.ForeignKey(
                on_delete=models.PROTECT,
                related_name="sales_processed",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="sale",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("cash", "Cash"),
                    ("card", "Card"),
                    ("mobile_money", "Mobile Money"),
                    ("credit", "Credit"),
                ],
                default="cash",
                max_length=50,
            ),
        ),
        migrations.AddIndex(
            model_name="sale",
            index=models.Index(
                fields=["status", "created_at"],
                name="Sale_status_9b0f4b_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="sale",
            index=models.Index(
                fields=["invoice_number"],
                name="Sale_invoice_8d44ab_idx",
            ),
        ),
        migrations.RunPython(populate_posting_numbers, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="sale",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
