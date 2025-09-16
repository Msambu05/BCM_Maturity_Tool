# notifications/models.py

from django.db import models
from django.utils import timezone
from django.core.validators import FileExtensionValidator
from users.models import User, Organization, Department
from assessments.models import Assessment

class ReportTemplate(models.Model):
    REPORT_TYPE_CHOICES = [
        ('assessment_summary', 'Assessment Summary'),
        ('department_comparison', 'Department Comparison'),
        ('trend_analysis', 'Trend Analysis'),
        ('gap_analysis', 'Gap Analysis'),
        ('improvement_roadmap', 'Improvement Roadmap'),
        ('executive_summary', 'Executive Summary'),
    ]
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('word', 'Word'),
        ('html', 'HTML'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')
    template_file = models.FileField(
        upload_to='report_templates/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['html', 'docx', 'xlsx'])]
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_report_templates')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'report_templates'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"

class GeneratedReport(models.Model):
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('downloaded', 'Downloaded'),
    ]
    
    # Report Identification
    report_id = models.CharField(max_length=50, unique=True)  # e.g., "RPT-2024-001"
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Report Configuration
    report_type = models.CharField(max_length=50, choices=ReportTemplate.REPORT_TYPE_CHOICES)
    format = models.CharField(max_length=10, choices=ReportTemplate.FORMAT_CHOICES)
    parameters = models.JSONField(default=dict)  # Stores report filters and options
    
    # Content and Storage
    file_path = models.FileField(
        upload_to='generated_reports/%Y/%m/',
        blank=True,
        null=True
    )
    file_size = models.PositiveIntegerField(blank=True, null=True)
    file_url = models.URLField(blank=True, null=True)  # For external storage
    
    # Associated Data
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, null=True, blank=True, 
                                 related_name='reports')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='reports')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True,
                                 related_name='reports')
    
    # Status and Metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    generation_time = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # in seconds
    error_message = models.TextField(blank=True, null=True)
    
    # Audit Trail
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_reports')
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='generated_reports')
    generated_at = models.DateTimeField(default=timezone.now)
    downloaded_at = models.DateTimeField(null=True, blank=True)
    download_count = models.PositiveIntegerField(default=0)
    
    # Expiration and Retention
    expires_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'generated_reports'
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['report_type', 'status']),
            models.Index(fields=['requested_by', 'generated_at']),
        ]
    
    def __str__(self):
        return f"{self.report_id} - {self.title}"
    
    def increment_download_count(self):
        self.download_count += 1
        self.downloaded_at = timezone.now()
        self.save(update_fields=['download_count', 'downloaded_at'])

class ReportSchedule(models.Model):
    FREQUENCY_CHOICES = [
        ('once', 'Once'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    report_type = models.CharField(max_length=50, choices=ReportTemplate.REPORT_TYPE_CHOICES)
    format = models.CharField(max_length=10, choices=ReportTemplate.FORMAT_CHOICES, default='pdf')
    parameters = models.JSONField(default=dict)
    
    # Scheduling
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='once')
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    last_run = models.DateTimeField(null=True, blank=True)
    
    # Recipients
    recipients = models.ManyToManyField(User, related_name='scheduled_reports', blank=True)
    email_recipients = models.TextField(blank=True, null=True)  # comma-separated emails
    
    # Status
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_report_schedules')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'report_schedules'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.get_frequency_display()}"