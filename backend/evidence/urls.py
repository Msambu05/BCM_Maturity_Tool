from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'evidence', views.EvidenceViewSet, basename='evidence')

urlpatterns = [
    path('', include(router.urls)),
]