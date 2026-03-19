from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tables", "0009_stock_entry_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="stockentryitem",
            name="batch_number",
            field=models.CharField(default="", max_length=100),
            preserve_default=False,
        ),
    ]
