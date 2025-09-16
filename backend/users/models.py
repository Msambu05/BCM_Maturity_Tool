# users/models.py
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone

class Organization(models.Model):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=50, unique=True)  # Added for organization code
    description = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)  # Added address field
    contact_email = models.EmailField(blank=True, null=True)  # Added contact email
    contact_phone = models.CharField(max_length=20, blank=True, null=True)  # Added contact phone
    is_active = models.BooleanField(default=True)  # Added active status
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_organizations')  # Added creator

    class Meta:
        db_table = 'organizations'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)  # Added department code
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='departments')
    description = models.TextField(blank=True, null=True)
    manager_name = models.CharField(max_length=255, blank=True, null=True)  # Added manager info
    manager_email = models.EmailField(blank=True, null=True)
    is_active = models.BooleanField(default=True)  # Added active status
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_departments')  # Added creator

    class Meta:
        db_table = 'departments'
        ordering = ['name']
        unique_together = ['code', 'organization']  # Code should be unique within organization

    def __str__(self):
        return f"{self.name} - {self.organization.name}"

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('bcm_coordinator', 'BCM Coordinator'),
        ('business_unit_champion', 'Business Unit Champion'),
        ('steering_committee', 'Steering Committee'),
    ]

    # Personal Information
    title = models.CharField(max_length=100, blank=True, null=True)  # Added title (Mr, Ms, Dr, etc.)
    employee_id = models.CharField(max_length=50, unique=True, blank=True, null=True)  # Added employee ID
    role = models.CharField(max_length=25, choices=ROLE_CHOICES)
    
    # Organization Information
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    
    # Contact Information
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    mobile_number = models.CharField(max_length=20, blank=True, null=True)  # Added mobile number
    office_location = models.CharField(max_length=255, blank=True, null=True)  # Added office location
    
    # Status and Dates
    is_active = models.BooleanField(default=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)  # Added login tracking
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(null=True, blank=True)  # Added last activity tracking

    # Override ManyToMany fields
    groups = models.ManyToManyField(Group, related_name="custom_user_set", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="custom_user_set_permissions", blank=True)

    class Meta:
        db_table = 'users'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.get_full_name()} - {self.role} - {self.organization.name if self.organization else 'No Org'}"