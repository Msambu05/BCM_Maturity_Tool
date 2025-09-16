from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
from assessments.models import Assessment, FocusArea

class MaturityScore(models.Model):
    LEVEL_CHOICES = [
        (0, 'Not Started (0%)'),
        (1, 'Initial (1-39%)'),
        (2, 'Developing/Repeatable (40-59%)'),
        (3, 'Defined (60-79%)'),
        (4, 'Managed (80-99%)'),
        (5, 'Optimized (100%)'),
    ]
    
    # Core Relationships
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='maturity_scores')
    focus_area = models.ForeignKey(FocusArea, on_delete=models.CASCADE, related_name='maturity_scores', 
                                 null=True, blank=True)
    
    # Score Data
    score = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    level = models.PositiveIntegerField(choices=LEVEL_CHOICES)  # Derived from score
    max_possible_score = models.DecimalField(max_digits=5, decimal_places=2, default=5.0)
    weighted_score = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Statistics
    question_count = models.PositiveIntegerField()
    answered_count = models.PositiveIntegerField()
    completion_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    average_response_time = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # in hours
    
    # Benchmarking
    benchmark_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    benchmark_percentile = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    gap = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # score - benchmark
    
    # Metadata
    calculated_at = models.DateTimeField(default=timezone.now)
    is_current = models.BooleanField(default=True)
    version = models.PositiveIntegerField(default=1)
    
    class Meta:
        db_table = 'maturity_scores'
        ordering = ['assessment', 'focus_area__order_index']
        unique_together = ['assessment', 'focus_area', 'version']
        indexes = [
            models.Index(fields=['assessment', 'is_current']),
            models.Index(fields=['focus_area', 'score']),
        ]
    
    def __str__(self):
        if self.focus_area:
            return f"{self.assessment.name} - {self.focus_area.display_name} - Score: {self.score}"
        return f"{self.assessment.name} - Overall Score: {self.score}"
    
    def save(self, *args, **kwargs):
        # Automatically determine maturity level based on score
        if self.score is not None:
            if self.score == 0:
                self.level = 0
            elif self.score <= 1.95:
                self.level = 1
            elif self.score <= 2.95:
                self.level = 2
            elif self.score <= 3.95:
                self.level = 3
            elif self.score <= 4.95:
                self.level = 4
            else:
                self.level = 5
        super().save(*args, **kwargs)

class ImprovementRecommendation(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('proposed', 'Proposed'),
        ('approved', 'Approved'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('deferred', 'Deferred'),
        ('rejected', 'Rejected'),
    ]
    
    # Core Information
    recommendation_id = models.CharField(max_length=50, unique=True)
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='improvement_recommendations')
    focus_area = models.ForeignKey(FocusArea, on_delete=models.CASCADE, related_name='improvement_recommendations')
    
    # Recommendation Details
    title = models.CharField(max_length=255)
    description = models.TextField()
    current_score = models.DecimalField(max_digits=5, decimal_places=2)
    target_score = models.DecimalField(max_digits=5, decimal_places=2)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='proposed')
    
    # Action Plan
    suggested_actions = models.TextField()
    estimated_effort = models.PositiveIntegerField(help_text="Estimated effort in person-hours", null=True, blank=True)
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    timeline_weeks = models.PositiveIntegerField(null=True, blank=True)
    
    # Ownership
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='assigned_recommendations')
    department = models.ForeignKey('users.Department', on_delete=models.CASCADE, null=True, blank=True,
                                 related_name='improvement_recommendations')
    
    # Dates
    target_completion_date = models.DateField(null=True, blank=True)
    actual_start_date = models.DateField(null=True, blank=True)
    actual_completion_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Progress Tracking
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    milestones = models.JSONField(default=list)  # List of milestone objects
    
    # Impact Assessment
    expected_impact = models.TextField(blank=True, null=True)
    risk_level = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ], blank=True, null=True)
    
    class Meta:
        db_table = 'improvement_recommendations'
        ordering = ['priority', 'target_completion_date']
        indexes = [
            models.Index(fields=['assessment', 'status']),
            models.Index(fields=['focus_area', 'priority']),
        ]
    
    def __str__(self):
        return f"{self.recommendation_id} - {self.title} - {self.get_priority_display()}"

class ScoreSnapshot(models.Model):
    SNAPSHOT_TYPE_CHOICES = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
        ('periodic', 'Periodic'),
    ]
    
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='score_snapshots')
    snapshot_type = models.CharField(max_length=20, choices=SNAPSHOT_TYPE_CHOICES, default='automatic')
    taken_at = models.DateTimeField(default=timezone.now)
    
    # Score Data
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_level = models.PositiveIntegerField(choices=MaturityScore.LEVEL_CHOICES, null=True, blank=True)
    completion_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Breakdown
    focus_area_scores = models.JSONField(default=dict)  # {focus_area_id: score, ...}
    question_stats = models.JSONField(default=dict)     # Statistics about question responses
    
    # Metadata
    note = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='created_score_snapshots')
    version = models.PositiveIntegerField(default=1)
    
    class Meta:
        db_table = 'score_snapshots'
        ordering = ['-taken_at']
        indexes = [
            models.Index(fields=['assessment', 'taken_at']),
        ]
    
    def __str__(self):
        return f"Snapshot - {self.assessment.name} - {self.taken_at.date()}"