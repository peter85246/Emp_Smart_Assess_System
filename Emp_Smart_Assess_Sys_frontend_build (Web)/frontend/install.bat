@echo off
chcp 65001 > nul
echo [系統] 安裝前端服務所需套件...

cd /d "%~dp0"
call npm install

if errorlevel 1 (
    echo [錯誤] 套件安裝失敗
    pause
    exit /b 1
)

echo [成功] 套件安裝完成！
pause