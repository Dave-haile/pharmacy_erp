from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("hr", "0008_leave_management"),
    ]

    operations = [
        migrations.CreateModel(
            name="AttendanceRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("attendance_date", models.DateField(db_index=True)),
                ("status", models.CharField(choices=[("present", "Present"), ("absent", "Absent"), ("on_leave", "On Leave")], db_index=True, default="present", max_length=20)),
                ("check_in_time", models.TimeField(blank=True, null=True)),
                ("check_out_time", models.TimeField(blank=True, null=True)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("employee", models.ForeignKey(on_delete=models.deletion.PROTECT, related_name="attendance_records", to="hr.employee")),
                ("marked_by", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="attendance_records_marked", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "AttendanceRecord",
                "ordering": ["-attendance_date", "-id"],
            },
        ),
        migrations.AddConstraint(
            model_name="attendancerecord",
            constraint=models.UniqueConstraint(fields=("employee", "attendance_date"), name="unique_employee_attendance_date"),
        ),
        migrations.AddIndex(
            model_name="attendancerecord",
            index=models.Index(fields=["employee", "attendance_date"], name="AttendanceR_employe_7e4d0d_idx"),
        ),
        migrations.AddIndex(
            model_name="attendancerecord",
            index=models.Index(fields=["status", "attendance_date"], name="AttendanceR_status__66180a_idx"),
        ),
    ]
