# backend/dashboard/models.py
from django.db import models

from django.db import models
from django.utils import timezone
from users.models import User

class DashboardConfig(models.Model):
    """Stores user's dashboard layout and preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dashboard_config')
    layout_config = models.JSONField(default=dict)  # {widget_id: {x: 0, y: 0, w: 4, h: 3}}
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'dashboard_configs'

    def __str__(self):
        return f"Dashboard Config - {self.user.username}"
