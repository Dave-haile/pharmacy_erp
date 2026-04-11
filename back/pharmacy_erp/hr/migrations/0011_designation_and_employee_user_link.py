from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def seed_designations_and_links(apps, schema_editor):
    Designation = apps.get_model("hr", "Designation")
    Employee = apps.get_model("hr", "Employee")

    designation_map = {}
    for employee in Employee.objects.exclude(designation__isnull=True).exclude(
        designation__exact=""
    ):
        name = (employee.designation or "").strip()
        if not name:
            continue
        if name not in designation_map:
            designation_obj, _ = Designation.objects.get_or_create(
                name=name,
                defaults={"is_active": True},
            )
            designation_map[name] = designation_obj.id

        employee.designation_ref_id = designation_map[name]
        employee.save(update_fields=["designation_ref"])


class Migration(migrations.Migration):
    dependencies = [
        ("hr", "0010_attendance_record_naming_series"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Designation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(db_index=True, max_length=120, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "department",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="designations",
                        to="hr.department",
                    ),
                ),
            ],
            options={
                "db_table": "Designation",
                "ordering": ["name", "id"],
            },
        ),
        migrations.AddField(
            model_name="employee",
            name="designation_ref",
            field=models.ForeignKey(
                blank=True,
                db_index=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="employees",
                to="hr.designation",
            ),
        ),
        migrations.AddField(
            model_name="employee",
            name="system_user",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="employee_profile",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddIndex(
            model_name="employee",
            index=models.Index(fields=["designation_ref"], name="Employee_designa_923495_idx"),
        ),
        migrations.RunPython(seed_designations_and_links, migrations.RunPython.noop),
    ]
