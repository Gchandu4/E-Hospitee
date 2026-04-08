@echo off
echo ========================================
echo E-Hospitee Diagnostic Script
echo ========================================
echo.

echo [Checking Files]
echo.

set FILES=index.html server.js package.json supabase-setup.sql ehospitee.js ehospitee-login.html

for %%f in (%FILES%) do (
    if exist "%%f" (
        echo ✓ %%f exists
    ) else (
        echo ✗ %%f MISSING
    )
)

echo.
echo [Checking File Sizes]
echo.

for %%f in (index.html server.js package.json) do (
    if exist "%%f" (
        for %%s in ("%%f") do echo %%f: %%~zs bytes
    )
)

echo.
echo [Checking package.json]
echo.

if exist "package.json" (
    type package.json
) else (
    echo package.json not found!
)

echo.
echo [Checking Node.js]
echo.

node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js installed: 
    node --version
) else (
    echo ✗ Node.js NOT installed
)

echo.
echo [Checking npm]
echo.

npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ npm installed:
    npm --version
) else (
    echo ✗ npm NOT installed
)

echo.
echo [Checking node_modules]
echo.

if exist "node_modules" (
    echo ✓ node_modules folder exists
    if exist "node_modules\express" (
        echo ✓ express installed
    ) else (
        echo ✗ express NOT installed - run: npm install
    )
) else (
    echo ✗ node_modules NOT found - run: npm install
)

echo.
echo ========================================
echo Diagnostic Complete
echo ========================================
echo.

pause
