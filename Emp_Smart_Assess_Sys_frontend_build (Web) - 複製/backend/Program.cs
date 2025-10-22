using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.IIS;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using PointsManagementAPI.Data;
using PointsManagementAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------
// 【固定後端只跑 HTTP 5001】避免踩到 https 5001 的預設
// ---------------------------------------------------------
builder.WebHost.UseUrls("http://localhost:5001");

// ---------------------------------------------------------
// 上傳大小等一般設定（保留你原本的）
// ---------------------------------------------------------
builder.Services.Configure<IISServerOptions>(o =>
{
    o.MaxRequestBodySize = 104857600; // 100MB
});
builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 104857600; // 100MB
    o.ValueLengthLimit = 104857600;
    o.MultipartHeadersLengthLimit = 104857600;
});

// ---------------------------------------------------------
// Controllers / JSON
// ---------------------------------------------------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ---------------------------------------------------------
// EF DbContext
// ---------------------------------------------------------
builder.Services.AddDbContext<PointsDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// ---------------------------------------------------------
// 你的自訂服務
// ---------------------------------------------------------
builder.Services.AddScoped<IPointsCalculationService, PointsCalculationService>();
builder.Services.AddScoped<IStandardsService, StandardsService>();
builder.Services.AddScoped<IWorkLogService, WorkLogService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IReviewPermissionService, ReviewPermissionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// ---------------------------------------------------------
// Health Checks
// ---------------------------------------------------------
builder.Services.AddHealthChecks().AddDbContextCheck<PointsDbContext>();

// ---------------------------------------------------------
// CORS（命名策略 + 明確來源 http://localhost:3000）
// ---------------------------------------------------------
const string Allow3000 = "Allow3000";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: Allow3000, policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition", "File-Name");
    });
});

var app = builder.Build();

// ---------------------------------------------------------
// 中介軟體順序（關鍵）：Routing → CORS → Authorization → Map*
// ---------------------------------------------------------
app.UseSwagger();
app.UseSwaggerUI();

// ⚠ 不要呼叫 UseHttpsRedirection()，因為我們現在只跑 http:5001
app.UseRouting();

// 套用命名 CORS 策略（一定要在 Routing 之後、Authorization 之前）
app.UseCors(Allow3000);

app.UseAuthorization();

// ---------------------------------------------------------
// 保險：讓所有 OPTIONS 都能吃到 CORS 標頭
// ---------------------------------------------------------
app.MapControllers().RequireCors(Allow3000);
app.MapHealthChecks("/health").RequireCors(Allow3000);

// ---------------------------------------------------------
// DB Seed（保留你的流程）
// ---------------------------------------------------------
try
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<PointsDbContext>();
    await SeedData.InitializeAsync(context);
}
catch (Exception ex)
{
    Console.WriteLine($"Database initialization failed: {ex.Message}");
}

// ---------------------------------------------------------
// Run
// ---------------------------------------------------------
try
{
    Console.WriteLine(">> 積分管理系統 v9 啟動中...");
    Console.WriteLine(">> 後端 API： http://localhost:5001");
    Console.WriteLine(">> 允許的前端來源： http://localhost:3000");
    Console.WriteLine(">> CORS： 命名策略 + 萬用 OPTIONS 已啟用");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"Application startup failed: {ex.Message}");
    Environment.Exit(1);
}
