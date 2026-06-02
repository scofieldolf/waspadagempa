@echo off
echo ===================================================
echo [Waspadagempa] Starting Local Next.js Server...
echo ===================================================
echo.

echo Installing dependencies (npm install)...
call npm install

echo.
echo Launching development server (npm run dev)...
npm run dev

pause
