from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0022_printformat"),
    ]

    operations = [
        migrations.AddField(
            model_name="printformat",
            name="html_template",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="printformat",
            name="css_template",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="printformat",
            name="js_template",
            field=models.TextField(blank=True),
        ),
    ]
