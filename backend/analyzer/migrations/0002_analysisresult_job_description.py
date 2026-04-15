from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analyzer', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='analysisresult',
            name='job_description',
            field=models.TextField(blank=True, default=''),
        ),
    ]
