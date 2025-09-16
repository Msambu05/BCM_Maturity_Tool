from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('profile/', views.profile_view, name='profile'),
    path('organizations/', views.OrganizationListCreateView.as_view(), name='organizations'),
    path('organizations/<int:organization_id>/users/', views.OrganizationUsersView.as_view(), name='organization_users'),
    path('departments/', views.DepartmentListView.as_view(), name='departments'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

]
