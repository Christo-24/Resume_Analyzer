from django.db import models
from django.contrib.postgres.fields import JSONField
from django.contrib.auth.models import User 
# Create your models here.
class AnalysisResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    job_description = models.TextField(blank=True, default='')
    result = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AnalysisResult for {self.user.username} at {self.created_at}"
