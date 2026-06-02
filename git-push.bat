@echo off
echo ===================================================
echo [Waspadagempa] Committing and Pushing to GitHub...
echo ===================================================
echo.

echo Adding all changes...
git add -A

echo.
echo Committing changes...
git commit -m "fix: update local repository files"

echo.
echo Pushing to GitHub main branch...
git push origin main

echo.
echo ===================================================
echo Done! Changes successfully pushed to GitHub.
echo ===================================================
pause
