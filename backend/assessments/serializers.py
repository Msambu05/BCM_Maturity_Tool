from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models import Organization, Department
from .models import Component, FocusArea, Question, Assessment, AssessmentResponse

User = get_user_model()

class ComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Component
        fields = ['id', 'name', 'code', 'description', 'order_index', 'is_active', 'created_at']

class FocusAreaSerializer(serializers.ModelSerializer):
    component = ComponentSerializer(read_only=True)
    component_id = serializers.PrimaryKeyRelatedField(
        source='component', queryset=Component.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = FocusArea
        fields = ['id', 'component', 'component_id', 'name', 'display_name', 'code', 'description',
                 'weight', 'order_index', 'is_active', 'created_at']

class QuestionSerializer(serializers.ModelSerializer):
    focus_area = FocusAreaSerializer(read_only=True)
    focus_area_id = serializers.PrimaryKeyRelatedField(
        source='focus_area', queryset=FocusArea.objects.all(), write_only=True
    )

    class Meta:
        model = Question
        fields = ['id', 'focus_area', 'focus_area_id', 'text', 'description', 'code',
                 'guidance_notes', 'weight', 'order_index', 'is_active', 'is_required', 'created_at']

class AssessmentSerializer(serializers.ModelSerializer):
    organization = serializers.StringRelatedField(read_only=True)
    organization_id = serializers.PrimaryKeyRelatedField(
        source='organization', queryset=Organization.objects.all(), write_only=True
    )
    department = serializers.StringRelatedField(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        source='department', queryset=Department.objects.all(), write_only=True
    )
    created_by = serializers.StringRelatedField(read_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, required=False)
    reviewer = serializers.StringRelatedField(read_only=True)
    approver = serializers.StringRelatedField(read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Assessment
        fields = [
            'id', 'reference_number', 'name', 'description',
            'organization', 'organization_id', 'department', 'department_id',
            'assessment_period', 'start_date', 'due_date',
            'status', 'status_display', 'is_overdue',
            'created_by', 'assigned_to', 'reviewer', 'approver',
            'submitted_at', 'reviewed_at', 'approved_at', 'completed_at',
            'version', 'is_template', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['reference_number', 'created_by', 'created_at', 'updated_at']

class AssessmentResponseSerializer(serializers.ModelSerializer):
    assessment = serializers.StringRelatedField(read_only=True)
    assessment_id = serializers.PrimaryKeyRelatedField(
        source='assessment', queryset=Assessment.objects.all(), write_only=True
    )
    question = serializers.StringRelatedField(read_only=True)
    question_id = serializers.PrimaryKeyRelatedField(
        source='question', queryset=Question.objects.all()
    )
    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source='user', queryset=User.objects.all(), write_only=True, required=False
    )

    maturity_display = serializers.CharField(source='get_maturity_score_display', read_only=True)
    maturity_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    has_evidence = serializers.BooleanField(read_only=True)
    evidence_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AssessmentResponse
        fields = [
            'id', 'assessment', 'assessment_id', 'question', 'question_id',
            'user', 'user_id', 'maturity_score', 'maturity_display', 'maturity_percentage',
            'comments', 'rationale', 'is_submitted', 'has_evidence', 'evidence_count',
            'submitted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['is_submitted', 'submitted_at', 'created_at', 'updated_at']

    def validate(self, attrs):
        # Ensure user can only submit responses for assessments assigned to them
        request = self.context.get('request')
        if request and request.user:
            assessment = attrs.get('assessment')
            if assessment and request.user not in assessment.assigned_to.all() and request.user.role != 'admin':
                raise serializers.ValidationError("You are not assigned to this assessment.")
        return attrs

    def create(self, validated_data):
        if 'user' not in validated_data or validated_data['user'] is None:
            validated_data['user'] = self.context['request'].user
        return super().create(validated_data)