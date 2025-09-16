from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from .models import MaturityScore, ImprovementRecommendation, ScoreSnapshot
from assessments.models import FocusArea, AssessmentResponse, Question
from .serializers import (
    MaturityScoreSerializer, 
    ImprovementRecommendationSerializer, 
    ScoreSnapshotSerializer
)

class MaturityScoreViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MaturityScoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return MaturityScore.objects.select_related('assessment', 'focus_area').filter(is_current=True)
        else:
            return MaturityScore.objects.filter(
                assessment__organization=user.organization,
                is_current=True
            ).select_related('assessment', 'focus_area')

class ImprovementRecommendationViewSet(viewsets.ModelViewSet):
    serializer_class = ImprovementRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ImprovementRecommendation.objects.select_related(
            'assessment', 'focus_area', 'assigned_to', 'department'
        )
        
        if user.role == 'admin':
            return queryset
        elif user.role == 'bcm_coordinator':
            return queryset.filter(assessment__organization=user.organization)
        elif user.role == 'business_unit_champion':
            return queryset.filter(
                Q(assigned_to=user) | Q(department=user.department)
            )
        else:  # steering_committee
            return queryset.filter(assessment__organization=user.organization)

    def perform_create(self, serializer):
        # Generate recommendation ID
        import uuid
        serializer.save(recommendation_id=f"REC-{uuid.uuid4().hex[:8].upper()}")

class ScoreSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ScoreSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ScoreSnapshot.objects.select_related('assessment', 'created_by').all()
        else:
            return ScoreSnapshot.objects.filter(
                assessment__organization=user.organization
            ).select_related('assessment', 'created_by')

# Utility functions for scoring
from rest_framework.decorators import api_view, permission_classes

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def calculate_scores(request, assessment_id):
    """Calculate scores for an assessment - UC-SYS-01"""
    from assessments.models import Assessment
    from django.db import transaction
    
    assessment = Assessment.objects.get(id=assessment_id)
    
    with transaction.atomic():
        # Calculate focus area scores
        for focus_area in FocusArea.objects.filter(is_active=True):
            # Calculate score for this focus area
            responses = AssessmentResponse.objects.filter(
                assessment=assessment,
                question__focus_area=focus_area,
                maturity_score__isnull=False
            )
            
            if responses.exists():
                avg_score = responses.aggregate(avg=Avg('maturity_score'))['avg']
                # Create or update maturity score
                MaturityScore.objects.update_or_create(
                    assessment=assessment,
                    focus_area=focus_area,
                    is_current=True,
                    defaults={
                        'score': round(avg_score, 2),
                        'question_count': responses.count(),
                        'answered_count': responses.count(),
                        'completion_percentage': 100.0,
                        # ... other fields
                    }
                )
        
        # Calculate overall score
        overall_score = MaturityScore.objects.filter(
            assessment=assessment,
            focus_area__isnull=False,
            is_current=True
        ).aggregate(avg=Avg('score'))['avg']
        
        if overall_score:
            MaturityScore.objects.update_or_create(
                assessment=assessment,
                focus_area=None,
                is_current=True,
                defaults={
                    'score': round(overall_score, 2),
                    'question_count': Question.objects.filter(is_active=True).count(),
                    'answered_count': AssessmentResponse.objects.filter(
                        assessment=assessment, maturity_score__isnull=False
                    ).count(),
                    'completion_percentage': round(
                        (AssessmentResponse.objects.filter(assessment=assessment, maturity_score__isnull=False).count() /
                         Question.objects.filter(is_active=True).count() * 100), 2
                    )
                }
            )
    
    return Response({'status': 'scores calculated'})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_recommendations(request, assessment_id):
    """Generate improvement recommendations - UC-SYS-05"""
    from assessments.models import Assessment
    
    assessment = Assessment.objects.get(id=assessment_id)
    # Logic to generate recommendations based on low scores
    # ...
    
    return Response({'status': 'recommendations generated'})