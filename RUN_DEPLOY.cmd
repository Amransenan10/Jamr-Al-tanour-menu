@echo off
title Deploy to Vercel
cd /d "c:\Users\Abdulwasea\Desktop\jamr altanuor"
echo.
echo ====================================
echo   Deploying Updates to Vercel
echo ====================================
echo.
echo [1/4] Clearing git rebase state...
git rebase --abort
git merge --abort
echo.
echo [2/4] Staging files...
git add -A
echo.
echo [3/4] Committing...
git commit -m "fix: phone validation inline error and cashier order status"
echo.
echo [4/4] Pushing to Vercel...
git push origin main
if %ERRORLEVEL% NEQ 0 git push origin master
if %ERRORLEVEL% NEQ 0 git push
echo.
echo ====================================
echo   DONE! Changes pushed successfully.
echo ====================================
pause
