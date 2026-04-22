@echo off
REM Complete any pending merge
git -c core.editor=true merge --continue 2>nul

REM Add all changes
git add .

REM Commit with message
git commit -m "Update colors to previous forest/mint theme"

REM Push to origin
git push origin main

echo.
echo ========================================
echo PUSH COMPLETED SUCCESSFULLY
echo ========================================
pause
