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
using System.Net.NetworkInformation;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// 配置 Kestrel
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 104857600; // 設置為 100MB
    serverOptions.Limits.MaxRequestBufferSize = 104857600;
});

// 動態端口配置
if (builder.Environment.IsDevelopment())
{
    var urls = builder.Configuration["urls"] ?? builder.Configuration["applicationUrl"];
    
    if (string.IsNullOrEmpty(urls))
    {
        // 自動選擇可用端口
        var (httpPort, httpsPort) = PortHelper.FindAvailablePortPair(5000);
        urls = $"http://localhost:{httpPort};https://localhost:{httpsPort}";
    }
    else
    {
        // 檢查配置的端口是否可用
        var urlList = urls.Split(';');
        var availableUrls = new List<string>();
        
        foreach (var url in urlList)
        {
            if (Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri))
            {
                if (PortHelper.IsPortAvailable(uri.Port))
                {
                    availableUrls.Add(url.Trim());
                }
                else
                {
                    var newPort = PortHelper.FindAvailablePort(uri.Port + 1, uri.Port + 100);
                    var newUrl = $"{uri.Scheme}://{uri.Host}:{newPort}";
                    availableUrls.Add(newUrl);
                }
            }
        }
        
        urls = string.Join(";", availableUrls);
    }
    
    builder.WebHost.UseUrls(urls);
}

// Add services to the container.
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 104857600; // 設置為 100MB
});

// 設置請求大小限制
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 設置為 100MB
    options.ValueLengthLimit = 104857600;
    options.MultipartHeadersLengthLimit = 104857600;
});

builder.Services.AddControllers(options =>
{
    options.MaxValidationDepth = 32;
}).ConfigureApiBehaviorOptions(options =>
{
    options.SuppressModelStateInvalidFilter = false;
    options.InvalidModelStateResponseFactory = actionContext =>
        new BadRequestObjectResult(new
        {
            Status = 400,
            Errors = actionContext.ModelState.Where(e => e.Value.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                )
        });
})
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();

// 配置 Swagger UI 中文化
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "💼 員工智慧考核系統 API",
        Version = "v1.0.0",
        Description = @"
## 📋 系統概述
員工績效管理與積分評估系統後端API，提供完整的人事管理、積分計算、檔案上傳等功能。

## 🔐 認證說明
- 使用Bearer Token進行身份驗證
- 請先透過登入API取得授權令牌
- 在後續請求中加入 Authorization: Bearer {token}

## 📚 主要功能模組
- **帳號認證管理**: 註冊、登入、職位驗證
- **積分管理系統**: 積分提交、審核、統計分析  
- **檔案上傳處理**: 證明文件上傳與管理
- **工作日誌記錄**: 工作記錄提交與查詢
- **系統健康監控**: 服務狀態檢查與監控

## 🌐 環境資訊
- **開發環境**: 支援動態端口配置與CORS
- **資料庫**: PostgreSQL
- **檔案存儲**: 本地檔案系統
        ",
        //License = new OpenApiLicense
        //{
        //    Name = "內部使用授權",
        //    Url = new Uri("https://example.com/license")
        //}
    });

    // 啟用XML註釋文件以顯示詳細的API說明
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
    }

    // 配置授權UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = @"JWT授權標頭使用Bearer格式。
                      
請在下方輸入框中輸入 'Bearer' [空格] 接著輸入您的token。
                      
範例: 'Bearer 12345abcdef'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });

    // 啟用支援操作過濾器以美化顯示
    c.EnableAnnotations();
    
    // 自訂排序（將認證相關API置頂）
    c.OrderActionsBy((apiDesc) => $"{apiDesc.ActionDescriptor.RouteValues["controller"]}_{apiDesc.HttpMethod}");
});

