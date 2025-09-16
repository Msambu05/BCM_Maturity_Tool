from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'scores', views.MaturityScoreViewSet, basename='scores')
router.register(r'recommendations', views.ImprovementRecommendationViewSet, basename='recommendations')
router.register(r'snapshots', views.ScoreSnapshotViewSet, basename='snapshots')

urlpatterns = [
    path('', include(router.urls)),
    path('assessment/<int:assessment_id>/calculate-scores/', views.calculate_scores, name='calculate-scores'),
    path('assessment/<int:assessment_id>/generate-recommendations/', views.generate_recommendations, name='generate-recommendations'),
]