@echo off
chcp 65001 > nul
echo Starting backend service...

rem Set environment variables
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://localhost:5001

rem Run the application
dotnet PointsManagementAPI.dll
