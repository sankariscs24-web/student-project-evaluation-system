# Automated Student Project Evaluation System with Plagiarism Detection and Code Execution Validation

EvalSys is an enterprise-grade full-stack web application designed for academic institutions to conduct, execute, validate, and evaluate student programming assessments. It features role-based access for **Students** and **Faculty**, a real-time **Monaco Editor** interface, a sandboxed multi-language **Code Execution Engine**, an automated **Viva Assessment Module**, a **Code Debugging Challenge**, a token-based **Plagiarism Detection Engine**, a post-submission **Feedback Collection System**, and a comprehensive **Faculty Evaluation & Analytics Portal**.

---

## 1. Demo Login Credentials

The database is automatically pre-seeded with realistic faculty, student accounts, assessments, test cases, and submissions:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Faculty** | Dr. Sarah Jenkins | `faculty@evalsys.edu` | `Faculty@123` | Full instructor access: dashboards, problem management, plagiarism reports, grade adjustments, and publishing |
| **Student 1** | Alex Morgan | `alex.student@evalsys.edu` | `Student@123` | Roll No: `STU202601` — Pre-submitted assignment with flagged plagiarism scenario for review |
| **Student 2** | Priya Sharma | `priya.student@evalsys.edu` | `Student@123` | Roll No: `STU202602` — Pre-submitted assignment with high marks and student feedback |

> **Note**: Students can also register new accounts directly from the login page via the **Register Student Account** form. Faculty accounts are restricted and provisioned by the institutional administrator.

---

## 2. Technology Stack

- **Frontend**:
  - React 18 with Vite
  - Tailwind CSS for modern responsive styling
  - Monaco Editor (`@monaco-editor/react`) for full-featured IDE code editing (syntax highlighting, line numbers, indentation, shortcuts)
  - Recharts for faculty analytics (marks distribution, performance trends, difficulty breakdowns)
  - Lucide React for modern iconography
  - Canvas Confetti for celebratory animations upon final submission
  - Axios with JWT bearer interceptors
  - React Router v6 for client-side role-based route protection
- **Backend**:
  - Python 3.12 with FastAPI
  - SQLite Relational Database with SQLAlchemy 2.0 ORM
  - Pydantic v2 schemas and request validation
  - Passlib & Bcrypt password hashing
  - PyJWT / Python-Jose for secure role-based JSON Web Tokens
  - Subprocess with isolated temporary workspace sandboxing and timeouts
- **Testing**:
  - Pytest test suite with FastAPI TestClient

---

## 3. Key System Features & Architecture

### A. Role-Based Access Control (RBAC)
- Role verification enforced on the backend (FastAPI dependencies `require_student` and `require_faculty`).
- Access to faculty evaluation, marks publication, and problem management is strictly forbidden to students even if URLs are altered.

### B. Student Assessment Workspace (3-Section Gated Workflow)
Each assigned assessment presents a unified 3-section workspace:
1. **Section 1 — Coding Challenge**:
   - Problem statement, detailed description, input/output format, constraints, and sample test cases.
   - Monaco Editor supporting Python, C, C++, and Java with language switching and reset templates.
   - Predefined test cases table displaying input, expected output, actual output, status (PASS/FAIL), and runtime logs.
   - Server-side hidden test cases: inputs and expected outputs are confidential and protected from students.
2. **Section 2 — Viva & Programming Fundamentals**:
   - Interactive viva assessment covering arrays, linked lists, stacks/queues, recursion, trees, OOP, and time/space complexity.
   - Multiple-choice questions (MCQ) and short-answer conceptual questions.
   - Question-by-question navigation with progress tracking and automatic state preservation.
   - Automatic grading of objective MCQ questions and keyword-based evaluation for conceptual answers.
3. **Section 3 — Code Debugging Challenge**:
   - Displays faulty code with logical or boundary bugs inside the Monaco Editor.
   - Students edit and fix the defective implementation.
   - "Run & Test Corrected Code" evaluates the student's bugfix against validation test cases.
4. **Completion Gating & Final Submit**:
   - The **Final Submit** button remains disabled until all 3 sections satisfy completion requirements.
   - Upon confirmation, the assessment is permanently locked, automatic marks are calculated, pairwise plagiarism detection is executed, and the student feedback modal opens.

### C. Student Feedback Collection
- Pops up automatically after final submission.
- 1–5 rating scales for:
  - Overall assessment difficulty
  - Coding question clarity
  - Monaco Editor experience
  - Viva question relevance
  - Debugging section difficulty
- Suggestions and additional comments text fields.
- Duplicate submissions are prevented.

### D. Plagiarism Detection Module
- Pairwise comparison engine across submissions for the same problem.
- **Normalization**: Strips comments, normalized whitespaces, and abstracts variable names to prevent evasion through renaming.
- **Token Sequence & K-Gram Fingerprinting**: Evaluates token sequence similarity and containment indexes.
- **Evidence Reporting**: Generates similarity percentages, flags suspicious cases (threshold $\ge 60\%$), identifies matching contiguous line blocks, and provides clear explanations for faculty review.

