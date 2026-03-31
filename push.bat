@echo off
node --check ehospitee-js.js
if %errorlevel% neq 0 (echo SYNTAX ERROR && exit /b 1)
echo SYNTAX OK
git add .
git commit -m "Fix: direct Supabase insert with real error messages, updated SQL setup"
git push origin main
echo PUSHED
