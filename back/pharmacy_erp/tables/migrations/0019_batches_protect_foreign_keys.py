from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0018_adjustments_and_returns"),
    ]

    operations = [
        migrations.AlterField(
            model_name="batches",
            name="product_id",
            field=models.ForeignKey(on_delete=models.PROTECT, to="tables.medicine"),
        ),
        migrations.AlterField(
            model_name="batches",
            name="supplier_id",
            field=models.ForeignKey(on_delete=models.PROTECT, to="tables.supplier"),
        ),
    ]