### E. Faculty Dashboard & Evaluation Portal
- Overview metrics cards: Total Students, Total Assessments, Submissions Received, Pending, Average Marks, Test Pass Rate, Plagiarism Alerts, Feedback Count.
- Recharts visualizations: Score distribution histograms, average score trends.
- Searchable & filterable submissions table: Filter by student name, roll number, assessment, and plagiarism status.
- **Detailed Student Evaluation Page**:
  - Full source code viewer in Monaco Editor.
  - Complete test case results (including hidden cases).
  - Viva answers comparison (Student Answer vs Model Answer).
  - Debugging diff comparison (Original Faulty Code vs Student's Corrected Code).
  - Plagiarism report with matched peer and highlighted line snippets.
  - Student submitted feedback ratings and comments.
  - Faculty controls: Private instructor notes, score adjustments with recorded justification, feedback to student, and **Publish Final Marks** toggle.

### F. Faculty Problem Management
- Create, edit, publish/unpublish, and delete assessments.
- Configure test cases (visible vs hidden with points), viva questions, debugging challenges, time limits, and instructions.
- Auto-assign to all enrolled students.

---

## 4. Running the Application on Windows 11

### Prerequisites
- Python 3.10+ installed
- Node.js LTS (v18+ or v20+) and npm installed

### Quick Start (One-Click)
Double-click `start_all.bat` in the root folder. This automatically launches both the FastAPI backend and the Vite frontend in dedicated terminal windows:
- **Backend API**: `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`)
- **Frontend UI**: `http://localhost:5173`

---

### Manual Setup & Execution (PowerShell / Command Prompt)

#### 1. Backend Setup
```powershell
cd backend

# Install Python dependencies
python -m pip install -r requirements.txt

# Seed database with demo data (runs automatically on startup or manually)
python -m app.seed

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```powershell
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 5. Running Automated Tests

Run the complete backend integration and unit test suite:
```powershell
cd backend
python -m pytest tests/test_backend.py -v
```

### Verified Test Cases
1. `test_health_check`: Validates backend status and health endpoints.
2. `test_faculty_login`: Verifies faculty authentication and JWT token generation.
3. `test_student_login`: Verifies student authentication and profile retrieval.
4. `test_invalid_login`: Verifies 401 response on incorrect password.
5. `test_student_registration`: Tests student registration with unique roll numbers.
6. `test_role_based_access_control`: Asserts that students receive 403 Forbidden on faculty endpoints.
7. `test_faculty_dashboard_stats`: Validates aggregate statistics and distribution metrics.
8. `test_student_dashboard_and_workspace`: Verifies workspace retrieval and hidden test case confidentiality.
9. `test_code_execution_engine`: Tests real Python execution against visible and hidden test cases.
10. `test_code_execution_infinite_loop_timeout`: Verifies timeout enforcement on infinite loops.
11. `test_plagiarism_similarity_engine`: Verifies detection of renamed variables and structural similarity.
12. `test_faculty_evaluation_and_publish`: Tests the complete faculty review, mark adjustment, and publication flow.

---

## 6. Directory Structure

```
Automated Student Project Evaluation System/
├── backend/
│   ├── app/
│   │   ├── config.py              # Application settings & secrets
│   │   ├── database.py            # SQLite engine & session setup
│   │   ├── models.py              # SQLAlchemy relational models
│   │   ├── schemas.py             # Pydantic v2 validation models
│   │   ├── auth.py                # JWT & password hashing utilities
│   │   ├── seed.py                # Database demo seeder
│   │   ├── main.py                # FastAPI app initialization
│   │   ├── execution/
│   │   │   └── runner.py          # Sandboxed code execution engine
│   │   ├── plagiarism/
│   │   │   └── detector.py        # Tokenizer & K-gram plagiarism engine
│   │   └── routers/
│   │       ├── auth.py            # Authentication endpoints
│   │       ├── student.py         # Student workspace & submission APIs
│   │       ├── faculty.py         # Faculty evaluation & analytics APIs
│   │       └── plagiarism.py      # Pairwise plagiarism check APIs
│   ├── tests/
│   │   └── test_backend.py        # Comprehensive Pytest suite
│   ├── eval_system.db             # Persistent SQLite database
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state & session management
│   │   ├── services/
│   │   │   └── api.js             # Axios client with interceptors
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Header & role indicator
│   │   │   ├── StatusBadge.jsx    # Reusable status badges
│   │   │   └── CodeEditor.jsx     # Monaco Editor component
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx      # Role switcher & login form
│   │   │   ├── RegisterPage.jsx   # Student registration form
│   │   │   ├── student/
│   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   ├── AssessmentWorkspace.jsx (3-Section Tabbed IDE)
│   │   │   │   └── FeedbackModal.jsx
│   │   │   └── faculty/
│   │   │       ├── FacultyDashboard.jsx (Metrics & Charts)
│   │   │       ├── StudentEvaluationDetail.jsx (Full Review Portal)
│   │   │       └── ManageProblems.jsx (CRUD Problems & Test Cases)
│   │   ├── App.jsx                # Protected routes & router
│   │   ├── main.jsx
│   │   └── index.css              # Tailwind directives
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── run_backend.bat                # Windows 11 1-click backend launcher
├── run_frontend.bat               # Windows 11 1-click frontend launcher
├── start_all.bat                  # Windows 11 1-click full-stack launcher
└── README.md
```
