@echo off
cd /d "%~dp0"
echo Cake Website will be available at http://localhost:3000
echo Keep this window open while using the website. Press Ctrl+C to stop.
node server.js
pause
