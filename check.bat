@echo off
node --check ehospitee.js 2>&1
echo Exit: %errorlevel%
node --check ehospitee-js.js 2>&1
echo Exit: %errorlevel%
