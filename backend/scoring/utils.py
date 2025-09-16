from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from assessments.models import Assessment, AssessmentResponse, FocusArea
from django.db.models import transaction
from .models import ImprovementRecommendation, MaturityScore
from .serializers import ImprovementRecommendationSerializer


def compute_assessment_scores(assessment: Assessment):
    responses = AssessmentResponse.objects.filter(assessment=assessment).select_related("question__focus_area")
    total = responses.count()
    answered = responses.exclude(maturity_score__isnull=True).count()
    completion = round((answered / total) * 100, 2) if total else 0.0

    fa_totals, fa_counts = {}, {}
    for r in responses:
        if r.maturity_score is None:
            continue
        fa_id = r.question.focus_area_id
        fa_totals[fa_id] = fa_totals.get(fa_id, 0) + r.maturity_score
        fa_counts[fa_id] = fa_counts.get(fa_id, 0) + 1

    fas = {fa.id: fa for fa in FocusArea.objects.filter(id__in=fa_totals.keys())}
    fa_scores = [
        {
            "focus_area_id": fa_id,
            "focus_area_name": fas[fa_id].display_name,
            "average": round(fa_totals[fa_id] / max(fa_counts[fa_id], 1), 2),
            "answered": fa_counts[fa_id],
        }
        for fa_id in fa_totals.keys()
    ]
    overall = round(sum(x["average"] for x in fa_scores) / max(len(fa_scores), 1), 2) if fa_scores else None
    return {"overall": overall, "completion_pct": completion, "focus_areas": fa_scores}

class RecommendationEngine:
    # Maturity level thresholds
    THRESHOLDS = {
        'critical': 2.0,  # Below this needs immediate attention
        'high': 3.0,      # Below this needs high priority
        'medium': 4.0     # Below this needs medium priority
    }
    
    # Action templates by focus area
    ACTION_TEMPLATES = {
        'establishing_bcms': [
            'Develop and document BCMS policy',
            'Establish management framework and governance',
            'Define roles, responsibilities, and authorities',
            'Secure management commitment and resources'
        ],
        'embracing_bc': [
            'Develop business continuity awareness program',
            'Establish competency requirements and training',
            'Implement communication and consultation processes',
            'Create organizational culture of resilience'
        ],
        'analysis': [
            'Conduct comprehensive business impact analysis',
            'Identify critical functions and processes',
            'Establish recovery time objectives (RTOs)',
            'Determine resource requirements for recovery'
        ],
        'solution_design': [
            'Develop business continuity strategies',
            'Design recovery solutions for critical functions',
            'Establish resource recovery strategies',
            'Implement preventive and mitigation controls'
        ],
        'enabling_solutions': [
            'Develop business continuity plans and procedures',
            'Establish incident response structure',
            'Implement crisis management framework',
            'Develop communication and notification procedures'
        ],
        'validation': [
            'Establish exercise and testing program',
            'Conduct regular business continuity exercises',
            'Implement maintenance and review processes',
            'Establish continuous improvement framework'
        ]
    }
    
    @staticmethod
    def generate_recommendations(assessment_id):
        """Generate improvement recommendations based on scores"""
        assessment = Assessment.objects.get(id=assessment_id)
        recommendations = []
        
        # Get low-scoring focus areas
        low_scores = MaturityScore.objects.filter(
            assessment=assessment,
            focus_area__isnull=False,
            is_current=True,
            score__lt=RecommendationEngine.THRESHOLDS['medium']
        ).select_related('focus_area')
        
        for score in low_scores:
            priority = RecommendationEngine._determine_priority(score.score)
            actions = RecommendationEngine._generate_actions(score.focus_area, score.score)
            
            recommendation = ImprovementRecommendation(
                assessment=assessment,
                focus_area=score.focus_area,
                title=f"Improve {score.focus_area.display_name} Maturity",
                description=f"Current score of {score.score} indicates need for improvement in {score.focus_area.display_name}",
                current_score=score.score,
                target_score=min(score.score + 1.0, 5.0),  # Aim for at least 1 point improvement
                priority=priority,
                suggested_actions="\n".join(actions),
                estimated_effort=RecommendationEngine._estimate_effort(priority, score.focus_area),
                timeline_weeks=RecommendationEngine._estimate_timeline(priority),
                department=assessment.department
            )
            
            recommendations.append(recommendation)
        
        return recommendations
    
    @staticmethod
    def _determine_priority(score):
        if score < RecommendationEngine.THRESHOLDS['critical']:
            return 'critical'
        elif score < RecommendationEngine.THRESHOLDS['high']:
            return 'high'
        else:
            return 'medium'
    
    @staticmethod
    def _generate_actions(focus_area, current_score):
        """Generate specific actions based on focus area and current score"""
        base_actions = RecommendationEngine.ACTION_TEMPLATES.get(focus_area.name, [])
        
        # Select actions based on current maturity level
        if current_score < 2.0:  # Initial level
            return base_actions[:2]  # Basic actions
        elif current_score < 3.0:  # Developing level
            return base_actions[1:3]  # Intermediate actions
        else:  # Defined level or above
            return base_actions[2:]  # Advanced actions
    
    @staticmethod
    def _estimate_effort(priority, focus_area):
        """Estimate effort in person-hours"""
        effort_base = {
            'critical': 40,
            'high': 24,
            'medium': 16
        }
        
        # Adjust based on focus area complexity
        complexity = {
            'establishing_bcms': 1.2,
            'analysis': 1.5,
            'solution_design': 1.3,
            'enabling_solutions': 1.1,
            'validation': 1.0,
            'embracing_bc': 0.9
        }
        
        return int(effort_base[priority] * complexity.get(focus_area.name, 1.0))
    
    @staticmethod
    def _estimate_timeline(priority):
        """Estimate timeline in weeks"""
        return {
            'critical': 4,
            'high': 8,
            'medium': 12
        }[priority]

# Update the generate_recommendations view
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_recommendations(request, assessment_id):
    """Generate improvement recommendations - UC-SYS-05"""
    try:
        assessment = Assessment.objects.get(id=assessment_id)
        
        # Check permissions
        user = request.user
        if user.role not in ['admin', 'bcm_coordinator'] and assessment.organization != user.organization:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Generate recommendations
        recommendations = RecommendationEngine.generate_recommendations(assessment_id)
        
        # Save recommendations
        with transaction.atomic():
            for recommendation in recommendations:
                recommendation.save()
        
        return Response({
            'status': 'recommendations generated',
            'count': len(recommendations),
            'recommendations': ImprovementRecommendationSerializer(recommendations, many=True).data
        })
        
    except Assessment.DoesNotExist:
        return Response({'error': 'Assessment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)