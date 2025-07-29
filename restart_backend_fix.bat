@echo off
echo 正在重啟後端服務...

echo 終止現有的dotnet進程...
taskkill /F /IM dotnet.exe 2>nul
taskkill /F /IM PointsManagementAPI.exe 2>nul

echo 等待進程完全終止...
timeout /t 2 /nobreak >nul

echo 進入後端目錄...
cd PointsManagementAPI

echo 編譯後端專案...
dotnet build

if %ERRORLEVEL% EQU 0 (
    echo 編譯成功，啟動後端服務...
    start "後端服務" dotnet run
    echo 後端服務已啟動！
) else (
    echo 編譯失敗，請檢查錯誤訊息
    pause
)

echo 修復完成：
echo - 總經理提交積分後，不會收到自己的通知
echo - 董事長會收到總經理提交積分的通知
echo.
echo 請測試：
echo 1. 登入總經理帳號提交積分
echo 2. 登入董事長帳號查看是否收到鈴鐺通知
echo.
pause 