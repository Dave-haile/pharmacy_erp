from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0010_stockentryitem_batch_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="supplier",
            name="is_active",
            field=models.BooleanField(db_index=True, default=True),
        ),
        migrations.AddField(
            model_name="supplier",
            name="status",
            field=models.CharField(
                choices=[
                    ("Draft", "Draft"),
                    ("Submitted", "Submitted"),
                    ("Cancelled", "Cancelled"),
                ],
                db_index=True,
                default="Draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="supplier",
            name="updated_at",
            field=models.DateTimeField(default=timezone.now),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="supplier",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
