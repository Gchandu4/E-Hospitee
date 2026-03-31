@echo off
copy ehospitee-js.js ehospitee.js
node --check ehospitee.js
if %errorlevel% neq 0 (echo SYNTAX ERROR && exit /b 1)
echo CLEAN
git add ehospitee.js
git commit -m "Fix: replace corrupted ehospitee.js with clean version"
git push origin main
echo DONE
