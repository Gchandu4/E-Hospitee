@echo off
REM ═══════════════════════════════════════════════════════════════
REM Check for Sensitive Files in Git Repository
REM This script helps identify files that might contain sensitive data
REM ═══════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════════════════
echo Checking for Sensitive Files in Git Repository
echo ═══════════════════════════════════════════════════════════════
echo.

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ERROR: Not a git repository
    echo Please run this script from your project root
    pause
    exit /b 1
)

echo [1/5] Checking for tracked .env files...
echo ───────────────────────────────────────────────────────────────
git ls-files | findstr /i "\.env"
if errorlevel 1 (
    echo ✅ No .env files found in Git
) else (
    echo ⚠️  WARNING: .env files found in Git!
    echo    These should be removed immediately
)
echo.

echo [2/5] Checking for credential files...
echo ───────────────────────────────────────────────────────────────
git ls-files | findstr /i "credential password secret key token"
if errorlevel 1 (
    echo ✅ No obvious credential files found
) else (
    echo ⚠️  WARNING: Potential credential files found!
)
echo.

echo [3/5] Checking for backup files...
echo ───────────────────────────────────────────────────────────────
git ls-files | findstr /i "\.backup \.bak \.old"
if errorlevel 1 (
    echo ✅ No backup files found in Git
) else (
    echo ⚠️  WARNING: Backup files found in Git!
)
echo.

echo [4/5] Checking for Supabase credentials in files...
echo ───────────────────────────────────────────────────────────────
findstr /s /i "ajscgpuozcyqsteseppp" *.html *.js 2>nul
if errorlevel 1 (
    echo ✅ No Supabase project ID found in code
) else (
    echo ⚠️  WARNING: Supabase project ID found in code!
    echo    Consider moving to environment variables
)
echo.

echo [5/5] Checking for API keys in files...
echo ───────────────────────────────────────────────────────────────
findstr /s /i "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" *.html *.js 2>nul
if errorlevel 1 (
    echo ✅ No obvious API keys found in code
) else (
    echo ⚠️  WARNING: API keys found in code!
    echo    These should be moved to environment variables
)
echo.

echo ═══════════════════════════════════════════════════════════════
echo Summary
echo ═══════════════════════════════════════════════════════════════
echo.
echo If you see any ⚠️  warnings above:
echo 1. Review the files mentioned
echo 2. Remove sensitive data
echo 3. Move credentials to environment variables
echo 4. See SECURITY_GUIDE.md for detailed instructions
echo.
echo Files currently tracked by Git:
echo ───────────────────────────────────────────────────────────────
git ls-files | findstr /v "node_modules"
echo.

echo ═══════════════════════════════════════════════════════════════
echo Check Complete
echo ═══════════════════════════════════════════════════════════════
echo.
pause
