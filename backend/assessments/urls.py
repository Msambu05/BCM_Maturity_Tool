from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'components', views.ComponentViewSet, basename='components')
router.register(r'focus-areas', views.FocusAreaViewSet, basename='focus-areas')
router.register(r'questions', views.QuestionViewSet, basename='questions')
router.register(r'assessments', views.AssessmentViewSet, basename='assessments')
router.register(r'responses', views.AssessmentResponseViewSet, basename='responses')

urlpatterns = [
    path('', include(router.urls)),
]
