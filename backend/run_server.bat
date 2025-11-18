@echo off
echo 🚀 Starting Gomoku Backend Server...
echo Backend will be available at: http://150.162.244.21:8000
echo API Documentation at: http://150.162.244.21:8000/docs
echo Press Ctrl+C to stop the server
echo.

cd /d %~dp0
python app.py