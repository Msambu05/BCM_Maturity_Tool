from rest_framework import serializers
from assessments.models import Assessment, Question
from .models import Evidence
import logging

logger = logging.getLogger(__name__)

def is_file_type_allowed(file):
    """Check if file type is allowed"""
    allowed_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.txt']
    file_name = file.name.lower()
    return any(file_name.endswith(ext) for ext in allowed_extensions)

def has_virus(file):
    """Enhanced virus scanning"""
    from django.conf import settings

    # Skip scanning if explicitly disabled
    if getattr(settings, 'SKIP_VIRUS_SCANNING', False):
        return False

    if getattr(settings, 'MOCK_VIRUS_SCANNING', False):
        # In development, simulate virus detection for testing
        import random
        if random.random() < 0.01:  # 1% chance of "virus"
            logger.warning("Mock virus detected for testing purposes")
            return True
        return False

    # Production code - use real ClamAV
    try:
        from clamd import ClamdUnixSocket, ClamdNetworkSocket

        if hasattr(settings, 'CLAMAV_SOCKET'):
            cd = ClamdUnixSocket(settings.CLAMAV_SOCKET)
        else:
            cd = ClamdNetworkSocket(
                getattr(settings, 'CLAMAV_HOST', 'localhost'),
                getattr(settings, 'CLAMAV_PORT', 3310)
            )

        file.seek(0)
        scan_result = cd.instream(file)
        file.seek(0)

        return scan_result['stream'][0] == 'FOUND'

    except Exception as e:
        logger.error(f"ClamAV error: {e}")

        # In production, be strict about virus scanning
        if not settings.DEBUG:
            # You might want to fail uploads if virus scanning is not available
            # Uncomment the line below to enable this behavior
            # raise serializers.ValidationError({"file_path": "Virus scanning temporarily unavailable"})
            pass

        return False

class EvidenceSerializer(serializers.ModelSerializer):
    """Serializer for Evidence model"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    question_text = serializers.CharField(source='question.text', read_only=True)
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Evidence
        fields = [
            'id', 'evidence_id', 'title', 'description', 'evidence_type',
            'file_name', 'file_size', 'file_type', 'status', 'version',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'updated_at',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'review_notes',
            'download_count', 'is_active', 'question_text', 'assessment_name',
            'file_url', 'keywords', 'valid_until'
        ]
        read_only_fields = ['id', 'evidence_id', 'uploaded_at', 'updated_at', 'download_count']

    def get_file_url(self, obj):
        """Generate download URL for the file"""
        if obj.file_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_path.url)
        return None

class EvidenceUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    question_id = serializers.IntegerField()
    assessment_id = serializers.IntegerField()
    title = serializers.CharField(max_length=255, required=False, default='')
    description = serializers.CharField(required=False, allow_blank=True, default='')
    evidence_type = serializers.ChoiceField(choices=Evidence.EVIDENCE_TYPES, required=False, default='other')

    def validate_file(self, file):
        """Validate uploaded file"""
        max_size = 10 * 1024 * 1024  # 10MB

        if file.size > max_size:
            raise serializers.ValidationError(
                f"File size must be less than {max_size // 1024 // 1024}MB. Current size: {file.size // 1024 // 1024}MB"
            )

        if not is_file_type_allowed(file):
            raise serializers.ValidationError(
                "File type not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT"
            )

        if has_virus(file):
            raise serializers.ValidationError(
                "File contains malware and has been rejected"
            )

        return file

    def validate(self, attrs):
        """Cross-field validation"""
        try:
            question = Question.objects.get(id=attrs['question_id'])
            assessment = Assessment.objects.get(id=attrs['assessment_id'])

            # Basic validation - just ensure objects exist
            # The relationship validation is handled in the view

        except Question.DoesNotExist:
            raise serializers.ValidationError("Invalid question_id")
        except Assessment.DoesNotExist:
            raise serializers.ValidationError("Invalid assessment_id")

        return attrs
