from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("hr", "0007_employee_department_fk"),
    ]

    operations = [
        migrations.CreateModel(
            name="LeaveType",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(db_index=True, max_length=120, unique=True)),
                ("code", models.CharField(db_index=True, max_length=20, unique=True)),
                ("description", models.TextField(blank=True)),
                ("default_days", models.PositiveIntegerField(default=1)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "LeaveType",
                "ordering": ["name", "id"],
            },
        ),
        migrations.CreateModel(
            name="LeaveRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("start_date", models.DateField(db_index=True)),
                ("end_date", models.DateField(db_index=True)),
                ("total_days", models.PositiveIntegerField(default=1)),
                ("reason", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected"), ("cancelled", "Cancelled")], db_index=True, default="pending", max_length=20)),
                ("approval_note", models.TextField(blank=True)),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("approved_by", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="approved_leave_requests", to=settings.AUTH_USER_MODEL)),
                ("employee", models.ForeignKey(on_delete=models.deletion.PROTECT, related_name="leave_requests", to="hr.employee")),
                ("leave_type", models.ForeignKey(on_delete=models.deletion.PROTECT, related_name="leave_requests", to="hr.leavetype")),
            ],
            options={
                "db_table": "LeaveRequest",
                "ordering": ["-created_at", "-id"],
            },
        ),
        migrations.AddIndex(
            model_name="leaverequest",
            index=models.Index(fields=["employee", "status"], name="LeaveReques_employe_77f6dc_idx"),
        ),
        migrations.AddIndex(
            model_name="leaverequest",
            index=models.Index(fields=["leave_type", "status"], name="LeaveReques_leave_t_b8c61d_idx"),
        ),
    ]
