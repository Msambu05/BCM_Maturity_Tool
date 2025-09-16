from rest_framework import serializers
from .models import GeneratedReport, ReportSchedule

class GeneratedReportSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)

    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'report_id', 'title', 'description',
            'report_type', 'report_type_display', 'format', 'format_display',
            'parameters', 'file_path', 'file_size', 'file_url',
            'status', 'status_display', 'generation_time', 'error_message',
            'assessment', 'organization', 'department',
            'requested_by', 'requested_by_name', 'generated_by', 'generated_at',
            'downloaded_at', 'download_count', 'expires_at', 'is_archived'
        ]
        read_only_fields = [
            'report_id', 'file_size', 'generation_time', 'error_message',
            'generated_at', 'downloaded_at', 'download_count'
        ]

class ReportScheduleSerializer(serializers.ModelSerializer):
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ReportSchedule
        fields = [
            'id', 'name', 'description', 'report_type', 'report_type_display',
            'format', 'parameters', 'frequency', 'frequency_display',
            'start_date', 'end_date', 'next_run', 'last_run',
            'recipients', 'email_recipients', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']