// Add Entity Framework - 使用PostgreSQL數據庫
builder.Services.AddDbContext<PointsDbContext>(options =>
{
    // 開發和生產環境都使用PostgreSQL
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Add CORS - 支持動態端口配置
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // 開發環境：允許來自任何本地端口的請求
            policy.SetIsOriginAllowed(origin =>
            {
                if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return uri.Host == "localhost" || 
                           uri.Host == "127.0.0.1" || 
                           uri.Host == "::1";
                }
                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        }
        else
        {
            // 生產環境：限制特定來源
            policy.WithOrigins("https://yourdomain.com")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// Add custom services
builder.Services.AddScoped<IPointsCalculationService, PointsCalculationService>();
builder.Services.AddScoped<IStandardsService, StandardsService>();
builder.Services.AddScoped<IWorkLogService, WorkLogService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IReviewPermissionService, ReviewPermissionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Add health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<PointsDbContext>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 在開發環境中先使用CORS，避免HTTPS重定向干擾preflight請求
app.UseCors("AllowReactApp");

// 僅在非開發環境使用HTTPS重定向
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

// 添加根路徑重定向到Swagger
app.MapGet("/", () => Results.Redirect("/swagger"));

// 服務器配置端點已移至 ApiController，避免重複路由

// Map health checks
app.MapHealthChecks("/health");
app.MapControllers();

// Ensure database is created and seeded
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

// 改善的錯誤處理，特別針對端口衝突
try
{
    Console.WriteLine(">> 積分管理系統 v9 啟動中...");
    Console.WriteLine(">> PostgreSQL 資料庫連接成功");
    
    if (app.Environment.IsDevelopment())
    {
        Console.WriteLine(">> API文檔: http://localhost:5001/swagger");
    }
    
    app.Run();
}
catch (IOException ex) when (ex.Message.Contains("address already in use") || ex.Message.Contains("地址已在使用中"))
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("ERROR: 端口已被占用！");
    Console.WriteLine($"詳細錯誤：{ex.Message}");
    Console.WriteLine("\n解決方案：");
    Console.WriteLine("1. 檢查是否有其他 PointsManagementAPI 實例正在運行");
    Console.WriteLine("2. 使用以下命令檢查端口占用：");
    Console.WriteLine("   netstat -ano | findstr :7001");
    Console.WriteLine("3. 終止占用進程：");
    Console.WriteLine("   taskkill /PID [進程ID] /F");
    Console.WriteLine("4. 或修改 launchSettings.json 中的端口配置");
    Console.ResetColor();
    Environment.Exit(1);
}
catch (Exception ex)
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("ERROR: 應用程序啟動失敗！");
    Console.WriteLine($"錯誤類型：{ex.GetType().Name}");
    Console.WriteLine($"錯誤訊息：{ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"內部錯誤：{ex.InnerException.Message}");
    }
    Console.WriteLine($"堆疊追蹤：{ex.StackTrace}");
    Console.ResetColor();
    Environment.Exit(1);
}

// 動態端口配置輔助類
public static class PortHelper
{
    public static int FindAvailablePort(int startPort = 5000, int maxPort = 6000)
    {
        for (int port = startPort; port < maxPort; port++)
        {
            if (IsPortAvailable(port))
                return port;
        }
        throw new InvalidOperationException($"無法在範圍 {startPort}-{maxPort} 中找到可用端口");
    }
    
    public static bool IsPortAvailable(int port)
    {
        try
        {
            var ipGlobalProperties = IPGlobalProperties.GetIPGlobalProperties();
            var tcpEndPoints = ipGlobalProperties.GetActiveTcpListeners();
            
            return !tcpEndPoints.Any(endpoint => endpoint.Port == port);
        }
        catch
        {
            return false;
        }
    }
    
    public static (int httpPort, int httpsPort) FindAvailablePortPair(int startPort = 5000)
    {
        int httpPort = FindAvailablePort(startPort, startPort + 1000);
        int httpsPort = FindAvailablePort(httpPort + 1000, httpPort + 2000);
        
        return (httpPort, httpsPort);
    }
}