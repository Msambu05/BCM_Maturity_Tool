from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from users.models import User, Organization, Department
from assessments.models import FocusArea, Question, Assessment

class Command(BaseCommand):
    help = 'Clean all data except superuser and reload development fixtures'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting cleanup of data except superuser...'))
        with transaction.atomic():
            # Delete all assessments, questions, focus areas
            Assessment.objects.all().delete()
            Question.objects.all().delete()
            FocusArea.objects.all().delete()

            # Delete all departments except those linked to superuser (if any)
            Department.objects.all().delete()

            # Delete all organizations
            Organization.objects.all().delete()

            # Delete all users except superuser
            User.objects.exclude(is_superuser=True).delete()

        self.stdout.write(self.style.SUCCESS('Cleanup complete. Loading development data fixtures...'))

        # Load fixtures in correct dependency order
        fixtures = [
            'dev_organizations',  # First - no dependencies
            'dev_departments',    # Second - depends on organizations
            'dev_users',          # Third - depends on organizations and departments
            'dev_focus_areas',    # Fourth - no dependencies
            'dev_questions',      # Fifth - depends on focus areas
            'dev_assessments'     # Sixth - depends on organizations, departments, users
        ]

        for fixture in fixtures:
            try:
                call_command('loaddata', fixture)
                self.stdout.write(self.style.SUCCESS(f'Loaded {fixture}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to load {fixture}: {e}'))

        self.stdout.write(self.style.SUCCESS('Development data loaded successfully!'))
