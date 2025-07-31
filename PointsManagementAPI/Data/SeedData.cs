using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Models.UserModels;
using PointsManagementAPI.Models.PointsModels;
using PointsManagementAPI.Models.WorkLogModels;

namespace PointsManagementAPI.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(PointsDbContext context)
        {
            // 確保資料庫已創建
            await context.Database.EnsureCreatedAsync();

            // 檢查是否已有部門資料
            if (!await context.Departments.AnyAsync())
            {
                // 創建部門資料
                var departments = new List<Department>
                {
                    new Department
                    {
                        Name = "製造部",
                        Description = "生產製造相關工作部門",
                        IsActive = true
                    },
                    new Department
                    {
                        Name = "品質工程部",
                        Description = "產品品質控制與工程改善部門",
                        IsActive = true
                    },
                    new Department
                    {
                        Name = "管理部",
                        Description = "行政管理與人事相關部門",
                        IsActive = true
                    },
                    new Department
                    {
                        Name = "業務部",
                        Description = "業務銷售與客戶服務部門",
                        IsActive = true
                    },
                    new Department
                    {
                        Name = "研發部",
                        Description = "產品研發與技術創新部門",
                        IsActive = true
                    },
                    new Department
                    {
                        Name = "資訊部",
                        Description = "資訊系統維護與開發部門",
                        IsActive = true
                    },
                    new Department
                    {
                        Name = "財務部",
                        Description = "財務會計與成本控制部門",
                        IsActive = true
                    },
                    new Department
                    {
                        Name = "採購部",
                        Description = "原料採購與供應商管理部門",
                        IsActive = true
                    },
                    // 新增高階管理部門
                    new Department
                    {
                        Name = "董事會",
                        Description = "公司最高決策管理層",
                        IsActive = true
                    },
                    new Department
                    {
                        Name = "經營管理層",
                        Description = "公司經營管理層級",
                        IsActive = true
                    }
                };

                await context.Departments.AddRangeAsync(departments);
                await context.SaveChangesAsync();
            }

            // 檢查是否已有積分標準設定
            if (!await context.StandardSettings.AnyAsync())
            {
                var standards = new List<StandardSetting>
                {
                    // 生產類積分
                    new StandardSetting
                    {
                        CategoryName = "刀具五金準備",
                        PointsValue = 2.0m,
                        PointsType = "production",
                        InputType = "number",
                        IsActive = true
                    },
                    new StandardSetting
                    {
                        CategoryName = "模具設定調校",
                        PointsValue = 3.0m,
                        PointsType = "production",
                        InputType = "number",
                        IsActive = true
                    },
                    new StandardSetting
                    {
                        CategoryName = "生產線作業",
                        PointsValue = 1.5m,
                        PointsType = "production",
                        InputType = "number",
                        IsActive = true
                    },
                    new StandardSetting
                    {
                        CategoryName = "品質檢驗",
                        PointsValue = 2.5m,
                        PointsType = "quality",
                        InputType = "number",
                        IsActive = true
                    },
                    new StandardSetting
                    {
                        CategoryName = "設備維護",
                        PointsValue = 3.5m,
                        PointsType = "maintenance",
                        InputType = "number",
                        IsActive = true
                    }
                };

                await context.StandardSettings.AddRangeAsync(standards);
                await context.SaveChangesAsync();
            }

            // 檢查是否已有測試員工資料
            if (!await context.Employees.AnyAsync())
            {
                var testEmployee = new Employee
                {
                    Name = "測試管理員",
                    EmployeeNumber = "ADMIN001",
                    Email = "admin@company.com",
                    DepartmentId = 3, // 管理部
                    Position = "系統管理員",
                    Role = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    HireDate = DateTime.UtcNow,
                    IsActive = true,
                    IsFirstLogin = false
                };

                await context.Employees.AddAsync(testEmployee);
                await context.SaveChangesAsync();
            }

            // 檢查是否已有工作日誌分類資料
            if (!await context.LogCategories.AnyAsync())
            {
                var logCategories = new List<LogCategory>
                {
                    new LogCategory
                    {
                        Name = "生產作業",
                        Description = "生產線作業相關工作記錄",
                        Color = "#10B981",
                        IsActive = true
                    },
                    new LogCategory
                    {
                        Name = "品質檢驗",
                        Description = "產品品質檢驗相關工作記錄",
                        Color = "#3B82F6",
                        IsActive = true
                    },
                    new LogCategory
                    {
                        Name = "設備維護",
                        Description = "設備保養維護相關工作記錄",
                        Color = "#F59E0B",
                        IsActive = true
                    },
                    new LogCategory
                    {
                        Name = "改善提案",
                        Description = "工作流程改善提案記錄",
                        Color = "#8B5CF6",
                        IsActive = true
                    },
                    new LogCategory
                    {
                        Name = "教育訓練",
                        Description = "教育訓練參與記錄",
                        Color = "#EF4444",
                        IsActive = true
                    }
                };

                await context.LogCategories.AddRangeAsync(logCategories);
                await context.SaveChangesAsync();
            }
        }
    }
}
