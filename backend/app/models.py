import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # "student" or "faculty"
    student_id = Column(String(50), nullable=True, unique=True, index=True) # for students e.g. "STU202601"
    department = Column(String(100), default="Computer Science & Engineering")
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    created_assessments = relationship("Assessment", back_populates="creator", foreign_keys="Assessment.created_by_faculty_id")
    assignments = relationship("AssessmentAssignment", back_populates="student", foreign_keys="AssessmentAssignment.student_id")
    submissions = relationship("AssessmentSubmission", back_populates="student", foreign_keys="AssessmentSubmission.student_id")
    feedbacks = relationship("Feedback", back_populates="student", foreign_keys="Feedback.student_id")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    problem_statement = Column(Text, nullable=False)
    problem_description = Column(Text, nullable=False)
    difficulty = Column(String(50), default="Medium")  # Easy, Medium, Hard
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    sample_input = Column(Text, nullable=True)
    sample_output = Column(Text, nullable=True)
    allowed_languages = Column(JSON, default=lambda: ["python", "c", "cpp", "java"])
    
    max_marks = Column(Float, default=100.0)
    section_marks_coding = Column(Float, default=50.0)
    section_marks_viva = Column(Float, default=25.0)
    section_marks_debugging = Column(Float, default=25.0)
    
    time_limit_sec = Column(Integer, default=5)
    memory_limit_mb = Column(Integer, default=256)
    deadline = Column(DateTime, nullable=True)
    instructions = Column(Text, nullable=True)
    
    is_published = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    created_by_faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="created_assessments", foreign_keys=[created_by_faculty_id])
    test_cases = relationship("TestCase", back_populates="assessment", cascade="all, delete-orphan")
    viva_questions = relationship("VivaQuestion", back_populates="assessment", cascade="all, delete-orphan")
    debugging_problems = relationship("DebuggingProblem", back_populates="assessment", cascade="all, delete-orphan")
    assignments = relationship("AssessmentAssignment", back_populates="assessment", cascade="all, delete-orphan")
    submissions = relationship("AssessmentSubmission", back_populates="assessment", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="assessment", cascade="all, delete-orphan")
    plagiarism_reports = relationship("PlagiarismReport", back_populates="assessment", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False)
    points = Column(Float, default=10.0)
    explanation = Column(Text, nullable=True)

    assessment = relationship("Assessment", back_populates="test_cases")


class VivaQuestion(Base):
    __tablename__ = "viva_questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="mcq")  # "mcq" or "short_answer"
    options = Column(JSON, nullable=True)  # List of string options for MCQ
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    points = Column(Float, default=5.0)
    category = Column(String(100), default="Programming Fundamentals")

    assessment = relationship("Assessment", back_populates="viva_questions")
    answers = relationship("VivaAnswer", back_populates="question", cascade="all, delete-orphan")


class DebuggingProblem(Base):
    __tablename__ = "debugging_problems"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    faulty_code = Column(Text, nullable=False)
    language = Column(String(50), default="python")
    expected_behavior = Column(Text, nullable=False)
    test_cases = Column(JSON, default=list)  # list of {"input": "...", "expected": "..."}
    points = Column(Float, default=25.0)

    assessment = relationship("Assessment", back_populates="debugging_problems")


class AssessmentAssignment(Base):
    __tablename__ = "assessment_assignments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="assignments")
    student = relationship("User", back_populates="assignments")


class AssessmentSubmission(Base):
    __tablename__ = "assessment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(String(50), default="in_progress")  # "in_progress", "submitted", "reviewed"
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)

    # Section 1: Coding
    coding_code = Column(Text, default="")
    coding_language = Column(String(50), default="python")
    coding_score = Column(Float, default=0.0)
    coding_test_results = Column(JSON, default=list)
    section1_completed = Column(Boolean, default=False)

    # Section 2: Viva
    viva_score = Column(Float, default=0.0)
    section2_completed = Column(Boolean, default=False)

    # Section 3: Debugging
    debugging_code = Column(Text, default="")
    debugging_language = Column(String(50), default="python")
    debugging_score = Column(Float, default=0.0)
    debugging_test_results = Column(JSON, default=list)
    section3_completed = Column(Boolean, default=False)

    # Aggregates & Final Submission
    is_final_submitted = Column(Boolean, default=False)
    total_score = Column(Float, default=0.0)
    feedback_submitted = Column(Boolean, default=False)

    # Plagiarism
    plagiarism_score = Column(Float, default=0.0)
    plagiarism_status = Column(String(50), default="Not Run")  # "Clean", "Suspicious", "Reviewed", "Not Run"

    # Faculty Review
    faculty_reviewed = Column(Boolean, default=False)
    faculty_notes = Column(Text, nullable=True)  # private notes
    faculty_feedback = Column(Text, nullable=True)  # feedback to student
    marks_published = Column(Boolean, default=False)
    manual_score_adjustment = Column(Float, default=0.0)
    adjustment_reason = Column(String(255), nullable=True)

    # Relationships
    assessment = relationship("Assessment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
    viva_answers = relationship("VivaAnswer", back_populates="submission", cascade="all, delete-orphan")
    plagiarism_reports = relationship("PlagiarismReport", back_populates="submission", foreign_keys="PlagiarismReport.submission_id", cascade="all, delete-orphan")


class VivaAnswer(Base):
    __tablename__ = "viva_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("assessment_submissions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("viva_questions.id", ondelete="CASCADE"), nullable=False)
    student_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    score_awarded = Column(Float, default=0.0)
    faculty_comment = Column(Text, nullable=True)

    submission = relationship("AssessmentSubmission", back_populates="viva_answers")
    question = relationship("VivaQuestion", back_populates="answers")


class PlagiarismReport(Base):
    __tablename__ = "plagiarism_reports"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    submission_id = Column(Integer, ForeignKey("assessment_submissions.id", ondelete="CASCADE"), nullable=False)
    compared_with_submission_id = Column(Integer, ForeignKey("assessment_submissions.id", ondelete="CASCADE"), nullable=True)
    compared_student_name = Column(String(255), nullable=True)
    similarity_score = Column(Float, default=0.0)
    matched_tokens_count = Column(Integer, default=0)
    matched_snippets = Column(JSON, default=list)  # list of matched code blocks/lines
    explanation = Column(Text, nullable=True)
    status = Column(String(50), default="Pending Review")  # "Clean", "Suspicious", "Reviewed", "No Concern"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="plagiarism_reports")
    submission = relationship("AssessmentSubmission", back_populates="plagiarism_reports", foreign_keys=[submission_id])


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    overall_rating = Column(Integer, nullable=False)       # 1-5
    coding_clarity_rating = Column(Integer, nullable=False) # 1-5
    editor_rating = Column(Integer, nullable=False)        # 1-5
    viva_relevance_rating = Column(Integer, nullable=False) # 1-5
    debugging_rating = Column(Integer, nullable=False)     # 1-5
    suggestions = Column(Text, nullable=True)
    additional_comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="feedbacks")
    student = relationship("User", back_populates="feedbacks")
