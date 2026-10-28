import os
import sys
import shutil
import tempfile
import subprocess
import time
from typing import List, Dict, Any, Optional

def normalize_output(text: Optional[str]) -> str:
    """Normalize line endings and strip trailing whitespace from each line."""
    if text is None:
        return ""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").strip().split("\n")
    return "\n".join(line.rstrip() for line in lines)

def execute_python_code(
    code: str,
    stdin_input: str,
    work_dir: str,
    timeout_sec: int = 5
) -> Dict[str, Any]:
    file_path = os.path.join(work_dir, "solution.py")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)

    # Use python executable with isolated environment flags
    # -I: Run in isolated mode (ignores PYTHONPATH and PYTHONHOME)
    # -B: Don't write .pyc files
    # -s: Don't add user site-directory
    cmd = [sys.executable, "-I", "-B", "-s", file_path]
    
    start_time = time.perf_counter()
    try:
        proc = subprocess.run(
            cmd,
            input=stdin_input,
            text=True,
            capture_output=True,
            cwd=work_dir,
            timeout=timeout_sec,
            env={
                "PATH": os.environ.get("PATH", ""),
                "SYSTEMROOT": os.environ.get("SYSTEMROOT", "C:\\Windows"),
                "PYTHONIOENCODING": "utf-8",
            }
        )
        duration = time.perf_counter() - start_time
        return {
            "success": proc.returncode == 0,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "returncode": proc.returncode,
            "duration": round(duration, 3),
            "timed_out": False
        }
    except subprocess.TimeoutExpired:
        duration = time.perf_counter() - start_time
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution Timed Out (limit: {timeout_sec}s). Possible infinite loop or slow algorithm.",
            "returncode": -1,
            "duration": round(duration, 3),
            "timed_out": True
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "returncode": -1,
            "duration": 0.0,
            "timed_out": False
        }

def execute_c_cpp_code(
    code: str,
    language: str,
    stdin_input: str,
    work_dir: str,
    timeout_sec: int = 5
) -> Dict[str, Any]:
    compiler = "g++" if language == "cpp" else "gcc"
    ext = "cpp" if language == "cpp" else "c"
    src_file = os.path.join(work_dir, f"solution.{ext}")
    exe_file = os.path.join(work_dir, "solution.exe")

    # Check if compiler is available
    if not shutil.which(compiler):
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Compiler '{compiler}' is not available on this host environment. Please install MinGW/GCC to compile {language.upper()} code.",
            "returncode": -1,
            "duration": 0.0,
            "compile_error": f"Compiler '{compiler}' not found."
        }

    with open(src_file, "w", encoding="utf-8") as f:
        f.write(code)

    # Compile
    compile_cmd = [compiler, src_file, "-o", exe_file, "-O2"]
    try:
        comp_res = subprocess.run(compile_cmd, capture_output=True, text=True, cwd=work_dir, timeout=10)
        if comp_res.returncode != 0:
            return {
                "success": False,
                "stdout": "",
                "stderr": comp_res.stderr,
                "compile_error": comp_res.stderr,
                "returncode": comp_res.returncode,
                "duration": 0.0
            }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "compile_error": str(e),
            "returncode": -1,
            "duration": 0.0
        }

    # Run
    start_time = time.perf_counter()
    try:
        proc = subprocess.run(
            [exe_file],
            input=stdin_input,
            text=True,
            capture_output=True,
            cwd=work_dir,
            timeout=timeout_sec
        )
        duration = time.perf_counter() - start_time
        return {
            "success": proc.returncode == 0,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "returncode": proc.returncode,
            "duration": round(duration, 3),
            "timed_out": False
        }
    except subprocess.TimeoutExpired:
        duration = time.perf_counter() - start_time
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution Timed Out (limit: {timeout_sec}s).",
            "returncode": -1,
            "duration": round(duration, 3),
            "timed_out": True
        }

def execute_java_code(
    code: str,
    stdin_input: str,
    work_dir: str,
    timeout_sec: int = 5
) -> Dict[str, Any]:
    if not shutil.which("javac") or not shutil.which("java"):
        return {
            "success": False,
            "stdout": "",
            "stderr": "Java JDK (javac/java) is not installed on this host environment. Please install OpenJDK to compile Java code.",
            "returncode": -1,
            "duration": 0.0,
            "compile_error": "JDK not found."
        }

    src_file = os.path.join(work_dir, "Solution.java")
    with open(src_file, "w", encoding="utf-8") as f:
        f.write(code)

    # Compile
    try:
        comp_res = subprocess.run(["javac", src_file], capture_output=True, text=True, cwd=work_dir, timeout=10)
        if comp_res.returncode != 0:
            return {
                "success": False,
                "stdout": "",
                "stderr": comp_res.stderr,
                "compile_error": comp_res.stderr,
                "returncode": comp_res.returncode,
                "duration": 0.0
            }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "compile_error": str(e),
            "returncode": -1,
            "duration": 0.0
        }

    # Run
    start_time = time.perf_counter()
    try:
        proc = subprocess.run(
            ["java", "-cp", work_dir, "Solution"],
            input=stdin_input,
            text=True,
            capture_output=True,
            cwd=work_dir,
            timeout=timeout_sec
        )
        duration = time.perf_counter() - start_time
        return {
            "success": proc.returncode == 0,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "returncode": proc.returncode,
            "duration": round(duration, 3),
            "timed_out": False
        }
    except subprocess.TimeoutExpired:
        duration = time.perf_counter() - start_time
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution Timed Out (limit: {timeout_sec}s).",
            "returncode": -1,
            "duration": round(duration, 3),
            "timed_out": True
        }

