# 🔐 CORS 跨域問題解決與測試說明書

## 1️⃣ 問題現象

在打包後的專案中，前端（http://localhost:3000）呼叫後端 API（http://localhost:5001）時出現跨域錯誤：

```
Access to fetch at 'http://localhost:5001/api/auth/login' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present...
```

## 2️⃣ 專案配置檢查與修改

### 2.1 後端配置（Program.cs）

原始配置：
```csharp
// 原始的 CORS 配置可能不完整或位置不正確
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(origin => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins("https://yourdomain.com");
        }
    });
});
```

修改後：
```csharp
// 更完整的 CORS 配置
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition", "File-Name")
              .SetPreflightMaxAge(TimeSpan.FromSeconds(3600));
    });
});

var app = builder.Build();

// 重要：CORS 中間件順序
app.UseRouting();
app.UseCors();  // 在 UseRouting 之後，UseAuthorization 之前
app.UseAuthorization();
```

### 2.2 前端配置（apiConfig.js）

```javascript
export const API_CONFIG = {
  // 修改為統一使用 HTTP
  BASE_URL: 'http://localhost:5001/api',
  
  // API 端點配置保持不變
  ENDPOINTS: {
    auth: {
      login: '/auth/login',
      // ... 其他端點
    }
  }
};
```

### 2.3 環境配置（appsettings.json）

```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://localhost:5001"
      }
    }
  }
}
```

## 3️⃣ 解決方案說明

### 主要修改點：

1. **統一使用 HTTP 協議**
   - 移除 HTTPS 重定向
   - 前後端統一使用 HTTP 協議避免混合內容問題

2. **CORS 配置優化**
   - 明確指定允許的來源
   - 添加必要的 CORS 標頭
   - 正確設置中間件順序

3. **啟動腳本優化**
   - 使用 `run_backend.bat` 正確啟動後端服務
   - 確保前端服務正確運行

## 4️⃣ 測試方法

### 4.1 後端服務測試

使用 curl 測試 CORS 預檢請求：
```bash
curl -i -X OPTIONS "http://localhost:5001/api/auth/login" ^
  -H "Origin: http://localhost:3000" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: content-type"
```

