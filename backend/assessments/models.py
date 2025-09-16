from django.db import models
import uuid
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User, Organization, Department

def generate_reference_number():
    """Generate unique reference number for assessments"""
    year = timezone.now().year
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"ASS-{year}-{unique_id}"

def generate_focus_area_code():
    """Generate focus area code based on order"""
    import random
    return f"FA{random.randint(1, 99):02d}"

class Component(models.Model):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=10, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    order_index = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_components')

    # New field to allow admin to hide/show component
    is_visible = models.BooleanField(default=True)

    class Meta:
        db_table = 'components'
        ordering = ['order_index', 'name']

    def save(self, *args, **kwargs):
        if not self.code:
            counter = 1
            while True:
                proposed_code = f"C{counter:02d}"
                if not Component.objects.filter(code=proposed_code).exclude(pk=self.pk).exists():
                    self.code = proposed_code
                    break
                counter += 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.name}"

class FocusArea(models.Model):
    COMPONENT_CHOICES = [
        ('establishing_bcms', 'Establishing a BCMS'),
        ('embracing_bc', 'Embracing Business Continuity'),
        ('analysis', 'Analysis'),
        ('solution_design', 'Solution Design'),
        ('enabling_solutions', 'Enabling Solutions'),
        ('validation', 'Validation'),
    ]

    component = models.ForeignKey(Component, on_delete=models.CASCADE, related_name='focus_areas', null=True, blank=True)
    name = models.CharField(max_length=100, choices=COMPONENT_CHOICES, unique=True)
    display_name = models.CharField(max_length=255)
    code = models.CharField(
        max_length=10,
        unique=True,
        blank=True  # Allow blank during migration
    )
    description = models.TextField()
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    order_index = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_focus_areas')

    class Meta:
        db_table = 'focus_areas'
        ordering = ['order_index', 'name']

    def save(self, *args, **kwargs):
        # Generate code if not provided
        if not self.code:
            # Try to use predefined codes based on name
            code_mapping = {
                'establishing_bcms': 'FA01',
                'embracing_bc': 'FA02',
                'analysis': 'FA03',
                'solution_design': 'FA04',
                'enabling_solutions': 'FA05',
                'validation': 'FA06'
            }

            if self.name in code_mapping:
                proposed_code = code_mapping[self.name]
                # Check if code is already taken
                if not FocusArea.objects.filter(code=proposed_code).exclude(pk=self.pk).exists():
                    self.code = proposed_code
                else:
                    # Generate alternative code
                    counter = 1
                    while True:
                        alternative_code = f"FA{counter:02d}"
                        if not FocusArea.objects.filter(code=alternative_code).exclude(pk=self.pk).exists():
                            self.code = alternative_code
                            break
                        counter += 1
            else:
                # Generate generic code
                counter = 1
                while True:
                    generic_code = f"FA{counter:02d}"
                    if not FocusArea.objects.filter(code=generic_code).exclude(pk=self.pk).exists():
                        self.code = generic_code
                        break
                    counter += 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.display_name}"

