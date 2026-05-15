@echo off
chcp 65001 >nul
echo ========================================
echo   每日待办规划器启动脚本
echo ========================================
echo.

set BACKEND_DIR=%~dp0backend
set FRONTEND_DIR=%~dp0frontend

echo [1/3] 启动后端服务...
start "Backend" cmd /k "cd /d "%BACKEND_DIR%" && node server.js"

timeout /t 2 /nobreak >nul

echo [2/3] 启动前端服务...
start "Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] 服务已启动！
echo.
echo 本地访问: http://localhost:3000
echo 后端 API: http://localhost:3001
echo.
echo 如需手机远程访问，请运行:
echo   cloudflared tunnel --url http://localhost:3000
echo.
pause
