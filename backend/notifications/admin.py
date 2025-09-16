from django.contrib import admin

# Register your models here.
# notifications/admin.py
from django.contrib import admin
from .models import Notification
admin.site.register(Notification)