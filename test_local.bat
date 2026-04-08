@echo off
echo ========================================
echo E-Hospitee Local Testing Script
echo ========================================
echo.

echo [1/5] Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed
echo.

echo [2/5] Checking if index.html exists...
if not exist "index.html" (
    echo ERROR: index.html not found!
    pause
    exit /b 1
)
echo ✓ index.html found
echo.

echo [3/5] Checking if server.js exists...
if not exist "server.js" (
    echo ERROR: server.js not found!
    pause
    exit /b 1
)
echo ✓ server.js found
echo.

echo [4/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [5/5] Starting server...
echo.
echo ========================================
echo Server will start on http://localhost:3000
echo Press Ctrl+C to stop the server
echo ========================================
echo.
node server.js
