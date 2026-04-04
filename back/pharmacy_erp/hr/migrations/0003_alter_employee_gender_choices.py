from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hr", "0002_alter_employee_gender"),
    ]

    operations = [
        migrations.AlterField(
            model_name="employee",
            name="gender",
            field=models.CharField(
                choices=[
                    ("male", "Male"),
                    ("female", "Female"),
                ],
                default="male",
                max_length=20,
            ),
        ),
    ]
