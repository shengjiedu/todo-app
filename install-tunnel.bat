@echo off
chcp 65001 >nul
echo ========================================
echo   Cloudflare 永久隧道安装脚本
echo ========================================
echo.

set CLOUDFLARED=C:\Users\20183\cloudflared.exe

if not exist "%CLOUDFLARED%" (
  echo [错误] 找不到 cloudflared.exe
  echo 请确保 cloudflared.exe 在 C:\Users\20183\ 目录下
  pause
  exit /b 1
)

echo [1/4] 登录 Cloudflare（会弹出浏览器）...
"%CLOUDFLARED%" tunnel login
if errorlevel 1 (
  echo [错误] 登录失败
  pause
  exit /b 1
)

echo.
echo [2/4] 创建永久隧道...
"%CLOUDFLARED%" tunnel create todo-app

echo.
echo [3/4] 创建配置文件模板...
if not exist "C:\Users\20183\.cloudflared" mkdir "C:\Users\20183\.cloudflared"

echo 请查看 TUNNEL-SETUP.md 完成后续配置
echo.
echo [4/4] 安装 Windows 服务（需要管理员权限）...
echo 请以管理员身份运行以下命令：
echo   cd C:\Users\20183
echo   cloudflared.exe service install
echo   cloudflared.exe service start
echo.

pause
