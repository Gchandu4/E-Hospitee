@echo off
node --check ehospitee-js.js
if %errorlevel% neq 0 (echo SYNTAX ERROR && exit /b 1)
echo SYNTAX OK
git add .
git commit -m "Fix: dashboard init guard, vitals validation, file upload errors, real geolocation SOS"
git push origin main
echo PUSHED
