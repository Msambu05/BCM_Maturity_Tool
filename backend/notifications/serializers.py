from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_id', 'template', 'category', 'category_display',
            'notification_type', 'subject', 'message', 'html_content', 'priority', 'priority_display',
            'user', 'user_name', 'email_address', 'cc_recipients',
            'assessment', 'report', 'status', 'status_display',
            'sent_at', 'delivered_at', 'read_at', 'failure_reason', 'retry_count',
            'created_by', 'created_at', 'expires_at', 'click_count', 'open_count'
        ]
        read_only_fields = [
            'notification_id', 'sent_at', 'delivered_at', 'read_at',
            'click_count', 'open_count', 'created_at'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'receive_email_notifications', 'email_assessment_due', 'email_assessment_overdue',
            'email_report_ready', 'email_system_alerts', 'receive_in_app_notifications',
            'in_app_assessment_due', 'in_app_assessment_overdue', 'in_app_report_ready',
            'digest_frequency', 'quiet_hours_start', 'quiet_hours_end', 'updated_at'
        ]
