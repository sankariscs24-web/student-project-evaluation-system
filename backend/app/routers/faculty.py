import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models import (
    User, Assessment, AssessmentAssignment, AssessmentSubmission,
    TestCase, VivaQuestion, VivaAnswer, DebuggingProblem, Feedback, PlagiarismReport
)
from app.schemas import (
    FacultyDashboardStats, AssessmentCreate, AssessmentUpdate,
    AssessmentDetailResponse, FacultyReviewRequest, PublishMarksRequest
)
from app.auth import get_current_user, require_faculty

router = APIRouter(prefix="/faculty", tags=["Faculty"])

@router.get("/dashboard", response_model=FacultyDashboardStats)
def get_faculty_dashboard(
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    total_students = db.query(User).filter(User.role == "student").count()
    total_assessments = db.query(Assessment).count()
    submissions = db.query(AssessmentSubmission).filter(AssessmentSubmission.is_final_submitted == True).all()
    submissions_received = len(submissions)
    
    # Calculate pending submissions (students assigned who haven't completed)
    total_assignments = db.query(AssessmentAssignment).count()
    pending_submissions = max(0, total_assignments - submissions_received)

    # Marks & pass rate calculations
    scores = [s.total_score for s in submissions if s.total_score is not None]
    avg_marks = round(sum(scores) / len(scores), 1) if scores else 0.0

    total_test_cases_run = 0
    passed_test_cases_count = 0
    for s in submissions:
        if s.coding_test_results:
            for tc in s.coding_test_results:
                total_test_cases_run += 1
                if tc.get("passed"):
                    passed_test_cases_count += 1

    pass_rate = round((passed_test_cases_count / max(1, total_test_cases_run)) * 100, 1)

    plagiarism_alerts = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.is_final_submitted == True,
        AssessmentSubmission.plagiarism_score >= 60.0
    ).count()

    feedback_received = db.query(Feedback).count()

    # Marks Distribution Buckets
    buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for score in scores:
        if score <= 20:
            buckets["0-20"] += 1
        elif score <= 40:
            buckets["21-40"] += 1
        elif score <= 60:
            buckets["41-60"] += 1
        elif score <= 80:
            buckets["61-80"] += 1
        else:
            buckets["81-100"] += 1

    marks_distribution = [{"range": k, "count": v} for k, v in buckets.items()]

    # Performance trends by assessment
    assessments = db.query(Assessment).all()
    performance_trends = []
    for a in assessments:
        subs_for_a = [s for s in submissions if s.assessment_id == a.id]
        a_scores = [s.total_score for s in subs_for_a if s.total_score is not None]
        avg_a_score = round(sum(a_scores) / len(a_scores), 1) if a_scores else 0.0
        performance_trends.append({
            "assessment": a.title[:18] + ("..." if len(a.title) > 18 else ""),
            "average": avg_a_score,
            "submissions": len(subs_for_a)
        })

    # Difficulty breakdown
    diff_counts = {"Easy": 0, "Medium": 0, "Hard": 0}
    for a in assessments:
        diff = a.difficulty.capitalize() if a.difficulty else "Medium"
        diff_counts[diff] = diff_counts.get(diff, 0) + 1

    difficulty_breakdown = [{"difficulty": k, "count": v} for k, v in diff_counts.items()]

    return FacultyDashboardStats(
        total_students=total_students,
        total_assessments=total_assessments,
        submissions_received=submissions_received,
        pending_submissions=pending_submissions,
        average_marks=avg_marks,
        test_case_pass_rate=pass_rate,
        plagiarism_alerts=plagiarism_alerts,
        feedback_received=feedback_received,
        marks_distribution=marks_distribution,
        performance_trends=performance_trends,
        difficulty_breakdown=difficulty_breakdown
    )