def run_code_against_test_cases(
    code: str,
    language: str,
    test_cases: List[Dict[str, Any]],
    timeout_sec: int = 5,
    is_faculty_view: bool = False
) -> Dict[str, Any]:
    """
    Executes student code across all test cases inside an isolated sandbox directory.
    Calculates score, handles timeouts, and hides sensitive info for hidden test cases if not faculty.
    """
    language = language.lower()
    results = []
    passed_count = 0
    total_score = 0.0
    total_possible_score = sum(tc.get("points", 10.0) for tc in test_cases) if test_cases else 0.0

    with tempfile.TemporaryDirectory() as temp_dir:
        # Pre-check compilation errors if compiled language
        compile_error = None
        if language in ["c", "cpp"]:
            test_res = execute_c_cpp_code(code, language, "", temp_dir, timeout_sec)
            if test_res.get("compile_error"):
                compile_error = test_res["compile_error"]
        elif language == "java":
            test_res = execute_java_code(code, "", temp_dir, timeout_sec)
            if test_res.get("compile_error"):
                compile_error = test_res["compile_error"]

        if compile_error:
            for idx, tc in enumerate(test_cases, 1):
                results.append({
                    "test_case_id": tc.get("id", idx),
                    "test_case_num": idx,
                    "is_hidden": tc.get("is_hidden", False),
                    "passed": False,
                    "input_data": tc.get("input_data") if (is_faculty_view or not tc.get("is_hidden")) else "[Hidden Test Case]",
                    "expected_output": tc.get("expected_output") if (is_faculty_view or not tc.get("is_hidden")) else "[Hidden Test Case]",
                    "actual_output": "",
                    "execution_time": 0.0,
                    "error": compile_error,
                    "points_awarded": 0.0
                })
            return {
                "success": False,
                "language": language,
                "compile_error": compile_error,
                "passed_cases": 0,
                "total_cases": len(test_cases),
                "test_results": results,
                "score": 0.0,
                "execution_time": 0.0
            }

        total_exec_time = 0.0
        for idx, tc in enumerate(test_cases, 1):
            tc_input = tc.get("input_data", "")
            expected_out = tc.get("expected_output", "")
            is_hidden = tc.get("is_hidden", False)
            points = float(tc.get("points", 10.0))

            if language == "python":
                exec_result = execute_python_code(code, tc_input, temp_dir, timeout_sec)
            elif language in ["c", "cpp"]:
                exec_result = execute_c_cpp_code(code, language, tc_input, temp_dir, timeout_sec)
            elif language == "java":
                exec_result = execute_java_code(code, tc_input, temp_dir, timeout_sec)
            else:
                exec_result = {
                    "success": False,
                    "stdout": "",
                    "stderr": f"Unsupported language: {language}",
                    "returncode": -1,
                    "duration": 0.0
                }

            total_exec_time += exec_result.get("duration", 0.0)
            actual_norm = normalize_output(exec_result.get("stdout", ""))
            expected_norm = normalize_output(expected_out)

            passed = (exec_result.get("success", False) and actual_norm == expected_norm)
            awarded = points if passed else 0.0
            if passed:
                passed_count += 1
                total_score += awarded

            err_msg = exec_result.get("stderr") if not exec_result.get("success") else None

            # Student safety: hide hidden inputs and expected outputs
            show_details = is_faculty_view or not is_hidden
            results.append({
                "test_case_id": tc.get("id", idx),
                "test_case_num": idx,
                "is_hidden": is_hidden,
                "passed": passed,
                "input_data": tc_input if show_details else "[Hidden Test Case]",
                "expected_output": expected_out if show_details else "[Hidden Test Case]",
                "actual_output": exec_result.get("stdout", "") if show_details else ("[Test Passed]" if passed else "[Test Failed]"),
                "execution_time": exec_result.get("duration", 0.0),
                "error": err_msg if show_details else (err_msg if exec_result.get("timed_out") else None),
                "points_awarded": awarded
            })

    return {
        "success": passed_count == len(test_cases) and len(test_cases) > 0,
        "language": language,
        "compile_error": None,
        "passed_cases": passed_count,
        "total_cases": len(test_cases),
        "test_results": results,
        "score": round(total_score, 2),
        "execution_time": round(total_exec_time, 3)
    }
