@echo off
echo ========================================
echo FORCE PUSH WELLENI CHANGES
echo ========================================
echo.

echo Step 1: Aborting any pending merge...
git merge --abort 2>nul

echo Step 2: Pulling latest changes...
git config core.editor "notepad"
git pull origin main --no-edit

echo Step 3: Running Welleni rebrand...
python rebrand_to_welleni.py

echo Step 4: Fixing logo...
python fix_welleni_logo.py

echo Step 5: Adding all changes...
git add -A

echo Step 6: Committing...
git commit -m "Rebrand to Welleni - complete"

echo Step 7: Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo DONE! Wait 2-3 minutes for deployment
echo Then hard refresh: Ctrl+Shift+R
echo ========================================
pause
