from django.contrib import admin
from .models import Component, FocusArea, Question, Assessment, AssessmentResponse

@admin.register(Component)
class ComponentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'order_index', 'is_active', 'is_visible')
    list_editable = ('is_active', 'is_visible')
    ordering = ('order_index', 'name')

@admin.register(FocusArea)
class FocusAreaAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'component', 'code', 'order_index', 'is_active')
    ordering = ('component__order_index', 'order_index')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('code', 'text', 'focus_area', 'order_index', 'is_active')
    ordering = ('focus_area__component__order_index', 'focus_area__order_index', 'order_index')

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'name', 'organization', 'department', 'status', 'due_date')
    ordering = ('-created_at',)

@admin.register(AssessmentResponse)
class AssessmentResponseAdmin(admin.ModelAdmin):
    list_display = ('assessment', 'question', 'user', 'maturity_score', 'is_submitted', 'submitted_at')
    ordering = ('-created_at',)
