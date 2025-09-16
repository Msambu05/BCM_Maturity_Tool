from django.core.management.base import BaseCommand
from django.utils import timezone
from assessments.models import Component, FocusArea, Question
from users.models import User

class Command(BaseCommand):
    help = 'Load complete BCM Maturity Assessment structure with all 6 components'

    def handle(self, *args, **options):
        # Get or create a default user for created_by fields
        try:
            default_user = User.objects.filter(is_superuser=True).first()
            if not default_user:
                default_user = User.objects.filter(role='admin').first()
            if not default_user:
                default_user = User.objects.first()
        except:
            self.stdout.write(self.style.WARNING('No users found. Please create a user first.'))
            return

        # Define the complete BCM structure
        bcm_structure = {
            'establishing_bcms': {
                'name': 'Establishing a Business Continuity Management System',
                'order_index': 1,
                'focus_areas': {
                    'management_commitment': {
                        'display_name': 'Management Commitment',
                        'order_index': 1,
                        'questions': [
                            {
                                'text': 'Has a BCM Steering Committee been formally established?',
                                'guidance_notes': 'Approved BCM Steering Committee Terms of Reference',
                                'order_index': 1
                            },
                            {
                                'text': 'Are regular BCM Steering Committee meetings being held and documented?',
                                'guidance_notes': 'Minutes and agenda of BCM Steering Committee meetings',
                                'order_index': 2
                            }
                        ]
                    },
                    'bcm_policy': {
                        'display_name': 'BCM Policy',
                        'order_index': 2,
                        'questions': [
                            {
                                'text': 'Is there an approved BCM Policy in place?',
                                'guidance_notes': 'Approved BCM Policy',
                                'order_index': 1
                            }
                        ]
                    },
                    'governance_structure': {
                        'display_name': 'Governance Structure',
                        'order_index': 3,
                        'questions': [
                            {
                                'text': 'Does the BCM Steering Committee have clearly defined roles and responsibilities?',
                                'guidance_notes': 'Approved BCM Steering Committee Terms of Reference',
                                'order_index': 1
                            },
                            {
                                'text': 'Have BCM Steering Committee members been formally appointed?',
                                'guidance_notes': 'Appointment letters of committee members',
                                'order_index': 2
                            },
                            {
                                'text': 'Are meeting records maintained for the BCM Steering Committee?',
                                'guidance_notes': 'Meeting minutes and agenda',
                                'order_index': 3
                            }
                        ]
                    },
                    'bcm_charter': {
                        'display_name': 'BCM Charter',
                        'order_index': 4,
                        'questions': [
                            {
                                'text': 'Is there a documented and approved BCM Charter?',
                                'guidance_notes': 'BCM Charter',
                                'order_index': 1
                            }
                        ]
                    },
                    'bcm_manager_coordinator': {
                        'display_name': 'BCM Manager/Coordinator',
                        'order_index': 5,
                        'questions': [
                            {
                                'text': 'Has a BCM Manager or Coordinator been formally appointed?',
                                'guidance_notes': 'Appointment letter for BCM Coordinator',
                                'order_index': 1
                            },
                            {
                                'text': 'Are the roles and responsibilities of the BCM Coordinator clearly documented?',
                                'guidance_notes': 'Coordinator roles & responsibilities',
                                'order_index': 2
                            }
                        ]
                    },
                    'bcm_teams': {
                        'display_name': 'BCM Teams',
                        'order_index': 6,
                        'questions': [
                            {
                                'text': 'Have Business Continuity Teams been established and appointed?',
                                'guidance_notes': 'Appointment letters',
                                'order_index': 1
                            },
                            {
                                'text': 'Has an Emergency Response Team (ERT) been formally appointed?',
                                'guidance_notes': 'ERT appointment letters',
                                'order_index': 2
                            },
                            {
                                'text': 'Has a Crisis Management Team (CMT) been formally appointed?',
                                'guidance_notes': 'CMT appointment letters',
                                'order_index': 3
                            },
                            {
                                'text': 'Has a Disaster Recovery Team (IT) been formally appointed?',
                                'guidance_notes': 'Disaster Recovery appointment letters',
                                'order_index': 4
                            }
                        ]
                    },
                    'bcm_champions': {
                        'display_name': 'BCM Champions',
                        'order_index': 7,
                        'questions': [
                            {
                                'text': 'Have BCM Champions been appointed for each business unit?',
                                'guidance_notes': 'Appointment letters for BCM Champions',
                                'order_index': 1
                            }
                        ]
                    },
                    'business_continuity_plan': {
                        'display_name': 'Business Continuity Plan (BCP)',
                        'order_index': 8,
                        'questions': [
                            {
                                'text': 'Is there an approved Business Continuity Plan in place?',
                                'guidance_notes': 'Approved Business Continuity Plan',
                                'order_index': 1
                            }
                        ]
                    },
                    'bcm_budget': {
                        'display_name': 'BCM Budget',
                        'order_index': 9,
                        'questions': [
                            {
                                'text': 'Has a specific budget been allocated to support BCM activities?',
                                'guidance_notes': 'BCM Budget',
                                'order_index': 1
                            }
                        ]
                    },
                    'bcm_programme_work_plan': {
                        'display_name': 'BCM Programme Work Plan',
                        'order_index': 10,
                        'questions': [
                            {
                                'text': 'Does a BCM Programme Work Plan exist to guide implementation?',
                                'guidance_notes': 'BCM Programme Work Plan',
                                'order_index': 1
                            }
                        ]
                    }
                }
            },
            'embracing_bc': {
                'name': 'Embracing Business Continuity',
                'order_index': 2,
                'focus_areas': {
                    'business_impact_analysis': {
                        'display_name': 'Business Impact Analysis',
                        'order_index': 1,
                        'questions': [
                            {
                                'text': 'Has a Business Impact Analysis (BIA) been conducted?',
                                'guidance_notes': 'BIA Report and methodology',
                                'order_index': 1
                            },
                            {
                                'text': 'Are critical business processes identified and prioritized?',
                                'guidance_notes': 'BIA results showing process prioritization',
                                'order_index': 2
                            }
                        ]
                    },
                    'risk_assessment': {
                        'display_name': 'Risk Assessment',
                        'order_index': 2,
                        'questions': [
                            {
                                'text': 'Has a risk assessment been conducted for business continuity?',
                                'guidance_notes': 'Risk assessment report',
                                'order_index': 1
                            }
                        ]
                    },
                    'crisis_management_plan': {
                        'display_name': 'Crisis Management Plan',
                        'order_index': 3,
                        'questions': [
                            {
                                'text': 'Is there a Crisis Management Plan in place?',
                                'guidance_notes': 'Approved Crisis Management Plan',
                                'order_index': 1
                            }
                        ]
                    }
                }
            },
            'analysis': {
                'name': 'Analysis',
                'order_index': 3,
                'focus_areas': {
                    'requirements_analysis': {
                        'display_name': 'Requirements Analysis',
                        'order_index': 1,
                        'questions': [
                            {
                                'text': 'Have business continuity requirements been analyzed?',
                                'guidance_notes': 'Requirements analysis documentation',
                                'order_index': 1
                            }
                        ]
                    },
                    'gap_analysis': {
                        'display_name': 'Gap Analysis',
                        'order_index': 2,
                        'questions': [
                            {
                                'text': 'Has a gap analysis been conducted?',
                                'guidance_notes': 'Gap analysis report',
                                'order_index': 1
                            }
                        ]
                    }
                }
            },
            'solution_design': {
                'name': 'Solution Design',
                'order_index': 4,
                'focus_areas': {
                    'solution_design': {
                        'display_name': 'Solution Design',
                        'order_index': 1,
                        'questions': [
                            {
                                'text': 'Have business continuity solutions been designed?',
                                'guidance_notes': 'Solution design documentation',
                                'order_index': 1
                            }
                        ]
                    },
                    'recovery_strategies': {
                        'display_name': 'Recovery Strategies',
                        'order_index': 2,
                        'questions': [
                            {
                                'text': 'Have recovery strategies been developed?',
                                'guidance_notes': 'Recovery strategy documentation',
                                'order_index': 1
                            }
                        ]
                    }
                }
            },
            'enabling_solutions': {
                'name': 'Enabling Solutions',
                'order_index': 5,
                'focus_areas': {
                    'implementation_planning': {
                        'display_name': 'Implementation Planning',
                        'order_index': 1,
                        'questions': [
                            {
                                'text': 'Has an implementation plan been developed?',
                                'guidance_notes': 'Implementation plan document',
                                'order_index': 1
                            }
                        ]
                    },
                    'resource_allocation': {
                        'display_name': 'Resource Allocation',
                        'order_index': 2,
                        'questions': [
                            {
                                'text': 'Have resources been allocated for implementation?',
                                'guidance_notes': 'Resource allocation documentation',
                                'order_index': 1
                            }
                        ]
                    }
                }
            },
            'validation': {
                'name': 'Validation',
                'order_index': 6,
                'focus_areas': {
                    'testing_validation': {
                        'display_name': 'Testing and Validation',
                        'order_index': 1,
                        'questions': [
                            {
                                'text': 'Have business continuity plans been tested?',
                                'guidance_notes': 'Test reports and results',
                                'order_index': 1
                            },
                            {
                                'text': 'Is there a testing schedule in place?',
                                'guidance_notes': 'Testing schedule document',
                                'order_index': 2
                            }
                        ]
                    },
                    'performance_measurement': {
                        'display_name': 'Performance Measurement',
                        'order_index': 2,
                        'questions': [
                            {
                                'text': 'Are performance metrics defined and measured?',
                                'guidance_notes': 'Performance measurement reports',
                                'order_index': 1
                            }
                        ]
                    }
                }
            }
        }

        # Create components and their focus areas/questions
        for component_key, component_data in bcm_structure.items():
            # Create component
            component, created = Component.objects.get_or_create(
                name=component_data['name'],
                defaults={
                    'order_index': component_data['order_index'],
                    'created_by': default_user
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'Created component: {component.name}'))
            else:
                self.stdout.write(f'Component already exists: {component.name}')

            # Create focus areas for this component
            for fa_key, fa_data in component_data['focus_areas'].items():
                focus_area, created = FocusArea.objects.get_or_create(
                    name=fa_key,
                    defaults={
                        'component': component,
                        'display_name': fa_data['display_name'],
                        'order_index': fa_data['order_index'],
                        'description': f'Questions related to {fa_data["display_name"]}',
                        'created_by': default_user
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'  Created focus area: {focus_area.display_name}'))
                else:
                    # Update component if not set
                    if not focus_area.component:
                        focus_area.component = component
                        focus_area.save()
                    self.stdout.write(f'  Focus area already exists: {focus_area.display_name}')

                # Create questions for this focus area
                for question_data in fa_data['questions']:
                    question, created = Question.objects.get_or_create(
                        focus_area=focus_area,
                        text=question_data['text'],
                        defaults={
                            'guidance_notes': question_data['guidance_notes'],
                            'order_index': question_data['order_index'],
                            'created_by': default_user
                        }
                    )

                    if created:
                        self.stdout.write(self.style.SUCCESS(f'    Created question: {question.text[:50]}...'))
                    else:
                        self.stdout.write(f'    Question already exists: {question.text[:50]}...')

        self.stdout.write(self.style.SUCCESS('Complete BCM structure loading completed!'))