@router.get("/submissions")
def list_submissions(
    student_query: Optional[str] = None,
    assessment_id: Optional[int] = None,
    plagiarism_status: Optional[str] = None,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    query = db.query(AssessmentSubmission).filter(AssessmentSubmission.is_final_submitted == True)

    if assessment_id:
        query = query.filter(AssessmentSubmission.assessment_id == assessment_id)

    submissions = query.order_by(AssessmentSubmission.submitted_at.desc()).all()

    result = []
    for s in submissions:
        student = db.query(User).filter(User.id == s.student_id).first()
        assessment = db.query(Assessment).filter(Assessment.id == s.assessment_id).first()

        if student_query:
            sq = student_query.lower()
            if not (sq in (student.full_name or "").lower() or sq in (student.student_id or "").lower()):
                continue

        if plagiarism_status and plagiarism_status != "all":
            if s.plagiarism_status.lower() != plagiarism_status.lower():
                continue

        feedback = db.query(Feedback).filter(
            Feedback.assessment_id == s.assessment_id,
            Feedback.student_id == s.student_id
        ).first()

        # Count passed test cases
        passed_tc = sum(1 for tc in (s.coding_test_results or []) if tc.get("passed"))
        total_tc = len(s.coding_test_results or [])

        result.append({
            "id": s.id,
            "student_id": s.student_id,
            "student_name": student.full_name if student else "Unknown",
            "student_roll": student.student_id if student else "N/A",
            "student_email": student.email if student else "N/A",
            "assessment_id": s.assessment_id,
            "assessment_title": assessment.title if assessment else "Unknown",
            "submission_date": s.submitted_at,
            "coding_marks": s.coding_score or 0.0,
            "viva_marks": s.viva_score or 0.0,
            "debugging_marks": s.debugging_score or 0.0,
            "total_marks": s.total_score or 0.0,
            "test_cases_passed": f"{passed_tc}/{total_tc}",
            "plagiarism_score": s.plagiarism_score or 0.0,
            "plagiarism_status": s.plagiarism_status or "Clean",
            "feedback_status": "Received" if feedback else "Pending",
            "faculty_reviewed": s.faculty_reviewed,
            "marks_published": s.marks_published
        })

    return result


@router.get("/submission/{submission_id}")
def get_submission_detail(
    submission_id: int,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    submission = db.query(AssessmentSubmission).filter(AssessmentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    student = db.query(User).filter(User.id == submission.student_id).first()
    assessment = db.query(Assessment).filter(Assessment.id == submission.assessment_id).first()

    # Viva Questions with details
    viva_items = []
    answers_map = {va.question_id: va for va in submission.viva_answers}
    for q in assessment.viva_questions:
        va = answers_map.get(q.id)
        viva_items.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "points": q.points,
            "student_answer": va.student_answer if va else "No Answer",
            "is_correct": va.is_correct if va else False,
            "score_awarded": va.score_awarded if va else 0.0,
            "faculty_comment": va.faculty_comment if va else None
        })

    # Debugging problem details
    dbg_problem = assessment.debugging_problems[0] if assessment.debugging_problems else None

    # Feedback
    feedback = db.query(Feedback).filter(
        Feedback.assessment_id == submission.assessment_id,
        Feedback.student_id == submission.student_id
    ).first()

    # Plagiarism reports
    plagiarism_reports = db.query(PlagiarismReport).filter(
        PlagiarismReport.submission_id == submission.id
    ).all()

    reports_data = []
    for r in plagiarism_reports:
        reports_data.append({
            "id": r.id,
            "compared_submission_id": r.compared_with_submission_id,
            "compared_student_name": r.compared_student_name,
            "similarity_score": r.similarity_score,
            "matched_tokens_count": r.matched_tokens_count,
            "matched_snippets": r.matched_snippets,
            "explanation": r.explanation,
            "status": r.status,
            "notes": r.notes
        })

    return {
        "submission_id": submission.id,
        "assessment_id": assessment.id,
        "assessment_title": assessment.title,
        "difficulty": assessment.difficulty,
        "max_marks": assessment.max_marks,
        "submitted_at": submission.submitted_at,
        
        # Student info
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "email": student.email,
            "student_id": student.student_id,
            "department": student.department
        },

        # Section 1 Coding Evaluation
        "coding_evaluation": {
            "source_code": submission.coding_code,
            "language": submission.coding_language,
            "score": submission.coding_score,
            "max_score": assessment.section_marks_coding,
            "test_results": submission.coding_test_results or []
        },

        # Section 2 Viva Evaluation
        "viva_evaluation": {
            "score": submission.viva_score,
            "max_score": assessment.section_marks_viva,
            "questions": viva_items
        },

        # Section 3 Debugging Evaluation
        "debugging_evaluation": {
            "faulty_code": dbg_problem.faulty_code if dbg_problem else "",
            "corrected_code": submission.debugging_code,
            "language": submission.debugging_language,
            "score": submission.debugging_score,
            "max_score": assessment.section_marks_debugging,
            "test_results": submission.debugging_test_results or []
        },

        # Plagiarism Analysis
        "plagiarism": {
            "similarity_score": submission.plagiarism_score,
            "status": submission.plagiarism_status,
            "reports": reports_data
        },

        # Feedback
        "feedback": {
            "overall_rating": feedback.overall_rating if feedback else None,
            "coding_clarity_rating": feedback.coding_clarity_rating if feedback else None,
            "editor_rating": feedback.editor_rating if feedback else None,
            "viva_relevance_rating": feedback.viva_relevance_rating if feedback else None,
            "debugging_rating": feedback.debugging_rating if feedback else None,
            "suggestions": feedback.suggestions if feedback else None,
            "additional_comments": feedback.additional_comments if feedback else None,
            "submitted_at": feedback.created_at if feedback else None
        } if feedback else None,

        # Faculty Controls State
        "faculty_review": {
            "reviewed": submission.faculty_reviewed,
            "notes": submission.faculty_notes,
            "feedback": submission.faculty_feedback,
            "manual_adjustment": submission.manual_score_adjustment,
            "adjustment_reason": submission.adjustment_reason,
            "marks_published": submission.marks_published,
            "total_score": submission.total_score
        }
    }


