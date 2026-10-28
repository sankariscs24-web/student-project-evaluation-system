@echo off
title EvalSys - Start All Servers
echo ========================================================
echo  Launching EvalSys Full-Stack Application
echo ========================================================
start "EvalSys Backend" cmd /c "%~dp0run_backend.bat"
start "EvalSys Frontend" cmd /c "%~dp0run_frontend.bat"
echo.
echo Both servers are launching:
echo  - Backend API: http://127.0.0.1:8000 (Docs at /docs)
echo  - Frontend Web UI: http://localhost:5173
echo ========================================================
pause
