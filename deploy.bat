@echo off
node --check ehospitee-js.js
if %errorlevel% neq 0 (echo SYNTAX ERROR && exit /b 1)
echo SYNTAX OK
git add .
git commit -m "Fix: rewrite ehospitee-js.js clean, fix registration, fix all redirects"
git push origin main
echo DONE
