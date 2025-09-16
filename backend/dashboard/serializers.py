# backend/dashboard/serializers.py
from rest_framework import serializers
from .models import DashboardConfig

class DashboardConfigSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    dashboard_type_display = serializers.CharField(source='get_dashboard_type_display', read_only=True)

    class Meta:
        model = DashboardConfig
        fields = [
            'id', 'user', 'dashboard_type', 'dashboard_type_display',
            'name', 'description', 'layout_config', 'widget_config',
            'filters', 'organization', 'department', 'is_shared',
            'shared_with', 'is_default', 'created_at', 'updated_at',
            'last_accessed'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'last_accessed']

class WidgetConfigSerializer(serializers.Serializer):
    """Serializer for widget configuration"""
    widget_type = serializers.CharField()
    title = serializers.CharField()
    data_source = serializers.CharField()
    config = serializers.DictField()
    refresh_interval = serializers.IntegerField(default=300)
    size_x = serializers.IntegerField(default=4)
    size_y = serializers.IntegerField(default=3)