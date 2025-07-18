using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Models.PointsModels;
using PointsManagementAPI.Models.WorkLogModels;
using PointsManagementAPI.Models.UserModels;
using PointsManagementAPI.Models;

namespace PointsManagementAPI.Data
{
    public class PointsDbContext : DbContext
    {
        public PointsDbContext(DbContextOptions<PointsDbContext> options) : base(options)
        {
        }

        // Points Management Tables
        public DbSet<StandardSetting> StandardSettings { get; set; }
        public DbSet<PointsEntry> PointsEntries { get; set; }
        public DbSet<PointsCategory> PointsCategories { get; set; }
        public DbSet<CalculationRule> CalculationRules { get; set; }

        // Work Log Tables
        public DbSet<WorkLog> WorkLogs { get; set; }
        public DbSet<LogCategory> LogCategories { get; set; }

        // User Management Tables
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<TargetSetting> TargetSettings { get; set; }

        // File Management Tables
        public DbSet<FileAttachment> FileAttachments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure StandardSetting self-referencing relationship
            modelBuilder.Entity<StandardSetting>()
                .HasOne(s => s.Parent)
                .WithMany(s => s.Children)
                .HasForeignKey(s => s.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // 明確配置 PointsCategory 和 StandardSetting 之間沒有直接關係
            modelBuilder.Entity<PointsCategory>()
                .Ignore(pc => pc.StandardSettings);

            // Configure PointsEntry relationship
            modelBuilder.Entity<PointsEntry>()
                .HasOne(p => p.Standard)
                .WithMany(s => s.PointsEntries)
                .HasForeignKey(p => p.StandardId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Employee relationships
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure TargetSetting relationship
            modelBuilder.Entity<TargetSetting>()
                .HasOne(t => t.Employee)
                .WithMany(e => e.TargetSettings)
                .HasForeignKey(t => t.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Departments
            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "製造部", Description = "生產製造部門" },
                new Department { Id = 2, Name = "品質工程部", Description = "品質控制與工程部門" },
                new Department { Id = 3, Name = "管理部", Description = "行政管理部門" },
                new Department { Id = 4, Name = "業務部", Description = "業務銷售部門" }
            );

            // Seed Log Categories
            modelBuilder.Entity<LogCategory>().HasData(
                new LogCategory { Id = 1, Name = "生產作業", Color = "#10B981" },
                new LogCategory { Id = 2, Name = "品質檢驗", Color = "#3B82F6" },
                new LogCategory { Id = 3, Name = "設備維護", Color = "#F59E0B" },
                new LogCategory { Id = 4, Name = "改善提案", Color = "#8B5CF6" },
                new LogCategory { Id = 5, Name = "教育訓練", Color = "#EF4444" },
                new LogCategory { Id = 6, Name = "其他事項", Color = "#6B7280" }
            );

            // Seed Points Categories
            modelBuilder.Entity<PointsCategory>().HasData(
                new PointsCategory { Id = 1, Name = "一般積分", Type = "general", Description = "基本工作項目" },
                new PointsCategory { Id = 2, Name = "專業積分", Type = "professional", Description = "技術專業項目" },
                new PointsCategory { Id = 3, Name = "管理積分", Type = "management", Description = "管理職能項目" },
                new PointsCategory { Id = 4, Name = "核心職能積分", Type = "core", Description = "全體適用核心職能", Multiplier = 1.0m }
            );
        }
    }
}
