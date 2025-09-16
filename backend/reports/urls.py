from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'reports', views.GeneratedReportViewSet, basename='reports')
router.register(r'schedules', views.ReportScheduleViewSet, basename='schedules')


urlpatterns = [
    path('', include(router.urls)),
    path('assessment/<int:assessment_id>/summary/', views.assessment_summary_report, name='assessment-summary-report'),
    path('assessment/<int:assessment_id>/export-csv/', views.export_assessment_csv, name='export-assessment-csv'),
]