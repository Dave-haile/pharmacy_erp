from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0019_batches_protect_foreign_keys"),
    ]

    operations = [
        migrations.AlterField(
            model_name="goodrecivingnoteitem",
            name="batch_number",
            field=models.ForeignKey(
                null=True,
                on_delete=models.PROTECT,
                to="tables.batches",
            ),
        ),
        migrations.AlterField(
            model_name="goodrecivingnoteitem",
            name="medicine",
            field=models.ForeignKey(
                on_delete=models.PROTECT,
                to="tables.medicine",
            ),
        ),
        migrations.AlterField(
            model_name="purchaseitem",
            name="batch",
            field=models.ForeignKey(
                null=True,
                on_delete=models.PROTECT,
                to="tables.batches",
            ),
        ),
        migrations.AlterField(
            model_name="stockentryitem",
            name="batch",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.PROTECT,
                related_name="stock_entry_items",
                to="tables.batches",
            ),
        ),
    ]
