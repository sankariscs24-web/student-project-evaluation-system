from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models import User, Assessment, AssessmentSubmission, PlagiarismReport
from app.auth import require_faculty
from app.plagiarism.detector import calculate_similarity

router = APIRouter(prefix="/faculty/plagiarism", tags=["Plagiarism Analysis"])

@router.post("/run/{assessment_id}")
def run_assessment_plagiarism_analysis(
    assessment_id: int,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    submissions = db.query(AssessmentSubmission).filter(
        AssessmentSubmission.assessment_id == assessment_id,
        AssessmentSubmission.coding_code.isnot(None),
        AssessmentSubmission.coding_code != ""
    ).all()

    if len(submissions) < 2:
        return {
            "message": "At least 2 submissions are required to run pairwise plagiarism comparison.",
            "comparisons_run": 0,
            "suspicious_found": 0
        }

    # Clear old reports for this assessment
    db.query(PlagiarismReport).filter(PlagiarismReport.assessment_id == assessment_id).delete()

    comparisons_count = 0
    suspicious_count = 0

    for i in range(len(submissions)):
        sub_a = submissions[i]
        user_a = db.query(User).filter(User.id == sub_a.student_id).first()
        max_sim = 0.0
        max_status = "Clean"

        for j in range(len(submissions)):
            if i == j:
                continue
            sub_b = submissions[j]
            user_b = db.query(User).filter(User.id == sub_b.student_id).first()

            sim_result = calculate_similarity(
                code1=sub_a.coding_code,
                code2=sub_b.coding_code,
                language1=sub_a.coding_language,
                language2=sub_b.coding_language
            )
            comparisons_count += 1

            if sim_result["similarity_score"] > max_sim:
                max_sim = sim_result["similarity_score"]
                max_status = sim_result["status"]

            if sim_result["similarity_score"] >= 40.0:  # Save significant comparisons
                report = PlagiarismReport(
                    assessment_id=assessment_id,
                    submission_id=sub_a.id,
                    compared_with_submission_id=sub_b.id,
                    compared_student_name=user_b.full_name if user_b else f"Student #{sub_b.student_id}",
                    similarity_score=sim_result["similarity_score"],
                    matched_tokens_count=sim_result["matched_tokens_count"],
                    matched_snippets=sim_result["matched_snippets"],
                    explanation=sim_result["explanation"],
                    status=sim_result["status"]
                )
                db.add(report)

        sub_a.plagiarism_score = max_sim
        sub_a.plagiarism_status = max_status
        if max_sim >= 60.0:
            suspicious_count += 1

    db.commit()

    return {
        "message": f"Pairwise plagiarism analysis completed for {len(submissions)} submissions.",
        "comparisons_run": comparisons_count,
        "suspicious_found": suspicious_count
    }


@router.get("/reports/{assessment_id}")
def get_assessment_plagiarism_reports(
    assessment_id: int,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    reports = db.query(PlagiarismReport).filter(PlagiarismReport.assessment_id == assessment_id).all()
    results = []
    for r in reports:
        sub = db.query(AssessmentSubmission).filter(AssessmentSubmission.id == r.submission_id).first()
        student = db.query(User).filter(User.id == sub.student_id).first() if sub else None
        results.append({
            "id": r.id,
            "submission_id": r.submission_id,
            "student_name": student.full_name if student else "Unknown",
            "compared_student_name": r.compared_student_name,
            "similarity_score": r.similarity_score,
            "matched_tokens_count": r.matched_tokens_count,
            "matched_snippets": r.matched_snippets,
            "explanation": r.explanation,
            "status": r.status,
            "created_at": r.created_at
        })
    return results
