from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Auth & User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str  # "student" or "faculty"
    student_id: Optional[str] = None
    department: Optional[str] = "Computer Science & Engineering"

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


# --- Test Case Schemas ---
class TestCaseBase(BaseModel):
    input_data: str
    expected_output: str
    is_hidden: bool = False
    points: float = 10.0
    explanation: Optional[str] = None

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseResponse(TestCaseBase):
    id: int
    assessment_id: int

    model_config = ConfigDict(from_attributes=True)

class TestCaseStudentView(BaseModel):
    id: int
    test_case_num: int
    input_data: Optional[str] = None  # None if hidden
    expected_output: Optional[str] = None  # None if hidden
    is_hidden: bool
    points: float

    model_config = ConfigDict(from_attributes=True)


# --- Viva Question Schemas ---
class VivaQuestionBase(BaseModel):
    question_text: str
    question_type: str = "mcq"  # "mcq" or "short_answer"
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    points: float = 5.0
    category: str = "Programming Fundamentals"

class VivaQuestionCreate(VivaQuestionBase):
    pass

class VivaQuestionResponse(VivaQuestionBase):
    id: int
    assessment_id: int

    model_config = ConfigDict(from_attributes=True)

class VivaQuestionStudentView(BaseModel):
    id: int
    assessment_id: int
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    points: float
    category: str

    model_config = ConfigDict(from_attributes=True)


# --- Debugging Problem Schemas ---
class DebuggingProblemBase(BaseModel):
    title: str
    description: str
    faulty_code: str
    language: str = "python"
    expected_behavior: str
    test_cases: List[Dict[str, Any]] = []
    points: float = 25.0

class DebuggingProblemCreate(DebuggingProblemBase):
    pass

class DebuggingProblemResponse(DebuggingProblemBase):
    id: int
    assessment_id: int

    model_config = ConfigDict(from_attributes=True)


# --- Assessment Schemas ---
class AssessmentBase(BaseModel):
    title: str
    problem_statement: str
    problem_description: str
    difficulty: str = "Medium"
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    allowed_languages: List[str] = ["python", "c", "cpp", "java"]
    max_marks: float = 100.0
    section_marks_coding: float = 50.0
    section_marks_viva: float = 25.0
    section_marks_debugging: float = 25.0
    time_limit_sec: int = 5
    memory_limit_mb: int = 256
    deadline: Optional[datetime] = None
    instructions: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AssessmentCreate(AssessmentBase):
    test_cases: List[TestCaseCreate] = []
    viva_questions: List[VivaQuestionCreate] = []
    debugging_problems: List[DebuggingProblemCreate] = []
    is_published: bool = True
    assign_all_students: bool = True

class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    problem_statement: Optional[str] = None
    problem_description: Optional[str] = None
    difficulty: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    allowed_languages: Optional[List[str]] = None
    max_marks: Optional[float] = None
    section_marks_coding: Optional[float] = None
    section_marks_viva: Optional[float] = None
    section_marks_debugging: Optional[float] = None
    deadline: Optional[datetime] = None
    instructions: Optional[str] = None
    is_published: Optional[bool] = None

class AssessmentListItem(BaseModel):
    id: int
    title: str
    difficulty: str
    max_marks: float
    deadline: Optional[datetime] = None
    is_published: bool
    version: int
    created_at: datetime
    submission_status: Optional[str] = "Pending"
    my_score: Optional[float] = None
    marks_published: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

