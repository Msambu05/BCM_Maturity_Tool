from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ValidationError
import os
import logging
from wsgiref.util import FileWrapper
from assessments.models import Question, Assessment, AssessmentResponse
from .models import Evidence
from .serializers import EvidenceSerializer, EvidenceUploadSerializer

logger = logging.getLogger(__name__)

class EvidenceViewSet(viewsets.ModelViewSet):
    queryset = Evidence.objects.select_related(
        'question', 'assessment', 'uploaded_by', 'reviewed_by'
    ).all()
    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Filter based on user role and permissions
        if user.role == 'admin':
            return queryset
        elif user.role == 'bcm_coordinator':
            # Fix: ensure bcm_coordinator can access evidence for their organization
            return queryset.filter(assessment__organization=user.organization)
        elif user.role == 'business_unit_champion':
            return queryset.filter(
                Q(assessment__assigned_to=user) | Q(uploaded_by=user)
            )
        else:  # steering_committee
            return queryset.filter(assessment__organization=user.organization)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Upload evidence for a question - UC-BUC-03"""
        try:
            # Validate required fields
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if 'question_id' not in request.data:
                return Response(
                    {'error': 'question_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if 'assessment_id' not in request.data:
                return Response(
                    {'error': 'assessment_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get objects
            question = get_object_or_404(Question, id=request.data['question_id'])
            assessment = get_object_or_404(Assessment, id=request.data['assessment_id'])

            # Permission check
            if not self._can_upload_evidence(request.user, assessment):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Create evidence using serializer for validation
            serializer = EvidenceUploadSerializer(data=request.data, context={'request': request})

            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Get or create the assessment response
            response_obj, created = AssessmentResponse.objects.get_or_create(
                question=question,
                user=request.user,
                assessment=assessment,
                defaults={'has_evidence': True, 'evidence_count': 1}
            )

            # Create evidence record
            try:
                evidence = Evidence.objects.create(
                    question=question,
                    response=response_obj,
                    assessment=assessment,
                    title=serializer.validated_data.get('title', request.FILES['file'].name) or request.FILES['file'].name,
                    description=serializer.validated_data.get('description', ''),
                    evidence_type=serializer.validated_data.get('evidence_type', 'other'),
                    file_path=request.FILES['file'],
                    file_name=request.FILES['file'].name,
                    uploaded_by=request.user
                )
            except Exception as e:
                logger.error(f"Error creating evidence record: {e}")
                return Response(
                    {'error': f'Failed to create evidence record: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Update response evidence count
            if not created:
                response_obj.has_evidence = True
                response_obj.evidence_count = Evidence.objects.filter(
                    question=question,
                    assessment=assessment,
                    uploaded_by=request.user,
                    is_active=True
                ).count()
                response_obj.save()

            return Response(
                EvidenceSerializer(evidence, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

        except ValidationError as e:
            logger.error(f"Validation error in evidence upload: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in evidence upload: {e}")
            return Response(
                {'error': 'Internal server error occurred during upload'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _can_upload_evidence(self, user, assessment):
        """Check if user can upload evidence for this assessment"""
        if user.role == 'admin':
            return True
        elif user.role == 'bcm_coordinator':
            return assessment.organization == user.organization
        elif user.role == 'business_unit_champion':
            return assessment.assigned_to.filter(id=user.id).exists()
        return False

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Review evidence - UC-COOR-04"""
        evidence = self.get_object()
        status_value = request.data.get('status')
        notes = request.data.get('review_notes', '')

        if status_value not in dict(Evidence.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        evidence.status = status_value
        evidence.review_notes = notes
        evidence.reviewed_by = request.user
        evidence.reviewed_at = timezone.now()
        evidence.save()

        return Response(EvidenceSerializer(evidence).data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download evidence file with proper security"""
        evidence = self.get_object()

        # Check permissions
        user = request.user
        if user.role not in ['admin', 'bcm_coordinator']:
            if user != evidence.uploaded_by and user not in evidence.assessment.assigned_to.all():
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        if not evidence.file_path:
            return Response({'error': 'File not available'}, status=status.HTTP_404_NOT_FOUND)

        # Get the file path
        file_path = evidence.file_path.path

        # Check if file exists
        if not os.path.exists(file_path):
            return Response({'error': 'File not found on server'}, status=status.HTTP_404_NOT_FOUND)

        # Increment download count
        evidence.increment_download_count()

        # Serve the file
        try:
            response = FileResponse(
                FileWrapper(open(file_path, 'rb')),
                content_type='application/octet-stream'
            )
            response['Content-Disposition'] = f'attachment; filename="{evidence.file_name}"'
            response['Content-Length'] = os.path.getsize(file_path)

            # Add security headers
            response['X-Content-Type-Options'] = 'nosniff'
            response['Content-Security-Policy'] = "default-src 'none'"

            return response

        except Exception as e:
            logger.error(f"Error serving file {file_path}: {e}")
            return Response({'error': 'Error serving file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['delete'])
    def delete_evidence(self, request, pk=None):
        """Soft delete evidence"""
        evidence = self.get_object()

        # Permission check
        if request.user != evidence.uploaded_by and request.user.role not in ['admin', 'bcm_coordinator']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Soft delete
        evidence.is_active = False
        evidence.save()

        # Update response evidence count
        response = AssessmentResponse.objects.filter(
            question=evidence.question,
            user=evidence.uploaded_by,
            assessment=evidence.assessment
        ).first()

        if response:
            response.evidence_count = Evidence.objects.filter(
                question=evidence.question,
                assessment=evidence.assessment,
                uploaded_by=evidence.uploaded_by,
                is_active=True
            ).count()
            response.has_evidence = response.evidence_count > 0
            response.save()

        return Response({'message': 'Evidence deleted successfully'}, status=status.HTTP_200_OK)