預期回應應包含：
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: content-type
```

### 4.2 前端測試

1. 啟動服務：
```bash
cd "Emp_Smart_Assess_Sys_frontend_build (Web)"
start.bat
```

2. 在瀏覽器開發者工具中檢查網路請求：
   - 確認請求 URL 為 http://localhost:5001/api/auth/login
   - 確認請求標頭中包含正確的 Origin
   - 確認回應標頭中包含正確的 CORS 標頭

## 5️⃣ 故障排除

如果仍然遇到 CORS 問題：

1. **檢查服務狀態**
   ```bash
   netstat -ano | findstr ":5001"
   netstat -ano | findstr ":3000"
   ```

2. **重啟服務**
   ```bash
   stop.bat
   start.bat
   ```

3. **檢查日誌**
   - 查看瀏覽器控制台錯誤訊息
   - 查看後端服務輸出

## 6️⃣ 注意事項

1. 本地開發環境使用 HTTP 協議
2. 生產環境應使用 HTTPS
3. CORS 配置應根據實際需求調整允許的來源
4. 確保中間件順序正確
5. 避免在開發環境中使用 HTTPS 重定向

## 7️⃣ 相關文件

- Program.cs：後端主程式配置
- appsettings.json：後端設定檔
- apiConfig.js：前端 API 配置
- start.bat：啟動腳本
- stop.bat：停止腳本

## 8️⃣ 參考資料

- [ASP.NET Core CORS 官方文件](https://docs.microsoft.com/zh-tw/aspnet/core/security/cors)
- [Stack Overflow - CORS 問題解決方案](https://stackoverflow.com/questions/61238680/access-to-fetch-at-from-origin-http-localhost3000-has-been-blocked-by-cors)
- [iThome - 跨域資源共用（CORS）解說](https://ithelp.ithome.com.tw/articles/10267360)

## 9️⃣ 完整的 Program.cs 範例

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.IIS;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using PointsManagementAPI.Data;
using PointsManagementAPI.Services;
using System.Net;

var builder = WebApplication.CreateBuilder(args);

// 配置 Kestrel 服務器
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    // 設置請求大小限制為 100MB
    serverOptions.Limits.MaxRequestBodySize = 104857600;
    serverOptions.Limits.MaxRequestBufferSize = 104857600;
});

// 配置 IIS 選項
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 104857600; // 100MB
});

// 配置表單選項
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100MB
    options.ValueLengthLimit = 104857600;
    options.MultipartHeadersLengthLimit = 104857600;
});

// ⭐ CORS 配置 - 關鍵部分
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")  // 允許的前端來源
              .AllowAnyMethod()                      // 允許任何 HTTP 方法
              .AllowAnyHeader()                      // 允許任何標頭
              .AllowCredentials()                    // 允許攜帶認證資訊
              .WithExposedHeaders("Content-Disposition", "File-Name")  // 允許前端讀取的額外標頭
              .SetPreflightMaxAge(TimeSpan.FromSeconds(3600));        // 預檢請求快取時間
    });
});

// 配置控制器
builder.Services.AddControllers(options =>
{
    options.MaxValidationDepth = 32;
})
.ConfigureApiBehaviorOptions(options =>
{
    // 自定義模型驗證錯誤回應
    options.InvalidModelStateResponseFactory = actionContext =>
        new BadRequestObjectResult(new
        {
            Status = 400,
            Errors = actionContext.ModelState
                .Where(e => e.Value.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                )
        });
})
.AddJsonOptions(options =>
{
    // JSON 序列化配置
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
});

// Swagger 配置
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "💼 員工智慧考核系統 API",
        Version = "v1.0.0",
        Description = "員工績效管理與積分評估系統後端API"
    });
});

// 資料庫配置
builder.Services.AddDbContext<PointsDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// 註冊服務
builder.Services.AddScoped<IPointsCalculationService, PointsCalculationService>();
builder.Services.AddScoped<IStandardsService, StandardsService>();
builder.Services.AddScoped<IWorkLogService, WorkLogService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IReviewPermissionService, ReviewPermissionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// 健康檢查
builder.Services.AddHealthChecks()
    .AddDbContextCheck<PointsDbContext>();

var app = builder.Build();

// ⭐ 中間件配置順序 - 關鍵部分
app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();           // 1. 路由中間件

app.UseCors();             // 2. CORS 中間件（在路由之後，授權之前）

app.UseAuthorization();    // 3. 授權中間件

// 路由配置
app.MapHealthChecks("/health");
app.MapControllers();

// 資料庫初始化
try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<PointsDbContext>();
        await SeedData.InitializeAsync(context);
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Database initialization failed: {ex.Message}");
}

// 啟動應用程式
try
{
    Console.WriteLine(">> 積分管理系統 v9 啟動中...");
    Console.WriteLine(">> PostgreSQL 資料庫連接成功");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"Application startup failed: {ex.Message}");
    Environment.Exit(1);
}
```

### 重要說明：

1. **CORS 配置重點**：
   - 使用 `AddDefaultPolicy` 而不是具名策略，簡化配置
   - 明確指定允許的來源 `WithOrigins`
   - 設置預檢請求快取時間，減少 OPTIONS 請求
   - 允許必要的標頭和認證資訊

2. **中間件順序**：
   - `UseRouting` → `UseCors` → `UseAuthorization`
   - 這個順序確保 CORS 策略在正確的時機被應用

3. **錯誤處理**：
   - 包含完整的錯誤處理邏輯
   - 提供友善的錯誤訊息
   - 記錄關鍵錯誤資訊

4. **安全性考慮**：
   - 設置適當的請求大小限制
   - 配置模型驗證
   - 使用安全的 JSON 序列化選項