class Question(models.Model):
    focus_area = models.ForeignKey(FocusArea, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    description = models.TextField(blank=True, null=True)
    code = models.CharField(
        max_length=10,
        blank=True  # Allow blank during migration
    )
    guidance_notes = models.TextField(blank=True, null=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    order_index = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_questions')
    
    class Meta:
        db_table = 'questions'
        ordering = ['focus_area__component__order_index', 'focus_area__order_index', 'order_index']
        unique_together = ['focus_area', 'code']
    
    def save(self, *args, **kwargs):
        # Generate code if not provided
        if not self.code and self.focus_area:
            # Get the focus area code (e.g., FA01)
            fa_code = self.focus_area.code if self.focus_area.code else 'FA01'
            
            # Find the next available question number for this focus area
            existing_codes = Question.objects.filter(
                focus_area=self.focus_area
            ).exclude(pk=self.pk).values_list('code', flat=True)
            
            counter = 1
            while True:
                proposed_code = f"{fa_code}.{counter:02d}"
                if proposed_code not in existing_codes:
                    self.code = proposed_code
                    break
                counter += 1
                
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.code} - {self.text[:50]}..."

class Assessment(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),  # Added more detailed status
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),  # Added approved status
        ('completed', 'Completed'),
        ('archived', 'Archived'),  # Added archived status
    ]
    
    # Basic Information
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    reference_number = models.CharField(
        max_length=50, 
        unique=True, 
        blank=True  # Remove default, handle in save() method
    )
    
    # Organization Context
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='assessments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='assessments')
    
    # Timing Information
    assessment_period = models.CharField(
        max_length=100, 
        default="Q1 2025"  # Added default value
    )  # e.g., "Q1 2024", "FY2024"
    start_date = models.DateField(null=True, blank=True)  # Added start date
    due_date = models.DateField(null=True, blank=True)  # Changed to DateField
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)  # Added approval timestamp
    completed_at = models.DateTimeField(null=True, blank=True)  # Added completion timestamp
    
    # Status and Ownership
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_assessments')
    assigned_to = models.ManyToManyField(User, related_name='assigned_assessments', blank=True)
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                               related_name='reviewed_assessments')  # Added specific reviewer
    approver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='approved_assessments')  # Added specific approver
    
    # Metadata
    version = models.PositiveIntegerField(default=1)  # Added versioning
    is_template = models.BooleanField(default=False)  # Added template flag
    notes = models.TextField(blank=True, null=True)  # Added general notes
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assessments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'due_date']),
            models.Index(fields=['organization', 'department']),
        ]
    
    def save(self, *args, **kwargs):
        # Generate reference number if not provided
        if not self.reference_number:
            # Ensure uniqueness by checking existing records
            while True:
                ref_num = generate_reference_number()
                if not Assessment.objects.filter(reference_number=ref_num).exists():
                    self.reference_number = ref_num
                    break
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.reference_number} - {self.name} - {self.department.name}"
    
    @property
    def is_overdue(self):
        if self.due_date and timezone.now().date() > self.due_date and self.status not in ['completed', 'submitted', 'approved']:
            return True
        return False

class AssessmentResponse(models.Model):
    MATURITY_CHOICES = [
        (0, '0 - Not Started (0%)'),
        (1, '1 - Initial (1-39%)'),
        (2, '2 - Developing/Repeatable (40-59%)'),
        (3, '3 - Defined (60-79%)'),
        (4, '4 - Managed (80-99%)'),
        (5, '5 - Optimized (100%)'),
    ]
    
    # Core Relationships
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='responses')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='responses')
    
    # Response Data
    maturity_score = models.PositiveIntegerField(
        choices=MATURITY_CHOICES, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)]  # Added validation
    )
    comments = models.TextField(blank=True, null=True)
    rationale = models.TextField(blank=True, null=True)  # Added rationale for score
    
    # Status and Metadata
    is_submitted = models.BooleanField(default=False)  # Added submission status
    submitted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(default=timezone.now)
    last_modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='modified_responses')  # Added modifier tracking
    
    # Evidence Link
    has_evidence = models.BooleanField(default=False)  # Added evidence flag
    evidence_count = models.PositiveIntegerField(default=0)  # Added evidence count
    
    class Meta:
        db_table = 'assessment_responses'
        unique_together = ['assessment', 'question']
        indexes = [
            models.Index(fields=['assessment', 'question']),
            models.Index(fields=['maturity_score']),
        ]
    
    def __str__(self):
        return f"{self.assessment.reference_number} - {self.question.code} - Score: {self.maturity_score or 'N/A'}"
    
    @property
    def maturity_percentage(self):
        if self.maturity_score is None:
            return 0
        return (self.maturity_score / 5) * 100
    
    def save(self, *args, **kwargs):
        # Update evidence count when saving
        if self.pk:
            self.evidence_count = self.evidence.count()
            self.has_evidence = self.evidence_count > 0
        super().save(*args, **kwargs)