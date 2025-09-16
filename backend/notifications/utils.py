import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from .models import Notification, NotificationTemplate
from users.models import User

logger = logging.getLogger(__name__)

class NotificationService:
    # Update the _send_email_notification method
    @staticmethod
    def _send_email_notification(notification, context):
        """Send email notification - development version"""
        from django.conf import settings
        
        try:
            # Add site URL to context
            context['site_url'] = getattr(settings, 'SITE_URL', 'http://localhost:3000')
            context['from_email'] = settings.DEFAULT_FROM_EMAIL
            
            # Use development template in debug mode
            template_name = 'email_development.html' if settings.DEBUG else 'email_template.html'
            
            # Render HTML template
            html_message = render_to_string(
                template_name,
                {**context, 'notification': notification}
            )
            
            # In development, use console email backend
            # The actual sending is handled by Django's console backend
            send_mail(
                subject=f"[DEV] {notification.subject}",
                message=notification.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.email_address],
                html_message=html_message,
                fail_silently=False
            )
            
            notification.delivered_at = timezone.now()
            notification.status = 'delivered'
            
            if settings.DEBUG:
                logger.info(f"Development email would be sent to: {notification.email_address}")
            
        except Exception as e:
            logger.error(f"Failed to send email to {notification.email_address}: {e}")
            notification.status = 'failed'
            notification.failure_reason = str(e)
            notification.retry_count += 1

    @staticmethod
    def _create_notification(user, template, subject, message, context, assessment=None):
        """Create and send a notification"""
        try:
            # Create notification record
            notification = Notification.objects.create(
                template=template,
                category=template.category,
                notification_type=template.notification_type,
                subject=subject,
                message=message,
                recipient=user,
                email_address=user.email,
                assessment=assessment,
                created_by=assessment.created_by if assessment else None
            )
            
            # Send email if configured
            if template.notification_type in ['email', 'both']:
                NotificationService._send_email_notification(notification, context)
            
            # For in-app notifications, the record is already created
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.save()
            
        except Exception as e:
            logger.error(f"Failed to create notification for user {user.id}: {e}")

    @staticmethod
    def _send_email_notification(notification, context):
        """Send email notification"""
        try:
            # Render HTML template if available
            html_message = None
            if notification.template.html_template:
                html_message = render_to_string(
                    'email_template.html',
                    {**context, 'notification': notification}
                )
            
            # Send email
            send_mail(
                subject=notification.subject,
                message=notification.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.email_address],
                html_message=html_message,
                fail_silently=False
            )
            
            notification.delivered_at = timezone.now()
            notification.status = 'delivered'
            
        except Exception as e:
            logger.error(f"Failed to send email to {notification.email_address}: {e}")
            notification.status = 'failed'
            notification.failure_reason = str(e)
            notification.retry_count += 1

    @staticmethod
    def send_due_date_reminders():
        """Send reminders for due and overdue assessments"""
        from assessments.models import Assessment
        from django.utils import timezone
        from datetime import timedelta
        
        # Assessments due in next 3 days
        due_soon = Assessment.objects.filter(
            due_date__range=[timezone.now(), timezone.now() + timedelta(days=3)],
            status__in=['draft', 'in_progress']
        )
        
        for assessment in due_soon:
            for user in assessment.assigned_to.all():
                NotificationService.send_assessment_notification(
                    assessment=assessment,
                    action='due_soon',
                    recipient=user,
                    context={'due_date': assessment.due_date}
                )
        
        # Overdue assessments
        overdue = Assessment.objects.filter(
            due_date__lt=timezone.now(),
            status__in=['draft', 'in_progress']
        )
        
        for assessment in overdue:
            for user in assessment.assigned_to.all():
                NotificationService.send_assessment_notification(
                    assessment=assessment,
                    action='overdue',
                    recipient=user
                )

# Shortcut function
def send_assessment_notification(assessment, action, recipient=None, context=None):
    NotificationService.send_assessment_notification(assessment, action, recipient, context)