@router.post("/review")
def review_submission(
    payload: FacultyReviewRequest,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    submission = db.query(AssessmentSubmission).filter(AssessmentSubmission.id == payload.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    submission.faculty_notes = payload.faculty_notes
    submission.faculty_feedback = payload.faculty_feedback
    submission.manual_score_adjustment = payload.manual_score_adjustment or 0.0
    submission.adjustment_reason = payload.adjustment_reason
    
    if payload.plagiarism_status:
        submission.plagiarism_status = payload.plagiarism_status

    if payload.mark_as_reviewed:
        submission.faculty_reviewed = True

    # Recalculate total with adjustment
    base_score = (submission.coding_score or 0.0) + (submission.viva_score or 0.0) + (submission.debugging_score or 0.0)
    submission.total_score = max(0.0, round(base_score + submission.manual_score_adjustment, 2))

    db.commit()

    return {
        "message": "Evaluation review saved successfully.",
        "total_score": submission.total_score,
        "faculty_reviewed": submission.faculty_reviewed
    }


@router.post("/publish")
def publish_marks(
    payload: PublishMarksRequest,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    submission = db.query(AssessmentSubmission).filter(AssessmentSubmission.id == payload.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    submission.marks_published = payload.publish
    db.commit()

    return {
        "message": f"Marks {'published' if payload.publish else 'unpublished'} successfully.",
        "marks_published": submission.marks_published
    }


# --- Problem Management ---

@router.get("/assessments", response_model=List[AssessmentDetailResponse])
def list_assessments(
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    assessments = db.query(Assessment).order_by(Assessment.created_at.desc()).all()
    return assessments


@router.post("/assessments", response_model=AssessmentDetailResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    payload: AssessmentCreate,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    assessment = Assessment(
        title=payload.title,
        problem_statement=payload.problem_statement,
        problem_description=payload.problem_description,
        difficulty=payload.difficulty,
        input_format=payload.input_format,
        output_format=payload.output_format,
        constraints=payload.constraints,
        sample_input=payload.sample_input,
        sample_output=payload.sample_output,
        allowed_languages=payload.allowed_languages,
        max_marks=payload.max_marks,
        section_marks_coding=payload.section_marks_coding,
        section_marks_viva=payload.section_marks_viva,
        section_marks_debugging=payload.section_marks_debugging,
        time_limit_sec=payload.time_limit_sec,
        memory_limit_mb=payload.memory_limit_mb,
        deadline=payload.deadline,
        instructions=payload.instructions,
        is_published=payload.is_published,
        version=1,
        created_by_faculty_id=current_user.id
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Add Test Cases
    for tc in payload.test_cases:
        test_case = TestCase(
            assessment_id=assessment.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            is_hidden=tc.is_hidden,
            points=tc.points,
            explanation=tc.explanation
        )
        db.add(test_case)

    # Add Viva Questions
    for vq in payload.viva_questions:
        viva_q = VivaQuestion(
            assessment_id=assessment.id,
            question_text=vq.question_text,
            question_type=vq.question_type,
            options=vq.options,
            correct_answer=vq.correct_answer,
            explanation=vq.explanation,
            points=vq.points,
            category=vq.category
        )
        db.add(viva_q)

    # Add Debugging Problems
    for dp in payload.debugging_problems:
        dbg = DebuggingProblem(
            assessment_id=assessment.id,
            title=dp.title,
            description=dp.description,
            faulty_code=dp.faulty_code,
            language=dp.language,
            expected_behavior=dp.expected_behavior,
            test_cases=dp.test_cases,
            points=dp.points
        )
        db.add(dbg)

    # Auto assign to all students if selected
    if payload.assign_all_students:
        students = db.query(User).filter(User.role == "student").all()
        for s in students:
            assignment = AssessmentAssignment(assessment_id=assessment.id, student_id=s.id)
            db.add(assignment)

    db.commit()
    db.refresh(assessment)
    return assessment


@router.put("/assessments/{assessment_id}", response_model=AssessmentDetailResponse)
def update_assessment(
    assessment_id: int,
    payload: AssessmentUpdate,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(assessment, field, val)

    assessment.version += 1
    assessment.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(assessment)
    return assessment


@router.post("/assessments/{assessment_id}/publish")
def toggle_publish_assessment(
    assessment_id: int,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    assessment.is_published = not assessment.is_published
    db.commit()

    return {
        "assessment_id": assessment.id,
        "is_published": assessment.is_published,
        "message": f"Assessment '{assessment.title}' is now {'Published' if assessment.is_published else 'Unpublished'}."
    }


@router.delete("/assessments/{assessment_id}")
def delete_assessment(
    assessment_id: int,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    db.delete(assessment)
    db.commit()

    return {"message": f"Assessment #{assessment_id} deleted successfully."}
