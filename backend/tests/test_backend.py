import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.execution.runner import run_code_against_test_cases, normalize_output
from app.plagiarism.detector import calculate_similarity

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_faculty_login():
    response = client.post("/api/auth/login", json={
        "email": "faculty@evalsys.edu",
        "password": "Faculty@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "faculty"
    assert data["user"]["email"] == "faculty@evalsys.edu"

def test_student_login():
    response = client.post("/api/auth/login", json={
        "email": "alex.student@evalsys.edu",
        "password": "Student@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"

def test_invalid_login():
    response = client.post("/api/auth/login", json={
        "email": "faculty@evalsys.edu",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_student_registration():
    new_email = "test.student2026@evalsys.edu"
    response = client.post("/api/auth/register", json={
        "email": new_email,
        "password": "Password@123",
        "full_name": "Test Student User",
        "role": "student",
        "student_id": "STUTEST01",
        "department": "Computer Science"
    })
    assert response.status_code in [201, 400]

def test_role_based_access_control():
    stu_res = client.post("/api/auth/login", json={
        "email": "alex.student@evalsys.edu",
        "password": "Student@123"
    })
    token = stu_res.json()["access_token"]
    
    fac_res = client.get("/api/faculty/dashboard", headers={
        "Authorization": f"Bearer {token}"
    })
    assert fac_res.status_code == 403

def test_faculty_dashboard_stats():
    fac_res = client.post("/api/auth/login", json={
        "email": "faculty@evalsys.edu",
        "password": "Faculty@123"
    })
    token = fac_res.json()["access_token"]
    
    res = client.get("/api/faculty/dashboard", headers={
        "Authorization": f"Bearer {token}"
    })
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_students"] >= 2
    assert stats["total_assessments"] >= 3
    assert len(stats["marks_distribution"]) > 0

def test_student_dashboard_and_workspace():
    stu_res = client.post("/api/auth/login", json={
        "email": "alex.student@evalsys.edu",
        "password": "Student@123"
    })
    token = stu_res.json()["access_token"]
    
    dash_res = client.get("/api/student/dashboard", headers={
        "Authorization": f"Bearer {token}"
    })
    assert dash_res.status_code == 200
    assessments = dash_res.json()["assessments"]
    assert len(assessments) >= 1
    
    a_id = assessments[0]["id"]
    ws_res = client.get(f"/api/student/assessment/{a_id}", headers={
        "Authorization": f"Bearer {token}"
    })
    assert ws_res.status_code == 200
    ws_data = ws_res.json()
    assert "test_cases" in ws_data
    assert "viva_questions" in ws_data
    for tc in ws_data["test_cases"]:
        if tc["is_hidden"]:
            assert tc["input_data"] is None
            assert tc["expected_output"] is None

def test_code_execution_engine():
    code = """import sys
lines = sys.stdin.read().strip().split('\\n')
print(sum(map(int, lines[0].split())))
"""
    test_cases = [
        {"id": 1, "input_data": "10 20 30", "expected_output": "60", "is_hidden": False, "points": 10.0},
        {"id": 2, "input_data": "5 -5", "expected_output": "0", "is_hidden": True, "points": 10.0}
    ]
    res = run_code_against_test_cases(code, "python", test_cases, timeout_sec=3)
    assert res["success"] is True
    assert res["passed_cases"] == 2
    assert res["score"] == 20.0

def test_code_execution_infinite_loop_timeout():
    code = """while True: pass"""
    test_cases = [{"id": 1, "input_data": "", "expected_output": "", "points": 5.0}]
    res = run_code_against_test_cases(code, "python", test_cases, timeout_sec=1)
    assert res["success"] is False
    assert "Timed Out" in res["test_results"][0]["error"]

def test_plagiarism_similarity_engine():
    code_a = """
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
"""
    code_b = """
def two_sum(elements, goal):
    lookup = {}
    for idx, val in enumerate(elements):
        remainder = goal - val
        if remainder in lookup:
            return [lookup[remainder], idx]
        lookup[val] = idx
    return []
"""
    result = calculate_similarity(code_a, code_b, "python", "python")
    assert result["similarity_score"] >= 65.0
    assert result["status"] == "Suspicious"
    assert result["matched_tokens_count"] > 5

    code_c = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
"""
    res_diff = calculate_similarity(code_a, code_c, "python", "python")
    assert res_diff["similarity_score"] < 40.0
    assert res_diff["status"] == "Clean"

def test_faculty_evaluation_and_publish():
    fac_res = client.post("/api/auth/login", json={
        "email": "faculty@evalsys.edu",
        "password": "Faculty@123"
    })
    token = fac_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch submissions
    sub_res = client.get("/api/faculty/submissions", headers=headers)
    assert sub_res.status_code == 200
    submissions = sub_res.json()
    assert len(submissions) >= 1
    sub_id = submissions[0]["id"]

    # Get submission detail
    detail_res = client.get(f"/api/faculty/submission/{sub_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "student" in detail
    assert "coding_evaluation" in detail
    assert "viva_evaluation" in detail
    assert "debugging_evaluation" in detail
    assert "plagiarism" in detail

    # Submit faculty review
    review_res = client.post("/api/faculty/review", json={
        "submission_id": sub_id,
        "faculty_notes": "Reviewed thoroughly. Verified code logic.",
        "faculty_feedback": "Strong problem solving skills.",
        "manual_score_adjustment": 2.0,
        "adjustment_reason": "Clear variable naming in debugging section",
        "plagiarism_status": "Reviewed",
        "mark_as_reviewed": True
    }, headers=headers)
    assert review_res.status_code == 200

    # Publish marks
    pub_res = client.post("/api/faculty/publish", json={
        "submission_id": sub_id,
        "publish": True
    }, headers=headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["marks_published"] is True
