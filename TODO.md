# TODO: Add Component Model for BCM Hierarchy

## Information Gathered
- Current FocusArea model has 6 predefined choices that don't match the questionnaire structure
- Questionnaire shows Component "ESTABLISHING A BUSINESS CONTINUITY MANAGEMENT SYSTEM" grouping multiple focus areas
- Need to add Component model above FocusArea in hierarchy: Component -> FocusArea -> Question -> AssessmentResponse

## Plan
1. Add Component model in assessments/models.py
2. Update FocusArea model to reference Component
3. Update Question model ordering to include component
4. Update serializers to include component data
5. Update views to handle component hierarchy
6. Update admin interface for component management
7. Update frontend components to display component hierarchy
8. Create database migration
9. Update fixtures with component data
10. Test the changes

## Dependent Files to Edit
- backend/assessments/models.py
- backend/assessments/serializers.py
- backend/assessments/views.py
- backend/assessments/admin.py
- frontend/src/pages/Assessments/AssessmentDetail.jsx
- frontend/src/pages/Assessments/Assessments.jsx

## Followup Steps
- Run migrations
- Load/update fixtures
- Test component creation and linkage
- Test frontend display of hierarchy
- Verify API endpoints work with new structure
