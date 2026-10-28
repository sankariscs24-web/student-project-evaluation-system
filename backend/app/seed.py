import datetime
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models import (
    User, Assessment, TestCase, VivaQuestion, DebuggingProblem,
    AssessmentAssignment, AssessmentSubmission, VivaAnswer, Feedback, PlagiarismReport
)
from app.auth import get_password_hash
from app.plagiarism.detector import calculate_similarity

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding database with comprehensive demo data...")

        # 1. Users
        faculty_user = User(
            email="faculty@evalsys.edu",
            hashed_password=get_password_hash("Faculty@123"),
            full_name="Dr. Sarah Jenkins",
            role="faculty",
            department="Computer Science & Engineering"
        )
        db.add(faculty_user)

        student_alex = User(
            email="alex.student@evalsys.edu",
            hashed_password=get_password_hash("Student@123"),
            full_name="Alex Morgan",
            role="student",
            student_id="STU202601",
            department="Computer Science & Engineering"
        )
        db.add(student_alex)

        student_priya = User(
            email="priya.student@evalsys.edu",
            hashed_password=get_password_hash("Student@123"),
            full_name="Priya Sharma",
            role="student",
            student_id="STU202602",
            department="Computer Science & Engineering"
        )
        db.add(student_priya)

        db.commit()
        db.refresh(faculty_user)
        db.refresh(student_alex)
        db.refresh(student_priya)

        # 2. Assessment 1: Two Sum Problem & Target Pair Search
        a1 = Assessment(
            title="Two Sum Problem & Target Pair Search",
            problem_statement="Find two distinct numbers in an array that sum up to a specific target value.",
            problem_description="""Given an array of integers `nums` and an integer `target`, return indices or values of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.
For input formatting:
The first line contains integers separated by spaces (the array elements).
The second line contains a single integer representing the `target`.

Output the two numbers separated by a space in ascending order.""",
            difficulty="Easy",
            input_format="Line 1: Space-separated integers representing the array\nLine 2: Single integer target",
            output_format="Two space-separated integers in ascending order that sum to target",
            constraints="2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
            sample_input="2 7 11 15\n9",
            sample_output="2 7",
            allowed_languages=["python", "c", "cpp", "java"],
            max_marks=100.0,
            section_marks_coding=50.0,
            section_marks_viva=25.0,
            section_marks_debugging=25.0,
            time_limit_sec=5,
            memory_limit_mb=256,
            deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7),
            instructions="Write optimal code with O(n) or O(n log n) complexity. Answer all viva questions carefully before proceeding to debugging.",
            is_published=True,
            version=1,
            created_by_faculty_id=faculty_user.id
        )
        db.add(a1)
        db.commit()
        db.refresh(a1)

        # Test cases for A1
        tcs1 = [
            TestCase(assessment_id=a1.id, input_data="2 7 11 15\n9", expected_output="2 7", is_hidden=False, points=15.0, explanation="Standard pair 2 + 7 = 9"),
            TestCase(assessment_id=a1.id, input_data="3 2 4\n6", expected_output="2 4", is_hidden=False, points=15.0, explanation="Pair 2 + 4 = 6"),
            TestCase(assessment_id=a1.id, input_data="3 3\n6", expected_output="3 3", is_hidden=True, points=10.0, explanation="Duplicate identical elements summing to 6"),
            TestCase(assessment_id=a1.id, input_data="-1 -2 -3 -4 -5\n-8", expected_output="-5 -3", is_hidden=True, points=10.0, explanation="Negative numbers"),
        ]
        db.add_all(tcs1)

        # Viva questions for A1
        vqs1 = [
            VivaQuestion(
                assessment_id=a1.id,
                question_text="What is the optimal time complexity to solve the Two Sum problem using a Hash Map?",
                question_type="mcq",
                options=["O(1)", "O(n)", "O(n log n)", "O(n^2)"],
                correct_answer="O(n)",
                explanation="A Hash Map enables O(1) average lookup time for each complement, resulting in O(n) overall time complexity.",
                points=5.0,
                category="Time & Space Complexity"
            ),
            VivaQuestion(
                assessment_id=a1.id,
                question_text="If the input array is already sorted in ascending order, which two-pointer technique achieves O(1) auxiliary space?",
                question_type="mcq",
                options=["Left pointer at start, right pointer at end moving inward", "Both pointers start from 0", "Fast and slow pointer", "Binary search on every index"],
                correct_answer="Left pointer at start, right pointer at end moving inward",
                explanation="In a sorted array, two pointers starting from left and right can converge inward based on whether the current sum is smaller or larger than the target.",
                points=5.0,
                category="Searching & Sorting"
            ),
            VivaQuestion(
                assessment_id=a1.id,
                question_text="In Python, what is the underlying data structure used to implement a `dict`?",
                question_type="mcq",
                options=["Binary Search Tree", "Linked List", "Hash Table with open addressing", "Red-Black Tree"],
                correct_answer="Hash Table with open addressing",
                explanation="Python dictionaries are implemented as highly optimized hash tables using open addressing with quadratic perturbation probing.",
                points=5.0,
                category="Programming Fundamentals"
            ),
            VivaQuestion(
                assessment_id=a1.id,
                question_text="What is a hash collision, and name one standard technique used to resolve it?",
                question_type="short_answer",
                options=None,
                correct_answer="collision, chaining, open addressing, probing",
                explanation="A hash collision occurs when two distinct keys yield the same hash index. Techniques include separate chaining and open addressing (linear/quadratic probing).",
                points=5.0,
                category="Data Structures"
            ),
            VivaQuestion(
                assessment_id=a1.id,
                question_text="Which of the following is true regarding immutable data types in Python?",
                question_type="mcq",
                options=["Tuples and strings can be modified in-place", "Lists can be used as dictionary keys", "Tuples containing only immutables can be dictionary keys", "Integers are mutable"],
                correct_answer="Tuples containing only immutables can be dictionary keys",
                explanation="Dictionary keys must be hashable. Tuples containing only immutable objects are hashable and valid dictionary keys.",
                points=5.0,
                category="Python Fundamentals"
            )
        ]
        db.add_all(vqs1)

        # Debugging problem for A1
        faulty_code_1 = """# Faulty Two Sum Implementation
# Task: Fix the logical bug where the same index element can be used twice
import sys

def two_sum():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) < 2:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
    # Bug: Nested loop starts from 0, allowing same element reuse and printing duplicates
    for i in range(len(nums)):
        for j in range(len(nums)):
            if nums[i] + nums[j] == target:
                res = sorted([nums[i], nums[j]])
                print(f"{res[0]} {res[1]}")
                return

if __name__ == '__main__':
    two_sum()
"""
        dbg1 = DebuggingProblem(
            assessment_id=a1.id,
            title="Fix Duplicate Index Reuse Bug in Two Sum",
            description="The provided implementation incorrectly checks `nums[i] + nums[j] == target` starting from index 0 for both loops without verifying `i != j`. This can incorrectly pair an element with itself when `nums[i] * 2 == target` even if only one occurrence exists in the array.",
            faulty_code=faulty_code_1,
            language="python",
            expected_behavior="The corrected code must only pair distinct indices `i != j` (e.g. `range(i + 1, len(nums))` or a hash map) and print the two values separated by space in ascending order.",
            test_cases=[
                {"input": "2 7 11 15\n9", "expected": "2 7"},
                {"input": "3 2 4\n6", "expected": "2 4"},
                {"input": "4 1 5\n8", "expected": ""} # 4 cannot pair with itself if no second 4 exists
            ],
            points=25.0
        )
        db.add(dbg1)

        # 3. Assessment 2: Balanced Parentheses & Stack Expression Validator
        a2 = Assessment(
            title="Balanced Parentheses & Stack Expression Validator",
            problem_statement="Validate whether a string containing brackets '()', '[]', and '{}' has balanced and correctly nested pairs.",
            problem_description="""Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Input format: A single line string with brackets.
Output format: Print `True` if valid, otherwise print `False`.""",
            difficulty="Medium",
            input_format="Single line string consisting of bracket characters",
            output_format="True or False",
            constraints="1 <= s.length <= 10^5\ns consists only of '()[]{}'",
            sample_input="()[]{}",
            sample_output="True",
            allowed_languages=["python", "c", "cpp", "java"],
            max_marks=100.0,
            section_marks_coding=50.0,
            section_marks_viva=25.0,
            section_marks_debugging=25.0,
            time_limit_sec=5,
            memory_limit_mb=256,
            deadline=datetime.datetime.utcnow() + datetime.timedelta(days=10),
            instructions="Utilize a Stack (LIFO) data structure. Ensure handling of edge cases like single closing bracket.",
            is_published=True,
            version=1,
            created_by_faculty_id=faculty_user.id
        )
        db.add(a2)
        db.commit()
        db.refresh(a2)

        tcs2 = [
            TestCase(assessment_id=a2.id, input_data="()[]{}", expected_output="True", is_hidden=False, points=15.0),
            TestCase(assessment_id=a2.id, input_data="(]", expected_output="False", is_hidden=False, points=15.0),
            TestCase(assessment_id=a2.id, input_data="([{}])", expected_output="True", is_hidden=True, points=10.0),
            TestCase(assessment_id=a2.id, input_data="]", expected_output="False", is_hidden=True, points=10.0),
        ]
        db.add_all(tcs2)

        vqs2 = [
            VivaQuestion(
                assessment_id=a2.id,
                question_text="Which Data Structure strictly follows the Last-In, First-Out (LIFO) discipline?",
                question_type="mcq",
                options=["Queue", "Stack", "Binary Search Tree", "Linked List"],
                correct_answer="Stack",
                explanation="Stacks operate on the LIFO principle where elements added last are removed first.",
                points=5.0,
                category="Data Structures"
            ),
            VivaQuestion(
                assessment_id=a2.id,
                question_text="What is the worst-case time complexity of pushing and popping an element from a Stack implemented with a Dynamic Array?",
                question_type="mcq",
                options=["O(1) amortized", "O(n)", "O(log n)", "O(n^2)"],
                correct_answer="O(1) amortized",
                explanation="Push and pop operations take O(1) amortized time in dynamic arrays like Python lists or C++ std::vector.",
                points=5.0,
                category="Time & Space Complexity"
            ),
            VivaQuestion(
                assessment_id=a2.id,
                question_text="Briefly explain what happens when a stack overflow occurs.",
                question_type="short_answer",
                options=None,
                correct_answer="overflow, memory, limit, call stack, capacity",
                explanation="Stack overflow occurs when program execution allocates more memory on the call stack than available memory limit.",
                points=5.0,
                category="System Architecture"
            )
        ]
        db.add_all(vqs2)

        dbg2 = DebuggingProblem(
            assessment_id=a2.id,
            title="Fix Stack Underflow & Empty Check in Parentheses Validator",
            description="The code crashes with an `IndexError` when encountering an unmatched closing bracket on an empty stack.",
            faulty_code="""import sys

def is_valid():
    s = sys.stdin.read().strip()
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    
    for char in s:
        if char in mapping:
            # Bug: Does not check if stack is empty before pop()!
            top = stack.pop()
            if top != mapping[char]:
                print("False")
                return
        else:
            stack.append(char)
            
    print(str(len(stack) == 0))

if __name__ == '__main__':
    is_valid()
""",
            language="python",
            expected_behavior="The code should verify `if not stack: print('False'); return` before attempting to pop.",
            test_cases=[
                {"input": "()[]{}", "expected": "True"},
                {"input": "]", "expected": "False"},
                {"input": "([)]", "expected": "False"}
            ],
            points=25.0
        )
        db.add(dbg2)

        # 4. Assessment 3: Longest Substring Without Repeating Characters
        a3 = Assessment(
            title="Longest Substring Without Repeating Characters",
            problem_statement="Find the length of the longest substring without repeating characters in a given string.",
            problem_description="""Given a string `s`, find the length of the longest substring without duplicate characters.

Input format: A single line string.
Output format: An integer representing the maximum length.""",
            difficulty="Hard",
            input_format="Single line string s",
            output_format="Single integer length",
            constraints="0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
            sample_input="abcabcbb",
            sample_output="3",
            allowed_languages=["python", "c", "cpp", "java"],
            max_marks=100.0,
            section_marks_coding=50.0,
            section_marks_viva=25.0,
            section_marks_debugging=25.0,
            time_limit_sec=5,
            memory_limit_mb=256,
            deadline=datetime.datetime.utcnow() + datetime.timedelta(days=14),
            instructions="Use sliding window with two pointers or a character index map.",
            is_published=True,
            version=1,
            created_by_faculty_id=faculty_user.id
        )
        db.add(a3)
        db.commit()
        db.refresh(a3)

        tcs3 = [
            TestCase(assessment_id=a3.id, input_data="abcabcbb", expected_output="3", is_hidden=False, points=20.0),
            TestCase(assessment_id=a3.id, input_data="bbbbb", expected_output="1", is_hidden=False, points=15.0),
            TestCase(assessment_id=a3.id, input_data="pwwkew", expected_output="3", is_hidden=True, points=15.0),
        ]
        db.add_all(tcs3)

        vqs3 = [
            VivaQuestion(
                assessment_id=a3.id,
                question_text="What algorithm pattern is best suited to achieve O(n) time for longest substring search?",
                question_type="mcq",
                options=["Sliding Window", "Divide and Conquer", "Backtracking", "Floyd-Warshall"],
                correct_answer="Sliding Window",
                explanation="The sliding window technique maintains a window between left and right indices, expanding and contracting in O(n) total steps.",
                points=5.0,
                category="Algorithms"
            )
        ]
        db.add_all(vqs3)

        # 5. Assignments: Assign all 3 assessments to both students
        for assessment in [a1, a2, a3]:
            db.add(AssessmentAssignment(assessment_id=assessment.id, student_id=student_alex.id))
            db.add(AssessmentAssignment(assessment_id=assessment.id, student_id=student_priya.id))
        db.commit()

        # 6. Seed Realistic Submissions to show Plagiarism Analysis & Faculty Evaluation!
        # Priya submitted high quality solution for A1
        priya_solution = """import sys

def solve():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) < 2:
        return
    nums = [int(x) for x in lines[0].split()]
    target = int(lines[1])
    
    seen = {}
    for num in nums:
        complement = target - num
        if complement in seen:
            ans = sorted([num, complement])
            print(f"{ans[0]} {ans[1]}")
            return
        seen[num] = True

if __name__ == '__main__':
    solve()
"""

        # Alex submitted a very similar code (same structure, renamed variables, added a comment)
        # This will trigger realistic Plagiarism similarity detection!
        alex_solution = """import sys

# Alex's assignment submission
def solve():
    data = sys.stdin.read().strip().split('\\n')
    if len(data) < 2:
        return
    elements = [int(val) for val in data[0].split()]
    req_target = int(data[1])
    
    lookup_map = {}
    for val in elements:
        diff = req_target - val
        if diff in lookup_map:
            result = sorted([val, diff])
            print(f"{result[0]} {result[1]}")
            return
        lookup_map[val] = True

if __name__ == '__main__':
    solve()
"""

        priya_corrected_dbg = """import sys

def two_sum():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) < 2:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                res = sorted([nums[i], nums[j]])
                print(f"{res[0]} {res[1]}")
                return

if __name__ == '__main__':
    two_sum()
"""

        # Priya's completed submission
        sub_priya = AssessmentSubmission(
            assessment_id=a1.id,
            student_id=student_priya.id,
            status="submitted",
            started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5),
            submitted_at=datetime.datetime.utcnow() - datetime.timedelta(hours=4),
            coding_code=priya_solution,
            coding_language="python",
            coding_score=50.0,
            coding_test_results=[
                {"test_case_num": 1, "passed": True, "points_awarded": 15.0, "is_hidden": False},
                {"test_case_num": 2, "passed": True, "points_awarded": 15.0, "is_hidden": False},
                {"test_case_num": 3, "passed": True, "points_awarded": 10.0, "is_hidden": True},
                {"test_case_num": 4, "passed": True, "points_awarded": 10.0, "is_hidden": True},
            ],
            section1_completed=True,
            viva_score=25.0,
            section2_completed=True,
            debugging_code=priya_corrected_dbg,
            debugging_language="python",
            debugging_score=25.0,
            debugging_test_results=[
                {"test_case_num": 1, "passed": True, "points_awarded": 8.33},
                {"test_case_num": 2, "passed": True, "points_awarded": 8.33},
                {"test_case_num": 3, "passed": True, "points_awarded": 8.34},
            ],
            section3_completed=True,
            is_final_submitted=True,
            total_score=100.0,
            feedback_submitted=True,
            plagiarism_score=78.5,
            plagiarism_status="Suspicious",
            faculty_reviewed=True,
            faculty_notes="Exceptional work on all 3 sections. High similarity with Alex Morgan flagged for review.",
            faculty_feedback="Great performance on test cases and viva answers!",
            marks_published=True
        )
        db.add(sub_priya)
        db.commit()
        db.refresh(sub_priya)

        # Priya's viva answers
        for q in vqs1:
            db.add(VivaAnswer(
                submission_id=sub_priya.id,
                question_id=q.id,
                student_answer=q.correct_answer,
                is_correct=True,
                score_awarded=q.points
            ))

        # Priya's feedback
        fb_priya = Feedback(
            assessment_id=a1.id,
            student_id=student_priya.id,
            overall_rating=5,
            coding_clarity_rating=5,
            editor_rating=5,
            viva_relevance_rating=4,
            debugging_rating=5,
            suggestions="The Monaco editor integrated nicely! Would love more hidden test case hints if possible.",
            additional_comments="Loved the viva questioning right after coding."
        )
        db.add(fb_priya)

        # Alex's completed submission (similar code to Priya's)
        sub_alex = AssessmentSubmission(
            assessment_id=a1.id,
            student_id=student_alex.id,
            status="submitted",
            started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=3),
            submitted_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            coding_code=alex_solution,
            coding_language="python",
            coding_score=50.0,
            coding_test_results=[
                {"test_case_num": 1, "passed": True, "points_awarded": 15.0, "is_hidden": False},
                {"test_case_num": 2, "passed": True, "points_awarded": 15.0, "is_hidden": False},
                {"test_case_num": 3, "passed": True, "points_awarded": 10.0, "is_hidden": True},
                {"test_case_num": 4, "passed": True, "points_awarded": 10.0, "is_hidden": True},
            ],
            section1_completed=True,
            viva_score=20.0,
            section2_completed=True,
            debugging_code=priya_corrected_dbg,
            debugging_language="python",
            debugging_score=25.0,
            debugging_test_results=[
                {"test_case_num": 1, "passed": True, "points_awarded": 8.33},
                {"test_case_num": 2, "passed": True, "points_awarded": 8.33},
                {"test_case_num": 3, "passed": True, "points_awarded": 8.34},
            ],
            section3_completed=True,
            is_final_submitted=True,
            total_score=95.0,
            feedback_submitted=True,
            plagiarism_score=78.5,
            plagiarism_status="Suspicious",
            faculty_reviewed=False,
            marks_published=False
        )
        db.add(sub_alex)
        db.commit()
        db.refresh(sub_alex)

        # Alex's viva answers
        for q in vqs1:
            ans = q.correct_answer if q.question_type == "mcq" else "hash table collision resolution with chaining"
            db.add(VivaAnswer(
                submission_id=sub_alex.id,
                question_id=q.id,
                student_answer=ans,
                is_correct=True,
                score_awarded=q.points if q.question_type == "mcq" else 4.0
            ))

        # Alex's feedback
        fb_alex = Feedback(
            assessment_id=a1.id,
            student_id=student_alex.id,
            overall_rating=4,
            coding_clarity_rating=5,
            editor_rating=4,
            viva_relevance_rating=4,
            debugging_rating=4,
            suggestions="Smooth flow across the 3 sections.",
            additional_comments="Clear problem statement and constraints."
        )
        db.add(fb_alex)

        # Real Plagiarism comparison between Alex & Priya
        sim_data = calculate_similarity(alex_solution, priya_solution, "python", "python")
        report_alex = PlagiarismReport(
            assessment_id=a1.id,
            submission_id=sub_alex.id,
            compared_with_submission_id=sub_priya.id,
            compared_student_name="Priya Sharma",
            similarity_score=sim_data["similarity_score"],
            matched_tokens_count=sim_data["matched_tokens_count"],
            matched_snippets=sim_data["matched_snippets"],
            explanation=sim_data["explanation"],
            status="Suspicious"
        )
        db.add(report_alex)

        report_priya = PlagiarismReport(
            assessment_id=a1.id,
            submission_id=sub_priya.id,
            compared_with_submission_id=sub_alex.id,
            compared_student_name="Alex Morgan",
            similarity_score=sim_data["similarity_score"],
            matched_tokens_count=sim_data["matched_tokens_count"],
            matched_snippets=sim_data["matched_snippets"],
            explanation=sim_data["explanation"],
            status="Suspicious"
        )
        db.add(report_priya)

        db.commit()
        print("Database successfully seeded with realistic accounts, assessments, test cases, and plagiarism scenarios!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
