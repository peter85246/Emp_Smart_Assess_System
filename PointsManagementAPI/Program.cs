using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using PointsManagementAPI.Data;
using PointsManagementAPI.Services;
using System.Net;
using System.Net.NetworkInformation;

var builder = WebApplication.CreateBuilder(args);

// 動態端口配置
if (builder.Environment.IsDevelopment())
{
    var urls = builder.Configuration["urls"] ?? builder.Configuration["applicationUrl"];
    
    if (string.IsNullOrEmpty(urls))
    {
        // 自動選擇可用端口
        var (httpPort, httpsPort) = PortHelper.FindAvailablePortPair(5000);
        urls = $"http://localhost:{httpPort};https://localhost:{httpsPort}";
        
        Console.WriteLine($"🔧 自動選擇可用端口:");
        Console.WriteLine($"   HTTP:  http://localhost:{httpPort}");
        Console.WriteLine($"   HTTPS: https://localhost:{httpsPort}");
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
                    Console.WriteLine($"⚠️  端口 {uri.Port} 已被占用，正在尋找替代端口...");
                    
                    var newPort = PortHelper.FindAvailablePort(uri.Port + 1, uri.Port + 100);
                    var newUrl = $"{uri.Scheme}://{uri.Host}:{newPort}";
                    availableUrls.Add(newUrl);
                    
                    Console.WriteLine($"✅ 使用替代端口: {newUrl}");
                }
            }
        }
        
        urls = string.Join(";", availableUrls);
    }
    
    builder.WebHost.UseUrls(urls);
}

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Entity Framework - 使用PostgreSQL數據庫
builder.Services.AddDbContext<PointsDbContext>(options =>
{
    // 開發和生產環境都使用PostgreSQL
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    Console.WriteLine("🔧 使用PostgreSQL數據庫");
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
    Console.WriteLine("🚀 正在啟動 PointsManagement API...");
    Console.WriteLine($"🌍 環境: {app.Environment.EnvironmentName}");
    
    // 顯示實際使用的URL
    var urls = app.Urls.Any() ? string.Join(", ", app.Urls) : "動態選擇端口";
    Console.WriteLine($"📡 監聽地址: {urls}");
    
    if (app.Environment.IsDevelopment())
    {
        Console.WriteLine("💡 開發環境特性:");
        Console.WriteLine("   ✅ 支援任何本地端口的CORS請求");
        Console.WriteLine("   ✅ 自動端口衝突解決");
        Console.WriteLine("   ✅ Swagger UI 已啟用");
    }
    
    app.Run();
}
catch (IOException ex) when (ex.Message.Contains("address already in use") || ex.Message.Contains("地址已在使用中"))
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("❌ 錯誤：端口已被占用！");
    Console.WriteLine($"詳細錯誤：{ex.Message}");
    Console.WriteLine("\n🔧 解決方案：");
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
    Console.WriteLine("❌ 應用程序啟動失敗！");
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