from rest_framework import serializers
from .models import MaturityScore, ImprovementRecommendation, ScoreSnapshot

class MaturityScoreSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    focus_area_name = serializers.CharField(source='focus_area.display_name', read_only=True)
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)

    class Meta:
        model = MaturityScore
        fields = [
            'id', 'assessment', 'assessment_name', 'focus_area', 'focus_area_name',
            'score', 'level', 'level_display', 'max_possible_score', 'weighted_score',
            'question_count', 'answered_count', 'completion_percentage', 'average_response_time',
            'benchmark_score', 'benchmark_percentile', 'gap',
            'calculated_at', 'is_current', 'version'
        ]
        read_only_fields = ['calculated_at', 'is_current', 'version']

class ImprovementRecommendationSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    focus_area_name = serializers.CharField(source='focus_area.display_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = ImprovementRecommendation
        fields = [
            'id', 'recommendation_id', 'assessment', 'focus_area', 'focus_area_name',
            'title', 'description', 'current_score', 'target_score',
            'priority', 'priority_display', 'status', 'status_display',
            'suggested_actions', 'estimated_effort', 'estimated_cost', 'timeline_weeks',
            'assigned_to', 'assigned_to_name', 'department', 'department_name',
            'target_completion_date', 'actual_start_date', 'actual_completion_date',
            'progress_percentage', 'milestones', 'expected_impact', 'risk_level',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['recommendation_id', 'created_at', 'updated_at']

class ScoreSnapshotSerializer(serializers.ModelSerializer):
    snapshot_type_display = serializers.CharField(source='get_snapshot_type_display', read_only=True)
    overall_level_display = serializers.CharField(source='get_overall_level_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ScoreSnapshot
        fields = [
            'id', 'assessment', 'snapshot_type', 'snapshot_type_display', 'taken_at',
            'overall_score', 'overall_level', 'overall_level_display', 'completion_percentage',
            'focus_area_scores', 'question_stats', 'note', 'created_by', 'created_by_name', 'version'
        ]
        read_only_fields = ['taken_at', 'version']