from io import BytesIO
from django.utils import timezone
from django.http import HttpResponse
from django.template.loader import render_to_string
from xhtml2pdf import pisa
import pandas as pd
from assessments.models import Assessment, AssessmentResponse
from scoring.models import MaturityScore
from django.conf import settings

class ReportGenerator:
    @staticmethod
    def generate_assessment_summary(assessment_id):
        """Generate comprehensive assessment summary"""
        assessment = Assessment.objects.get(id=assessment_id)
        
        overall_score = MaturityScore.objects.filter(
            assessment=assessment,
            focus_area__isnull=True,
            is_current=True
        ).first()
        
        focus_area_scores = MaturityScore.objects.filter(
            assessment=assessment,
            focus_area__isnull=False,
            is_current=True
        ).select_related('focus_area')
        
        responses = AssessmentResponse.objects.filter(assessment=assessment)
        total_questions = responses.count()
        answered_questions = responses.filter(maturity_score__isnull=False).count()
        responses_with_evidence = responses.filter(evidence_count__gt=0).count()
        
        report_data = {
            'assessment': {
                'id': assessment.id,
                'name': assessment.name,
                'reference_number': assessment.reference_number,
                'department': assessment.department.name,
                'organization': assessment.organization.name,
                'period': assessment.assessment_period,
                'status': assessment.get_status_display(),
                'due_date': assessment.due_date,
                'completed_at': assessment.completed_at
            },
            'scores': {
                'overall': {
                    'score': overall_score.score if overall_score else None,
                    'level': overall_score.get_level_display() if overall_score else 'N/A',
                    'completion': overall_score.completion_percentage if overall_score else 0
                },
                'by_focus_area': [
                    {
                        'name': score.focus_area.display_name,
                        'score': score.score,
                        'level': score.get_level_display(),
                        'completion': score.completion_percentage,
                        'questions_answered': f"{score.answered_count}/{score.question_count}"
                    }
                    for score in focus_area_scores
                ]
            },
            'statistics': {
                'total_questions': total_questions,
                'answered_questions': answered_questions,
                'completion_rate': round((answered_questions / total_questions * 100), 2) if total_questions else 0,
                'with_evidence': responses_with_evidence,
                'evidence_rate': round((responses_with_evidence / total_questions * 100), 2) if total_questions else 0
            },
            'generated_at': timezone.now(),
            'generated_by': 'BCM-MAP System'
        }
        
        return report_data

    @staticmethod
    def generate_pdf_report(report_data, title):
        """Generate PDF report using xhtml2pdf"""
        # Render HTML template
        html_string = render_to_string('reports/assessment_summary.html', {
            'data': report_data,
            'title': title
        })

        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(
            src=html_string,
            dest=pdf_buffer,
            encoding='UTF-8'
        )

        if pisa_status.err:
            return None  # You can log errors if needed

        return pdf_buffer.getvalue()
    
        # Save to disk if save_path is provided
        if save_path:
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, 'wb') as f:
                f.write(pdf_bytes)

        return pdf_bytes

    @staticmethod
    def generate_excel_report(report_data, title):
        """Generate Excel report from data"""
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Summary sheet
            summary_data = {
                'Metric': ['Overall Score', 'Completion Rate', 'Questions Answered', 
                          'With Evidence', 'Generated On'],
                'Value': [
                    report_data['scores']['overall']['score'],
                    f"{report_data['statistics']['completion_rate']}%",
                    f"{report_data['statistics']['answered_questions']}/{report_data['statistics']['total_questions']}",
                    report_data['statistics']['with_evidence'],
                    report_data['generated_at'].strftime('%Y-%m-%d %H:%M')
                ]
            }
            pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
            
            # Focus Areas sheet
            focus_area_data = []
            for fa in report_data['scores']['by_focus_area']:
                focus_area_data.append({
                    'Focus Area': fa['name'],
                    'Score': fa['score'],
                    'Maturity Level': fa['level'],
                    'Completion': f"{fa['completion']}%",
                    'Questions Answered': fa['questions_answered']
                })
            pd.DataFrame(focus_area_data).to_excel(writer, sheet_name='Focus Areas', index=False)
        
        return output.getvalue()
