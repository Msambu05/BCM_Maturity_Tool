from django.core.management.base import BaseCommand
from django.utils import timezone
from notifications.utils import NotificationService
from assessments.models import Assessment
from users.models import User

class Command(BaseCommand):
    help = 'Test notifications in development mode'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            choices=['all', 'due', 'overdue', 'submitted', 'assigned'],
            default='all',
            help='Type of notification to test'
        )
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🧪 Testing Notifications - Development Mode 🧪')
        )
        
        # Get or create test data
        try:
            assessment = Assessment.objects.first()
            if not assessment:
                self.stdout.write(
                    self.style.WARNING('No assessments found. Creating test assessment...')
                )
                from users.models import Organization, Department
                org = Organization.objects.first() or Organization.objects.create(name="Test Org")
                dept = Department.objects.first() or Department.objects.create(name="Test Dept", organization=org)
                user = User.objects.first()
                
                assessment = Assessment.objects.create(
                    name="Test Assessment",
                    organization=org,
                    department=dept,
                    created_by=user
                )
            
            user = User.objects.first()
            
            # Test different notification types
            notification_type = options['type']
            
            if notification_type in ['all', 'submitted']:
                self.stdout.write(
                    self.style.MIGRATE_HEADING('\n1. Testing Submission Notification...')
                )
                NotificationService.send_assessment_notification(
                    assessment=assessment,
                    action='submitted',
                    recipient=user,
                    context={'submitted_by': 'Test User'}
                )
            
            if notification_type in ['all', 'assigned']:
                self.stdout.write(
                    self.style.MIGRATE_HEADING('\n2. Testing Assignment Notification...')
                )
                NotificationService.send_assessment_notification(
                    assessment=assessment,
                    action='assigned',
                    recipient=user,
                    context={'assigned_by': 'Test Coordinator'}
                )
            
            if notification_type in ['all', 'due']:
                self.stdout.write(
                    self.style.MIGRATE_HEADING('\n3. Testing Due Soon Notification...')
                )
                # Set due date for testing
                assessment.due_date = timezone.now() + timezone.timedelta(days=2)
                assessment.save()
                NotificationService.send_assessment_notification(
                    assessment=assessment,
                    action='due_soon',
                    recipient=user
                )
            
            if notification_type in ['all', 'overdue']:
                self.stdout.write(
                    self.style.MIGRATE_HEADING('\n4. Testing Overdue Notification...')
                )
                # Set overdue due date
                assessment.due_date = timezone.now() - timezone.timedelta(days=1)
                assessment.save()
                NotificationService.send_assessment_notification(
                    assessment=assessment,
                    action='overdue',
                    recipient=user
                )
            
            self.stdout.write(
                self.style.SUCCESS('\n✅ Notification testing completed!')
            )
            self.stdout.write(
                self.style.NOTICE('Check the console output for email previews.')
            )
            self.stdout.write(
                self.style.NOTICE('Check admin interface for notification records.')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {e}')
            )
            import traceback
            traceback.print_exc()