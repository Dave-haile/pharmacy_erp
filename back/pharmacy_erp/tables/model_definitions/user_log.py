from django.db import models
from django.conf import settings
class UserLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField()
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.timestamp}"

    class Meta:
        db_table = 'UserLog'
        verbose_name_plural = 'User Logs'