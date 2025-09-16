from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'configs', views.DashboardConfigViewSet, basename='dashboardconfig')

urlpatterns = [
    path('', include(router.urls)),
    path('overview-stats/', views.overview_stats, name='dashboard-overview-stats'),
    path('department-comparison/', views.department_comparison, name='dashboard-department-comparison'),
    path('assessment/<int:assessment_id>/focus-area-scores/', views.focus_area_scores, name='focus-area-scores'),
    path('recent-activity/', views.recent_activity, name='dashboard-recent-activity'),
]