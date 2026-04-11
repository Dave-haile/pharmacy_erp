from django.db import migrations, models


def populate_attendance_naming_series(apps, schema_editor):
    AttendanceRecord = apps.get_model("hr", "AttendanceRecord")
    for record in AttendanceRecord.objects.filter(naming_series__isnull=True).order_by("id"):
        record.naming_series = f"ATT-{record.id:05d}"
        record.save(update_fields=["naming_series"])


class Migration(migrations.Migration):

    dependencies = [
        ("hr", "0009_attendance_records"),
    ]

    operations = [
        migrations.AddField(
            model_name="attendancerecord",
            name="naming_series",
            field=models.CharField(blank=True, db_index=True, max_length=20, null=True, unique=True),
        ),
        migrations.RunPython(populate_attendance_naming_series, migrations.RunPython.noop),
    ]
