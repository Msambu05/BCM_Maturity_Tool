import os
import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from django.utils import timezone
from users.models import User
from assessments.models import Question, AssessmentResponse

class Evidence(models.Model):
    EVIDENCE_TYPES = [
        ('policy', 'Policy Document'),
        ('procedure', 'Procedure Document'),
        ('plan', 'BCP Plan'),
        ('test_result', 'Test Result'),
        ('training', 'Training Material'),
        ('report', 'Report'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    # Unique Identifier
    evidence_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    # Core Relationships
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='evidence')
    response = models.ForeignKey(AssessmentResponse, on_delete=models.CASCADE, 
                               related_name='evidence', null=True, blank=True)
    assessment = models.ForeignKey('assessments.Assessment', on_delete=models.CASCADE, 
                                 related_name='evidence', null=True, blank=True)
    
    # File Information
    file_name = models.CharField(max_length=255)
    file_path = models.FileField(
        upload_to='evidence/%Y/%m/',
        validators=[FileExtensionValidator(
            allowed_extensions=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']
        )]
    )
    file_size = models.PositiveIntegerField(blank=True, null=True)
    file_type = models.CharField(max_length=50, blank=True, null=True)
    evidence_type = models.CharField(max_length=20, choices=EVIDENCE_TYPES, default='other')
    
    # Version Control
    version = models.PositiveIntegerField(default=1)
    previous_version = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, 
                                       related_name='next_versions')
    is_latest = models.BooleanField(default=True)
    
    # Content Information
    title = models.CharField(max_length=255, default="Untitled")
    description = models.TextField(blank=True, null=True)
    keywords = models.CharField(max_length=500, blank=True, null=True)
    
    # Status and Workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    review_notes = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='reviewed_evidence')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Ownership and Dates
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_evidence')
    uploaded_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    valid_until = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Audit Information
    checksum = models.CharField(max_length=64, blank=True, null=True)
    download_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'evidence'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['evidence_id']),
            models.Index(fields=['assessment', 'question']),
            models.Index(fields=['status', 'is_active']),
        ]
        unique_together = ['question', 'file_name', 'version']

    def __str__(self):
        return f"{self.title} (v{self.version}) - {self.get_evidence_type_display()}"
    
    def save(self, *args, **kwargs):
        # Set file metadata
        if self.file_path:
            if not self.file_size:
                self.file_size = self.file_path.size
            if not self.file_type:
                self.file_type = os.path.splitext(self.file_path.name)[1].lower().replace('.', '')
        
        # Set assessment from question if not provided
        # Auto-set assessment from question if not provided
        if not self.assessment_id and self.question_id:
            if hasattr(self.question, "focus_area"):
                self.assessment = (
                    self.question.focus_area.assessment_set.first()
                )
            
        super().save(*args, **kwargs)
    
    def increment_download_count(self):
        self.download_count += 1
        self.save(update_fields=['download_count'])
