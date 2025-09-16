from django.conf import settings
from django.db import models
from django.utils import timezone
from users.models import User
from assessments.models import Assessment

class NotificationTemplate(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ('email', 'Email'),
        ('in_app', 'In-App'),
        ('both', 'Both'),
    ]
    
    CATEGORY_CHOICES = [
        ('assessment_due', 'Assessment Due'),
        ('assessment_overdue', 'Assessment Overdue'),
        ('assessment_submitted', 'Assessment Submitted'),
        ('assessment_reviewed', 'Assessment Reviewed'),
        ('evidence_required', 'Evidence Required'),
        ('report_ready', 'Report Ready'),
        ('system_alert', 'System Alert'),
        ('user_invitation', 'User Invitation'),
        ('password_reset', 'Password Reset'),
    ]
    
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPE_CHOICES, default='both')
    subject_template = models.CharField(max_length=255)
    message_template = models.TextField()
    html_template = models.TextField(blank=True, null=True)  # For HTML emails
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_templates'
        ordering = ['category', 'name']
        unique_together = ['category', 'notification_type']
    
    def __str__(self):
        return f"{self.name} - {self.get_category_display()}"


class Notification(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('failed', 'Failed'),
        ('archived', 'Archived'),
    ]
    
    # Core Information
    notification_id = models.CharField(max_length=50, unique=True)
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE, 
                                 related_name='notifications', null=True, blank=True)
    category = models.CharField(max_length=50, choices=NotificationTemplate.CATEGORY_CHOICES)
    notification_type = models.CharField(max_length=10, choices=NotificationTemplate.NOTIFICATION_TYPE_CHOICES)
    
    # Content
    subject = models.CharField(max_length=255)
    message = models.TextField()
    html_content = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Recipient Information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    cc_recipients = models.ManyToManyField(User, related_name='cc_notifications', blank=True)
    email_address = models.EmailField()  # Snapshot of recipient's email at time of sending
    
    # Related Entities
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='notifications')
    report = models.ForeignKey('reports.GeneratedReport', on_delete=models.CASCADE, null=True, blank=True,
                               related_name='notifications')
    
    # Delivery Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True, null=True)
    retry_count = models.PositiveIntegerField(default=0)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='created_notifications')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    click_count = models.PositiveIntegerField(default=0)
    open_count = models.PositiveIntegerField(default=0)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['category', 'created_at']),
            models.Index(fields=['notification_type', 'sent_at']),
        ]
    
    def __str__(self):
        return f"{self.notification_id} - {self.subject} - {self.user.username}"


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email Preferences
    receive_email_notifications = models.BooleanField(default=True)
    email_assessment_due = models.BooleanField(default=True)
    email_assessment_overdue = models.BooleanField(default=True)
    email_report_ready = models.BooleanField(default=True)
    email_system_alerts = models.BooleanField(default=True)
    
    # In-App Preferences
    receive_in_app_notifications = models.BooleanField(default=True)
    in_app_assessment_due = models.BooleanField(default=True)
    in_app_assessment_overdue = models.BooleanField(default=True)
    in_app_report_ready = models.BooleanField(default=True)
    
    # Frequency
    digest_frequency = models.CharField(max_length=20, choices=[
        ('immediate', 'Immediate'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
    ], default='immediate')
    
    # Quiet Hours
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
    
    def __str__(self):
        return f"Notification Preferences - {self.user.username}"
