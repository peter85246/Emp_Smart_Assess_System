@echo off
chcp 65001 > nul
echo Stopping all services...

taskkill /F /IM "dotnet.exe" > nul 2>&1
taskkill /F /IM "node.exe" > nul 2>&1

echo Services stopped successfully.
timeout /t 2 > nul