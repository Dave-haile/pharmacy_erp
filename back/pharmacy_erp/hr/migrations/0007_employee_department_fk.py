from django.db import migrations, models


def migrate_employee_departments(apps, schema_editor):
    Department = apps.get_model("hr", "Department")
    Employee = apps.get_model("hr", "Employee")

    existing = {
        department.name.strip().lower(): department.id
        for department in Department.objects.all()
        if department.name
    }

    for employee in Employee.objects.all().iterator():
        raw_name = (employee.department or "").strip()
        if not raw_name:
            continue

        lookup_key = raw_name.lower()
        department_id = existing.get(lookup_key)
        if department_id is None:
            department = Department.objects.create(name=raw_name)
            department_id = department.id
            existing[lookup_key] = department_id

        employee.department_fk_id = department_id
        employee.save(update_fields=["department_fk"])


class Migration(migrations.Migration):
    dependencies = [
        ("hr", "0006_department_employee_print_format"),
    ]

    operations = [
        migrations.AddField(
            model_name="employee",
            name="department_fk",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.PROTECT,
                related_name="employees",
                to="hr.department",
            ),
        ),
        migrations.RunPython(
            migrate_employee_departments,
            migrations.RunPython.noop,
        ),
        migrations.RemoveIndex(
            model_name="employee",
            name="Employee_departm_5acc5f_idx",
        ),
        migrations.RemoveField(
            model_name="employee",
            name="department",
        ),
        migrations.RenameField(
            model_name="employee",
            old_name="department_fk",
            new_name="department",
        ),
        migrations.AlterField(
            model_name="employee",
            name="department",
            field=models.ForeignKey(
                on_delete=models.deletion.PROTECT,
                related_name="employees",
                to="hr.department",
            ),
        ),
        migrations.AddIndex(
            model_name="employee",
            index=models.Index(
                fields=["department", "designation"],
                name="Employee_departm_5acc5f_idx",
            ),
        ),
    ]
