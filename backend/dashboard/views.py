# backend/dashboard/views.py
from django.shortcuts import render

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.utils import timezone
from .models import DashboardConfig
from .serializers import DashboardConfigSerializer
from assessments.models import Assessment, AssessmentResponse
from scoring.models import MaturityScore
from users.models import Department

class DashboardConfigViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DashboardConfig.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this dashboard as default"""
        dashboard = self.get_object()
        
        # Remove default from other dashboards
        DashboardConfig.objects.filter(user=request.user, is_default=True).update(is_default=False)
        
        # Set this as default
        dashboard.is_default = True
        dashboard.save()
        
        return Response({'status': 'set as default'})

# Dashboard data endpoints
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def overview_stats(request):
    """Get overview statistics for dashboard"""
    user = request.user
    
    # Base querysets based on user role
    if user.role == 'admin':
        assessments = Assessment.objects.all()
    elif user.role == 'bcm_coordinator':
        assessments = Assessment.objects.filter(organization=user.organization)
    elif user.role == 'business_unit_champion':
        assessments = Assessment.objects.filter(assigned_to=user)
    else:  # steering_committee
        assessments = Assessment.objects.filter(organization=user.organization)
    
    total_assessments = assessments.count()
    completed_assessments = assessments.filter(status='completed').count()
    overdue_assessments = assessments.filter(
        status__in=['draft', 'in_progress'], 
        due_date__lt=timezone.now()
    ).count()
    
    # Get average scores
    avg_score = MaturityScore.objects.filter(
        assessment__in=assessments, 
        is_current=True,
        focus_area__isnull=True
    ).aggregate(avg_score=Avg('score'))['avg_score'] or 0
    
    return Response({
        'total_assessments': total_assessments,
        'completed_assessments': completed_assessments,
        'overdue_assessments': overdue_assessments,
        'completion_rate': round((completed_assessments / total_assessments * 100), 2) if total_assessments else 0,
        'average_score': round(avg_score, 2),
        'user_role': user.role
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def department_comparison(request):
    """Get scores by department for comparison"""
    user = request.user
    
    if user.role not in ['admin', 'bcm_coordinator', 'steering_committee']:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    departments = Department.objects.filter(organization=user.organization)
    
    department_data = []
    for dept in departments:
        latest_assessment = Assessment.objects.filter(
            department=dept, 
            status='completed'
        ).order_by('-created_at').first()
        
        if latest_assessment:
            overall_score = MaturityScore.objects.filter(
                assessment=latest_assessment,
                focus_area__isnull=True,
                is_current=True
            ).first()
            score = overall_score.score if overall_score else None
        else:
            score = None
        
        department_data.append({
            'department_id': dept.id,
            'department_name': dept.name,
            'score': score,
            'latest_assessment': latest_assessment.name if latest_assessment else None,
            'assessment_date': latest_assessment.completed_at if latest_assessment else None
        })
    
    return Response(department_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def focus_area_scores(request, assessment_id):
    """Get scores by focus area for a specific assessment"""
    assessment = Assessment.objects.get(id=assessment_id)
    
    # Check permissions
    user = request.user
    if user.role not in ['admin'] and assessment.organization != user.organization:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    focus_area_scores = MaturityScore.objects.filter(
        assessment=assessment,
        focus_area__isnull=False,
        is_current=True
    ).select_related('focus_area')
    
    data = []
    for score in focus_area_scores:
        data.append({
            'focus_area_id': score.focus_area.id,
            'focus_area_name': score.focus_area.display_name,
            'score': score.score,
            'level': score.level,
            'question_count': score.question_count,
            'answered_count': score.answered_count,
            'completion_percentage': score.completion_percentage
        })
    
    return Response(data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recent_activity(request):
    """Get recent activity for dashboard"""
    user = request.user
    
    # Get recently completed assessments
    recent_assessments = Assessment.objects.filter(
        organization=user.organization,
        status='completed'
    ).order_by('-completed_at')[:5]
    
    # Get recently uploaded evidence
    from evidence.models import Evidence
    recent_evidence = Evidence.objects.filter(
        assessment__organization=user.organization
    ).select_related('assessment', 'uploaded_by').order_by('-uploaded_at')[:5]
    
    return Response({
        'recent_assessments': [
            {
                'id': a.id,
                'name': a.name,
                'department': a.department.name,
                'completed_at': a.completed_at,
                'score': MaturityScore.objects.filter(
                    assessment=a, 
                    focus_area__isnull=True,
                    is_current=True
                ).first().score if MaturityScore.objects.filter(assessment=a, focus_area__isnull=True).exists() else None
            }
            for a in recent_assessments
        ],
        'recent_evidence': [
            {
                'id': e.id,
                'file_name': e.file_name,
                'assessment': e.assessment.name,
                'uploaded_by': e.uploaded_by.get_full_name(),
                'uploaded_at': e.uploaded_at
            }
            for e in recent_evidence
        ]
    })