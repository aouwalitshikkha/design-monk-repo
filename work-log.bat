@echo off
chcp 65001 >nul
title Design Monk Work Log Manager

:menu
cls
echo.
echo ============================================
echo   Design Monk Work Log Manager
echo ============================================
echo.
echo   [1] Add New Entry  (npm run log)
echo   [2] Edit Entry     (npm run edit)
echo   [3] Manage Tasks   (npm run task)
echo   [4] Open Dashboard (index.html)
echo   [5] Exit
echo.
echo ============================================
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto entry
if "%choice%"=="2" goto edit
if "%choice%"=="3" goto tasks
if "%choice%"=="4" goto dashboard
if "%choice%"=="5" goto exit

echo.
echo Invalid choice! Please try again.
timeout /t 2 >nul
goto menu

:entry
echo.
echo Starting: Add New Entry...
echo.
call npm run log
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:edit
echo.
echo Starting: Edit Entry...
echo.
call npm run edit
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:tasks
echo.
echo Starting: Manage Tasks...
echo.
call npm run task
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:dashboard
echo.
echo Opening Dashboard in browser...
start index.html
goto menu

:exit
echo.
echo Goodbye! Have a productive day.
timeout /t 2 >nul
exit
