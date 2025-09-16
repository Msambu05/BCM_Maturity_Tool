from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Load development data fixtures'
    
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Loading development data...')
        )
        
        # Load fixtures in order
        fixtures = [
            'dev_organizations',
            'dev_users',
            'dev_departments',
            'dev_focus_areas',
            'dev_questions',
            'dev_assessments',
            'dev_assessment_responses',
            'dev_evidence_fixed',
            'dev_notifications_fixed',
            'dev_scores_fixed',
            'dev_reports_fixed'
        ]
        
        for fixture in fixtures:
            try:
                call_command('loaddata', fixture)
                self.stdout.write(
                    self.style.SUCCESS(f'Loaded {fixture}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Could not load {fixture}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Development data loaded successfully!')
        )