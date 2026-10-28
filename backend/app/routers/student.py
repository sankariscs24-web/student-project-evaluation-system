import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models import (
    User, Assessment, AssessmentAssignment, AssessmentSubmission,
    TestCase, VivaQuestion, VivaAnswer, DebuggingProblem, Feedback, PlagiarismReport
)
from app.schemas import (
    StudentDashboardStats, AssessmentListItem, StudentAssessmentWorkspaceResponse,
    CodeExecutionRequest, CodeExecutionResponse, SaveCodingSectionRequest,
    SaveVivaSectionRequest, SaveDebuggingSectionRequest, FinalSubmitResponse,
    FeedbackCreate, FeedbackResponse
)
from app.auth import get_current_user, require_student
from app.execution.runner import run_code_against_test_cases
from app.plagiarism.detector import calculate_similarity

router = APIRouter(prefix="/student", tags=["Student"])

@router.get("/dashboard", response_model=StudentDashboardStats)
def get_student_dashboard(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    # Find all assessments assigned to student or published globally
    assignments = db.query(AssessmentAssignment).filter(
        AssessmentAssignment.student_id == current_user.id
    ).all()
    assigned_ids = [a.assessment_id for a in assignments]

    # Also include published assessments
    assessments = db.query(Assessment).filter(
        (Assessment.id.in_(assigned_ids)) | (Assessment.is_published == True)
    ).all()

    assessment_items = []
    completed_count = 0
    scores = []

    for a in assessments:
        submission = db.query(AssessmentSubmission).filter(
            AssessmentSubmission.assessment_id == a.id,
            AssessmentSubmission.student_id == current_user.id
        ).first()

        status_str = "Pending"
        my_score = None
        marks_published = False

        if submission:
            if submission.is_final_submitted:
                status_str = "Submitted"
                completed_count += 1
                if submission.marks_published:
                    status_str = "Graded"
                    my_score = submission.total_score
                    marks_published = True
                    scores.append(my_score)
            else:
                status_str = "In Progress"

        assessment_items.append(AssessmentListItem(
            id=a.id,
            title=a.title,
            difficulty=a.difficulty,
            max_marks=a.max_marks,
            deadline=a.deadline,
            is_published=a.is_published,
            version=a.version,
            created_at=a.created_at,
            submission_status=status_str,
            my_score=my_score,
            marks_published=marks_published
        ))

    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    return StudentDashboardStats(
        student_name=current_user.full_name,
        email=current_user.email,
        student_id=current_user.student_id,
        total_assigned=len(assessments),
        completed_count=completed_count,
        pending_count=len(assessments) - completed_count,
        average_score=avg_score,
        assessments=assessment_items
    )


@router.get("/assessment/{assessment_id}", response_model=StudentAssessmentWorkspaceResponse)
def get_assessment_workspace(
    assessment_id: int,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    # Get or create submission record for draft state
    submission = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == assessment_id,
        AssessmentSubmission.student_id == current_user.id
    ).first()

    if not submission:
        submission = AssessmentSubmission(
            assessment_id=assessment_id,
            student_id=current_user.id,
            status="in_progress"
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

    # Format test cases: hide input & output for hidden test cases
    visible_test_cases = []
    for idx, tc in enumerate(assessment.test_cases, 1):
        visible_test_cases.append({
            "id": tc.id,
            "test_case_num": idx,
            "input_data": None if tc.is_hidden else tc.input_data,
            "expected_output": None if tc.is_hidden else tc.expected_output,
            "is_hidden": tc.is_hidden,
            "points": tc.points
        })

    # Format viva questions: hide correct_answer
    viva_list = []
    for vq in assessment.viva_questions:
        viva_list.append({
            "id": vq.id,
            "assessment_id": vq.assessment_id,
            "question_text": vq.question_text,
            "question_type": vq.question_type,
            "options": vq.options,
            "points": vq.points,
            "category": vq.category
        })

    # Saved viva answers
    viva_answers_map = {}
    for va in submission.viva_answers:
        viva_answers_map[va.question_id] = va.student_answer

    # Debugging problem
    dbg_problem = assessment.debugging_problems[0] if assessment.debugging_problems else None

    # Check feedback
    feedback = db.query(Feedback).filter(
        Feedback.assessment_id == assessment_id,
        Feedback.student_id == current_user.id
    ).first()

    return StudentAssessmentWorkspaceResponse(
        assessment=assessment,
        assessment_id=assessment.id,
        deadline=assessment.deadline,
        test_cases=visible_test_cases,
        viva_questions=viva_list,
        debugging_problem=dbg_problem,
        saved_code=submission.coding_code or "",
        saved_language=submission.coding_language or "python",
        coding_test_results=submission.coding_test_results or [],
        viva_answers=viva_answers_map,
        saved_debugging_code=submission.debugging_code or (dbg_problem.faulty_code if dbg_problem else ""),
        saved_debugging_language=submission.debugging_language or (dbg_problem.language if dbg_problem else "python"),
        debugging_test_results=submission.debugging_test_results or [],
        section1_completed=submission.section1_completed,
        section2_completed=submission.section2_completed,
        section3_completed=submission.section3_completed,
        is_final_submitted=submission.is_final_submitted,
        feedback_submitted=bool(feedback),
        marks_published=submission.marks_published,
        total_score=submission.total_score if submission.marks_published else None
    )


@router.post("/run-code", response_model=CodeExecutionResponse)
def run_code(
    payload: CodeExecutionRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == payload.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    test_case_dicts = [
        {
            "id": tc.id,
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "is_hidden": tc.is_hidden,
            "points": tc.points
        }
        for tc in assessment.test_cases
    ]

    exec_result = run_code_against_test_cases(
        code=payload.source_code,
        language=payload.language,
        test_cases=test_case_dicts,
        timeout_sec=assessment.time_limit_sec or 5,
        is_faculty_view=False
    )

    # Scale score to section_marks_coding if needed
    raw_score = exec_result.get("score", 0.0)
    total_tc_points = sum(tc.points for tc in assessment.test_cases) or 1.0
    scaled_coding_score = round((raw_score / total_tc_points) * assessment.section_marks_coding, 2)
    exec_result["score"] = scaled_coding_score

    # Save to current draft
    submission = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == payload.assessment_id,
        AssessmentSubmission.student_id == current_user.id
    ).first()

    if submission and not submission.is_final_submitted:
        submission.coding_code = payload.source_code
        submission.coding_language = payload.language
        submission.coding_score = scaled_coding_score
        submission.coding_test_results = exec_result["test_results"]
        # Required coding attempt completed
        submission.section1_completed = True
        db.commit()

    return exec_result


@router.post("/save-coding")
def save_coding_section(
    payload: SaveCodingSectionRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    submission = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == payload.assessment_id,
        AssessmentSubmission.student_id == current_user.id
    ).first()

    if not submission:
        submission = AssessmentSubmission(
            assessment_id=payload.assessment_id,
            student_id=current_user.id
        )
        db.add(submission)

    if submission.is_final_submitted:
        raise HTTPException(status_code=400, detail="Assessment has already been submitted and is locked.")

    submission.coding_code = payload.source_code
    submission.coding_language = payload.language
    submission.section1_completed = len(payload.source_code.strip()) > 10
    db.commit()

    return {"message": "Coding section draft saved successfully.", "section1_completed": submission.section1_completed}


@router.post("/save-viva")
def save_viva_section(
    payload: SaveVivaSectionRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == payload.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    submission = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == payload.assessment_id,
        AssessmentSubmission.student_id == current_user.id
    ).first()

    if not submission:
        submission = AssessmentSubmission(
            assessment_id=payload.assessment_id,
            student_id=current_user.id
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

    if submission.is_final_submitted:
        raise HTTPException(status_code=400, detail="Assessment has already been submitted and is locked.")

    # Map question IDs to objects
    question_map = {q.id: q for q in assessment.viva_questions}
    total_viva_points = sum(q.points for q in assessment.viva_questions) or 1.0

    raw_viva_score = 0.0
    for item in payload.answers:
        q = question_map.get(item.question_id)
        if not q:
            continue

        student_ans = item.answer.strip()
        is_correct = False
        score_awarded = 0.0

        if q.question_type == "mcq":
            is_correct = (student_ans.lower() == q.correct_answer.strip().lower())
            score_awarded = q.points if is_correct else 0.0
        else:
            # Short answer automated evaluation based on key concepts
            expected_keywords = [k.strip().lower() for k in q.correct_answer.split(",") if k.strip()]
            if expected_keywords:
                matched = sum(1 for kw in expected_keywords if kw in student_ans.lower())
                fraction = matched / len(expected_keywords)
                score_awarded = round(q.points * fraction, 2)
                is_correct = fraction >= 0.5
            else:
                is_correct = len(student_ans) > 5
                score_awarded = q.points * 0.7 if is_correct else 0.0

        raw_viva_score += score_awarded

        # Update or create VivaAnswer
        existing_answer = db.query(VivaAnswer).filter(
            VivaAnswer.submission_id == submission.id,
            VivaAnswer.question_id == item.question_id
        ).first()

        if existing_answer:
            existing_answer.student_answer = student_ans
            existing_answer.is_correct = is_correct
            existing_answer.score_awarded = score_awarded
        else:
            new_ans = VivaAnswer(
                submission_id=submission.id,
                question_id=item.question_id,
                student_answer=student_ans,
                is_correct=is_correct,
                score_awarded=score_awarded
            )
            db.add(new_ans)

    scaled_viva_score = round((raw_viva_score / total_viva_points) * assessment.section_marks_viva, 2)
    submission.viva_score = scaled_viva_score

    # Check if all mandatory questions are answered
    answered_count = len([a for a in payload.answers if a.answer.strip()])
    submission.section2_completed = (answered_count >= len(assessment.viva_questions) and len(assessment.viva_questions) > 0)

    db.commit()

    return {
        "message": "Viva answers saved successfully.",
        "viva_score": scaled_viva_score,
        "section2_completed": submission.section2_completed,
        "answered_count": answered_count,
        "total_questions": len(assessment.viva_questions)
    }


@router.post("/run-debugging", response_model=CodeExecutionResponse)
def run_debugging_code(
    payload: CodeExecutionRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == payload.assessment_id).first()
    if not assessment or not assessment.debugging_problems:
        raise HTTPException(status_code=404, detail="Debugging problem not found.")

    dbg_problem = assessment.debugging_problems[0]
    raw_test_cases = dbg_problem.test_cases or []

    formatted_test_cases = [
        {
            "id": idx,
            "input_data": str(tc.get("input", "")),
            "expected_output": str(tc.get("expected", "")),
            "is_hidden": False,
            "points": round(dbg_problem.points / max(1, len(raw_test_cases)), 2)
        }
        for idx, tc in enumerate(raw_test_cases, 1)
    ]

    exec_result = run_code_against_test_cases(
        code=payload.source_code,
        language=payload.language or dbg_problem.language,
        test_cases=formatted_test_cases,
        timeout_sec=assessment.time_limit_sec or 5,
        is_faculty_view=False
    )

    # Scale score to section_marks_debugging
    raw_score = exec_result.get("score", 0.0)
    total_dbg_points = dbg_problem.points or 1.0
    scaled_dbg_score = round((raw_score / total_dbg_points) * assessment.section_marks_debugging, 2)
    exec_result["score"] = scaled_dbg_score

    submission = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == payload.assessment_id,
        AssessmentSubmission.student_id == current_user.id
    ).first()

    if submission and not submission.is_final_submitted:
        submission.debugging_code = payload.source_code
        submission.debugging_language = payload.language
        submission.debugging_score = scaled_dbg_score
        submission.debugging_test_results = exec_result["test_results"]
        submission.section3_completed = True
        db.commit()

    return exec_result


@router.post("/save-debugging")
def save_debugging_section(
    payload: SaveDebuggingSectionRequest,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    submission = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == payload.assessment_id,
        AssessmentSubmission.student_id == current_user.id
    ).first()

    if not submission:
        submission = AssessmentSubmission(
            assessment_id=payload.assessment_id,
            student_id=current_user.id
        )
        db.add(submission)

    if submission.is_final_submitted:
        raise HTTPException(status_code=400, detail="Assessment has already been submitted and is locked.")

    submission.debugging_code = payload.debugging_code
    submission.debugging_language = payload.language
    submission.section3_completed = len(payload.debugging_code.strip()) > 10
    db.commit()

    return {"message": "Debugging section draft saved.", "section3_completed": submission.section3_completed}


@router.post("/final-submit", response_model=FinalSubmitResponse)
def final_submit_assessment(
    assessment_id: int,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    submission = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == assessment_id,
        AssessmentSubmission.student_id == current_user.id
    ).first()

    if not submission:
        raise HTTPException(status_code=400, detail="No submission draft found.")

    if submission.is_final_submitted:
        raise HTTPException(status_code=400, detail="Assessment has already been submitted.")

    # Strict Completion Rules
    if not submission.section1_completed:
        raise HTTPException(status_code=400, detail="Section 1 (Coding Challenge) must be completed before final submission.")
    if not submission.section2_completed:
        raise HTTPException(status_code=400, detail="Section 2 (Viva & Fundamentals) must be answered completely before final submission.")
    if not submission.section3_completed:
        raise HTTPException(status_code=400, detail="Section 3 (Code Debugging) must be executed before final submission.")

    # Calculate total automated score
    total_score = round(
        (submission.coding_score or 0.0) +
        (submission.viva_score or 0.0) +
        (submission.debugging_score or 0.0),
        2
    )

    submission.total_score = total_score
    submission.is_final_submitted = True
    submission.status = "submitted"
    submission.submitted_at = datetime.datetime.utcnow()

    # --- Real Plagiarism Analysis ---
    # Compare with existing submissions for this assessment
    other_submissions = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == assessment_id,
        AssessmentSubmission.student_id != current_user.id,
        AssessmentSubmission.coding_code.isnot(None),
        AssessmentSubmission.coding_code != ""
    ).all()

    max_sim_score = 0.0
    highest_sim_status = "Clean"

    for other_sub in other_submissions:
        sim_res = calculate_similarity(
            code1=submission.coding_code,
            code2=other_sub.coding_code,
            language1=submission.coding_language,
            language2=other_sub.coding_language
        )
        sim_score = sim_res["similarity_score"]
        if sim_score > max_sim_score:
            max_sim_score = sim_score
            highest_sim_status = sim_res["status"]

        other_user = db.query(User).filter(User.id == other_sub.student_id).first()
        other_name = other_user.full_name if other_user else f"Student #{other_sub.student_id}"

        # Record plagiarism report
        report = PlagiarismReport(
            assessment_id=assessment_id,
            submission_id=submission.id,
            compared_with_submission_id=other_sub.id,
            compared_student_name=other_name,
            similarity_score=sim_score,
            matched_tokens_count=sim_res["matched_tokens_count"],
            matched_snippets=sim_res["matched_snippets"],
            explanation=sim_res["explanation"],
            status=sim_res["status"]
        )
        db.add(report)

    submission.plagiarism_score = max_sim_score
    submission.plagiarism_status = highest_sim_status

    db.commit()

    return FinalSubmitResponse(
        message="Assessment successfully submitted and locked. Plagiarism analysis and grading complete.",
        submission_id=submission.id,
        total_score=total_score,
        plagiarism_score=max_sim_score,
        plagiarism_status=highest_sim_status
    )


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(
    payload: FeedbackCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    submission = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == payload.assessment_id,
        AssessmentSubmission.student_id == current_user.id
    ).first()

    if not submission or not submission.is_final_submitted:
        raise HTTPException(
            status_code=400,
            detail="You must complete and submit the assessment before submitting feedback."
        )

    # Prevent duplicate feedback
    existing = db.query(Feedback).filter(
        Feedback.assessment_id == payload.assessment_id,
        Feedback.student_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Feedback has already been submitted for this assessment."
        )

    feedback = Feedback(
        assessment_id=payload.assessment_id,
        student_id=current_user.id,
        overall_rating=payload.overall_rating,
        coding_clarity_rating=payload.coding_clarity_rating,
        editor_rating=payload.editor_rating,
        viva_relevance_rating=payload.viva_relevance_rating,
        debugging_rating=payload.debugging_rating,
        suggestions=payload.suggestions,
        additional_comments=payload.additional_comments
    )
    db.add(feedback)
    submission.feedback_submitted = True
    db.commit()
    db.refresh(feedback)

    return feedback
