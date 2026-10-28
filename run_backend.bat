@echo off
title EvalSys - FastAPI Backend Server
echo ========================================================
echo  Starting EvalSys Backend (FastAPI + SQLite)
echo ========================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
