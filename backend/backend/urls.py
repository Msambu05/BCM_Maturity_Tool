"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.utils import timezone

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/assessments/', include('assessments.urls')),
    path('api/evidence/', include('evidence.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/scoring/', include('scoring.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    # Development-only URLs
    from django.urls import path
    from django.http import JsonResponse
    import json
    
    def dev_test_email(request):
        """Test email endpoint for development"""
        from django.core.mail import send_mail
        from django.template.loader import render_to_string
        
        send_mail(
            subject='Test Email from BCM-MAP',
            message='This is a test email from the development server.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['test@example.com'],
            html_message=render_to_string('email_development.html', {
                'notification': type('Obj', (), {
                    'subject': 'Test Email',
                    'message': 'This is a test email from the development server.',
                    'email_address': 'test@example.com'
                })(),
                'site_url': settings.SITE_URL
            })
        )
        
        return JsonResponse({'status': 'test_email_sent'})
    
    def dev_test_pdf(request):
        """Test PDF generation endpoint for development"""
        from reports.utils import ReportGenerator
        
        # Create test data
        test_data = {
            'assessment': {
                'name': 'Test Assessment',
                'reference_number': 'TEST-001',
                'department': 'Development Department',
                'organization': 'Development Corp',
                'period': 'Q1 2024',
                'status': 'Completed',
                'due_date': '2024-03-31',
                'completed_at': '2024-03-15'
            },
            'scores': {
                'overall': {'score': 3.8, 'level': 'Defined', 'completion': 95.0},
                'by_focus_area': [
                    {'name': 'Establishing a BCMS', 'score': 4.2, 'level': 'Managed', 'completion': 100, 'questions_answered': '5/5'},
                    {'name': 'Analysis', 'score': 3.5, 'level': 'Defined', 'completion': 90, 'questions_answered': '9/10'}
                ]
            },
            'statistics': {
                'total_questions': 50,
                'answered_questions': 48,
                'completion_rate': 96.0,
                'with_evidence': 35
            },
            'generated_at': timezone.now(),
            'generated_by': 'Development System'
        }
        
        pdf_content = ReportGenerator.generate_pdf_report(test_data, 'Test Report')
        
        from django.http import HttpResponse
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="test_report.pdf"'
        return response
    
    # Add development routes
    urlpatterns += [
        path('dev/test-email/', dev_test_email, name='dev_test_email'),
        path('dev/test-pdf/', dev_test_pdf, name='dev_test_pdf'),
    ]
