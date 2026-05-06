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
echo   [1] Add New Entry
echo   [2] Edit Entry
echo   [3] Manage Tasks
echo   [4] Open Dashboard
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
cd app
call npm run log
cd ..
exit

:edit
echo.
echo Starting: Edit Entry...
echo.
cd app
call npm run edit
cd ..
exit

:tasks
echo.
echo Starting: Manage Tasks...
echo.
cd app
call npm run task
cd ..
exit

:dashboard
echo.
echo Opening Dashboard in browser...
start index.html
exit

:exit
echo.
echo Goodbye! Have a productive day.
timeout /t 2 >nul
exit
