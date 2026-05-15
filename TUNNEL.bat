@echo off
chcp 65001 >nul
echo ========================================
echo   Cloudflare Tunnel 启动（手机访问用）
echo ========================================
echo.
echo 首次使用请先运行: cloudflared tunnel login
echo.
cloudflared tunnel --url http://localhost:3000
pause
