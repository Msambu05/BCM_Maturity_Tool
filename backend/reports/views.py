from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.conf import settings
import os
from wsgiref.util import FileWrapper
import csv
import logging

from .models import Assessment

from .utils import ReportGenerator
from .models import GeneratedReport, ReportSchedule
from .serializers import GeneratedReportSerializer, ReportScheduleSerializer

logger = logging.getLogger(__name__)

class GeneratedReportViewSet(viewsets.ModelViewSet):
    serializer_class = GeneratedReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return GeneratedReport.objects.select_related(
                'assessment', 'organization', 'department', 'requested_by', 'generated_by'
            ).all()
        else:
            return GeneratedReport.objects.filter(
                requested_by=user
            ).select_related('assessment', 'organization', 'department', 'requested_by', 'generated_by')

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


@action(detail=True, methods=['get'])
def download(self, request, pk=None):
    """Download report file with security checks"""
    report = self.get_object()
    
    # Check permissions
    if report.requested_by != request.user and request.user.role not in ['admin', 'bcm_coordinator']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if not report.file_path:
        return Response({'error': 'Report file not available'}, status=status.HTTP_404_NOT_FOUND)
    
    file_path = report.file_path.path
    
    if not os.path.exists(file_path):
        return Response({'error': 'Report file not found'}, status=status.HTTP_404_NOT_FOUND)
    
    report.increment_download_count()
    
    try:
        # Determine content type based on file extension
        ext = os.path.splitext(file_path)[1].lower()
        content_types = {
            '.pdf': 'application/pdf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.csv': 'text/csv',
        }
        
        content_type = content_types.get(ext, 'application/octet-stream')
        
        response = FileResponse(
            FileWrapper(open(file_path, 'rb')),
            content_type=content_type
        )
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        response['Content-Length'] = os.path.getsize(file_path)
        
        return response
        
    except Exception as e:
        logger.error(f"Error serving report file {file_path}: {e}")
        return Response({'error': 'Error downloading report'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ReportScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ReportSchedule.objects.select_related('created_by').prefetch_related('recipients').all()
        else:
            return ReportSchedule.objects.filter(created_by=user).select_related('created_by').prefetch_related('recipients')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# Additional report generation views
from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def assessment_summary_report(request, assessment_id):
    """Generate assessment summary report using xhtml2pdf or Excel"""
    try:
        # Fetch assessment and check permissions
        assessment = get_object_or_404(Assessment, id=assessment_id)
        user = request.user

        if user.role not in ['admin', 'bcm_coordinator'] and assessment.organization != user.organization:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Generate report data
        report_data = ReportGenerator.generate_assessment_summary(assessment_id)

        report_format = request.GET.get('format', 'json').lower()

        if report_format == 'json':
            return Response(report_data)

        elif report_format == 'pdf':
            pdf_content = ReportGenerator.generate_pdf_report(
                report_data, f"Assessment Summary - {assessment.name}"
            )

            if not pdf_content:
                return Response({'error': 'Failed to generate PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="assessment_summary_{assessment_id}.pdf"'
            return response

        elif report_format == 'excel':
            excel_content = ReportGenerator.generate_excel_report(
                report_data, f"Assessment Summary - {assessment.name}"
            )
            response = HttpResponse(
                excel_content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="assessment_summary_{assessment_id}.xlsx"'
            return response

        else:
            return Response({'error': 'Unsupported format'}, status=status.HTTP_400_BAD_REQUEST)

    except Assessment.DoesNotExist:
        return Response({'error': 'Assessment not found'}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.error(f"Error generating report for assessment {assessment_id}: {e}", exc_info=True)
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_assessment_csv(request, assessment_id):
    """Export assessment data to CSV - UC-STM-02"""
    from assessments.models import Assessment, AssessmentResponse
    
    assessment = get_object_or_404(Assessment, id=assessment_id)
    responses = AssessmentResponse.objects.filter(
        assessment=assessment
    ).select_related('question__focus_area', 'user')
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="assessment_{assessment_id}_responses.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Focus Area', 'Question Code', 'Question Text', 'Score', 'Comments', 'User', 'Submitted At'])
    
    for r in responses.order_by('question__focus_area__order_index', 'question__order_index'):
        writer.writerow([
            r.question.focus_area.display_name,
            r.question.code,
            r.question.text,
            r.maturity_score if r.maturity_score is not None else '',
            r.comments or '',
            r.user.get_full_name(),
            r.submitted_at.isoformat() if r.submitted_at else ''
        ])
    
    return response