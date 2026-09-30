@echo off
title Deploy to Vercel
cd /d "c:\Users\Abdulwasea\Desktop\jamr altanuor"
echo.
echo ====================================
echo   Deploying Updates to Vercel
echo ====================================
echo.
echo [1/3] Staging files...
git add -A
echo.
echo [2/3] Committing...
git commit -m "fix: phone validation inline error and cashier order status"
echo.
echo [3/3] Pushing to Vercel...
git push origin main --force
echo.
echo ====================================
echo   SUCCESS! Pushed to Vercel!
echo ====================================
pause
