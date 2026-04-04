from django.db import migrations, models


def seed_departments_from_employees(apps, schema_editor):
    Department = apps.get_model("hr", "Department")
    Employee = apps.get_model("hr", "Employee")

    existing_names = set(
        Department.objects.values_list("name", flat=True)
    )
    employee_departments = (
        Employee.objects.exclude(department__isnull=True)
        .exclude(department__exact="")
        .values_list("department", flat=True)
        .distinct()
    )

    for department_name in employee_departments:
        normalized = (department_name or "").strip()
        if normalized and normalized not in existing_names:
            Department.objects.create(name=normalized)
            existing_names.add(normalized)


class Migration(migrations.Migration):

    dependencies = [
        ("hr", "0003_alter_employee_gender_choices"),
    ]

    operations = [
        migrations.CreateModel(
            name="Department",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(db_index=True, max_length=120, unique=True)),
                ("description", models.TextField(blank=True)),
                ("manager_name", models.CharField(blank=True, max_length=200)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "Department",
                "ordering": ["name", "id"],
            },
        ),
        migrations.RunPython(
            seed_departments_from_employees,
            migrations.RunPython.noop,
        ),
    ]