class AssessmentDetailResponse(AssessmentBase):
    id: int
    is_published: bool
    version: int
    created_at: datetime
    test_cases: List[TestCaseResponse] = []
    viva_questions: List[VivaQuestionResponse] = []
    debugging_problems: List[DebuggingProblemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class StudentAssessmentWorkspaceResponse(BaseModel):
    assessment: AssessmentBase
    assessment_id: int
    deadline: Optional[datetime] = None
    test_cases: List[TestCaseStudentView] = []
    viva_questions: List[VivaQuestionStudentView] = []
    debugging_problem: Optional[DebuggingProblemResponse] = None
    
    # Existing progress
    saved_code: Optional[str] = ""
    saved_language: Optional[str] = "python"
    coding_test_results: List[Dict[str, Any]] = []
    viva_answers: Dict[int, str] = {}
    saved_debugging_code: Optional[str] = ""
    saved_debugging_language: Optional[str] = "python"
    debugging_test_results: List[Dict[str, Any]] = []
    
    section1_completed: bool = False
    section2_completed: bool = False
    section3_completed: bool = False
    is_final_submitted: bool = False
    feedback_submitted: bool = False
    marks_published: bool = False
    total_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# --- Execution Schemas ---
class CodeExecutionRequest(BaseModel):
    assessment_id: int
    source_code: str
    language: str
    custom_input: Optional[str] = None
    run_test_cases: bool = True

class TestCaseExecutionResult(BaseModel):
    test_case_id: int
    test_case_num: int
    is_hidden: bool
    passed: bool
    input_data: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    execution_time: float
    error: Optional[str] = None
    points_awarded: float = 0.0

class CodeExecutionResponse(BaseModel):
    success: bool
    language: str
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_error: Optional[str] = None
    execution_time: float
    passed_cases: int = 0
    total_cases: int = 0
    test_results: List[TestCaseExecutionResult] = []
    score: float = 0.0


# --- Section Submissions ---
class SaveCodingSectionRequest(BaseModel):
    assessment_id: int
    source_code: str
    language: str

class VivaAnswerItem(BaseModel):
    question_id: int
    answer: str

class SaveVivaSectionRequest(BaseModel):
    assessment_id: int
    answers: List[VivaAnswerItem]

class SaveDebuggingSectionRequest(BaseModel):
    assessment_id: int
    debugging_code: str
    language: str = "python"

class FinalSubmitResponse(BaseModel):
    message: str
    submission_id: int
    total_score: float
    plagiarism_score: float
    plagiarism_status: str


# --- Feedback Schemas ---
class FeedbackCreate(BaseModel):
    assessment_id: int
    overall_rating: int = Field(..., ge=1, le=5)
    coding_clarity_rating: int = Field(..., ge=1, le=5)
    editor_rating: int = Field(..., ge=1, le=5)
    viva_relevance_rating: int = Field(..., ge=1, le=5)
    debugging_rating: int = Field(..., ge=1, le=5)
    suggestions: Optional[str] = None
    additional_comments: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    assessment_id: int
    student_id: int
    overall_rating: int
    coding_clarity_rating: int
    editor_rating: int
    viva_relevance_rating: int
    debugging_rating: int
    suggestions: Optional[str]
    additional_comments: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Faculty Evaluation Schemas ---
class FacultyReviewRequest(BaseModel):
    submission_id: int
    faculty_notes: Optional[str] = None
    faculty_feedback: Optional[str] = None
    manual_score_adjustment: Optional[float] = 0.0
    adjustment_reason: Optional[str] = None
    plagiarism_status: Optional[str] = None
    mark_as_reviewed: bool = True

class PublishMarksRequest(BaseModel):
    submission_id: int
    publish: bool = True


# --- Plagiarism Schemas ---
class PlagiarismReportResponse(BaseModel):
    id: int
    assessment_id: int
    submission_id: int
    compared_student_name: Optional[str]
    similarity_score: float
    matched_tokens_count: int
    matched_snippets: List[Dict[str, Any]] = []
    explanation: Optional[str]
    status: str
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard Stats Schemas ---
class FacultyDashboardStats(BaseModel):
    total_students: int
    total_assessments: int
    submissions_received: int
    pending_submissions: int
    average_marks: float
    test_case_pass_rate: float
    plagiarism_alerts: int
    feedback_received: int
    marks_distribution: List[Dict[str, Any]]
    performance_trends: List[Dict[str, Any]]
    difficulty_breakdown: List[Dict[str, Any]]

class StudentDashboardStats(BaseModel):
    student_name: str
    email: str
    student_id: Optional[str]
    total_assigned: int
    completed_count: int
    pending_count: int
    average_score: float
    assessments: List[AssessmentListItem]
