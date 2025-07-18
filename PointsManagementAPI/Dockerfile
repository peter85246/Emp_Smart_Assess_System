# 使用官方 .NET 8.0 SDK 作為建置映像
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 複製專案檔案並還原依賴
COPY ["PointsManagementAPI.csproj", "."]
RUN dotnet restore "PointsManagementAPI.csproj"

# 複製所有原始碼並建置應用程式
COPY . .
WORKDIR "/src"
RUN dotnet build "PointsManagementAPI.csproj" -c Release -o /app/build

# 發布應用程式
FROM build AS publish
RUN dotnet publish "PointsManagementAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 使用官方 .NET 8.0 Runtime 作為執行映像
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# 安裝必要的系統套件
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 創建非 root 用戶
RUN addgroup --system --gid 1001 appgroup \
    && adduser --system --uid 1001 --gid 1001 appuser

# 創建上傳目錄並設定權限
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads

# 複製發布的應用程式
COPY --from=publish /app/publish .

# 設定檔案權限
RUN chown -R appuser:appgroup /app

# 切換到非 root 用戶
USER appuser

# 暴露端口
EXPOSE 5000

# 設定環境變數
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# 啟動應用程式
ENTRYPOINT ["dotnet", "PointsManagementAPI.dll"]
