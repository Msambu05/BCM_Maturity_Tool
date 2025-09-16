from rest_framework import viewsets, permissions, status
from notifications.utils import send_assessment_notification
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Component, FocusArea, Question, Assessment, AssessmentResponse
from .serializers import (
    ComponentSerializer, FocusAreaSerializer, QuestionSerializer,
    AssessmentSerializer, AssessmentResponseSerializer
)

class ComponentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ComponentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Component.objects.order_by('order_index')
        # Only show visible components to non-admin users
        if not self.request.user.role == 'admin':
            queryset = queryset.filter(is_visible=True)
        return queryset

class FocusAreaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FocusAreaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = FocusArea.objects.select_related('component').order_by('order_index')
        # Only show active focus areas to non-admin users
        if not self.request.user.role == 'admin':
            queryset = queryset.filter(is_active=True, component__is_visible=True)
        component_id = self.request.query_params.get('component_id')
        if component_id:
            queryset = queryset.filter(component_id=component_id)
        return queryset

class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Question.objects.select_related('focus_area__component').filter(is_active=True)
        # Only show questions from visible components to non-admin users
        if not self.request.user.role == 'admin':
            queryset = queryset.filter(focus_area__component__is_visible=True)
        focus_area_id = self.request.query_params.get('focus_area_id')
        if focus_area_id:
            queryset = queryset.filter(focus_area_id=focus_area_id)
        return queryset

class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Assessment.objects.select_related(
                'organization', 'department', 'created_by'
            ).prefetch_related('assigned_to').all()
        elif user.role == 'bcm_coordinator':
            return Assessment.objects.filter(
                organization=user.organization
            ).select_related('organization', 'department', 'created_by').prefetch_related('assigned_to')
        elif user.role == 'business_unit_champion':
            return Assessment.objects.filter(
                assigned_to=user
            ).select_related('organization', 'department', 'created_by').prefetch_related('assigned_to')
        else:  # steering_committee
            return Assessment.objects.filter(
                organization=user.organization
            ).select_related('organization', 'department', 'created_by').prefetch_related('assigned_to')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit an assessment for review - UC-COOR-03"""
        assessment = self.get_object()
        if assessment.status not in ['draft', 'in_progress']:
            return Response({'error': 'Assessment cannot be submitted'}, status=status.HTTP_400_BAD_REQUEST)

        assessment.status = 'submitted'
        assessment.submitted_at = timezone.now()
        assessment.save()

        # Mark all related responses as submitted
        AssessmentResponse.objects.filter(assessment=assessment).update(
            is_submitted=True,
            submitted_at=timezone.now()
        )

        # Send notification to reviewer
        send_assessment_notification(
            assessment=assessment,
            action='submitted',
            recipient=assessment.reviewer,
            context={
                'submitted_by': request.user.get_full_name(),
                'submission_time': timezone.now()
            }
        )

        return Response({'status': 'submitted'})

    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        """Get all responses for an assessment"""
        assessment = self.get_object()
        responses = AssessmentResponse.objects.filter(
            assessment=assessment
        ).select_related('question', 'user', 'question__focus_area')

        serializer = AssessmentResponseSerializer(responses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get assessment completion progress"""
        assessment = self.get_object()

        # Filter questions based on user role
        if request.user.role == 'admin':
            total_questions = Question.objects.filter(is_active=True).count()
        else:
            total_questions = Question.objects.filter(
                is_active=True,
                focus_area__component__is_visible=True
            ).count()

        answered_questions = AssessmentResponse.objects.filter(
            assessment=assessment, maturity_score__isnull=False
        ).count()

        return Response({
            'total_questions': total_questions,
            'answered_questions': answered_questions,
            'completion_percentage': round((answered_questions / total_questions * 100), 2) if total_questions else 0
        })

    @action(detail=True, methods=['post'])
    def assign_reviewer(self, request, pk=None):
        """Assign a reviewer to the assessment"""
        assessment = self.get_object()
        reviewer_id = request.data.get('reviewer_id')

        if not reviewer_id:
            return Response({'error': 'reviewer_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from users.models import User
            reviewer = User.objects.get(id=reviewer_id)
            assessment.reviewer = reviewer
            assessment.save()

            # Send notification to the new reviewer
            send_assessment_notification(
                assessment=assessment,
                action='assigned',
                recipient=reviewer,
                context={'assigned_by': request.user.get_full_name()}
            )

            return Response({'status': 'reviewer assigned', 'reviewer': reviewer.get_full_name()})

        except User.DoesNotExist:
            return Response({'error': 'Reviewer not found'}, status=status.HTTP_404_NOT_FOUND)

class AssessmentResponseViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return AssessmentResponse.objects.select_related(
                'assessment', 'question', 'user'
            ).all()
        else:
            return AssessmentResponse.objects.filter(
                Q(assessment__assigned_to=user) | Q(user=user)
            ).select_related('assessment', 'question', 'user')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Mark response as submitted"""
        response = self.get_object()
        response.is_submitted = True
        response.submitted_at = timezone.now()
        response.save()

        # Update assessment progress
        assessment = response.assessment
        if assessment.status == 'draft':
            assessment.status = 'in_progress'
            assessment.save()

        return Response({'status': 'submitted'})

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        """Bulk create/update responses for an assessment"""
        responses_data = request.data.get('responses', [])

        if not responses_data:
            return Response({'error': 'No responses provided'}, status=status.HTTP_400_BAD_REQUEST)

        created_responses = []
        updated_responses = []

        for response_data in responses_data:
            assessment_id = response_data.get('assessment')
            question_id = response_data.get('question')
            maturity_score = response_data.get('maturity_score')
            comments = response_data.get('comments', '')

            # Validate required fields
            if assessment_id is None or question_id is None or maturity_score is None:
                return Response({
                    'error': 'Missing required fields: assessment, question, maturity_score'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get or create response
            response, created = AssessmentResponse.objects.get_or_create(
                assessment_id=assessment_id,
                question_id=question_id,
                user=request.user,
                defaults={
                    'maturity_score': maturity_score,
                    'comments': comments
                }
            )

            if not created:
                # Update existing response
                response.maturity_score = maturity_score
                response.comments = comments
                response.save()
                updated_responses.append(response)
            else:
                created_responses.append(response)

        # Update assessment status if it was draft
        if responses_data:
            assessment_id = responses_data[0]['assessment']
            assessment = Assessment.objects.get(id=assessment_id)
            if assessment.status == 'draft':
                assessment.status = 'in_progress'
                assessment.save()

        return Response({
            'message': f'Created {len(created_responses)} and updated {len(updated_responses)} responses',
            'created': len(created_responses),
            'updated': len(updated_responses)
        }, status=status.HTTP_201_CREATED)
