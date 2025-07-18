using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PointsManagementAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixWorkLogAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalculationRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RuleType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Conditions = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Value = table.Column<decimal>(type: "numeric", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalculationRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FileAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    EntityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EntityId = table.Column<int>(type: "integer", nullable: false),
                    UploadedBy = table.Column<int>(type: "integer", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileAttachments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LogCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PointsCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Multiplier = table.Column<decimal>(type: "numeric", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointsCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StandardSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CategoryName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ParentId = table.Column<int>(type: "integer", nullable: true),
                    DepartmentId = table.Column<int>(type: "integer", nullable: true),
                    PositionId = table.Column<int>(type: "integer", nullable: true),
                    PointsValue = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    CalculationFormula = table.Column<string>(type: "text", nullable: true),
                    InputType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PointsType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StandardSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StandardSettings_StandardSettings_ParentId",
                        column: x => x.ParentId,
                        principalTable: "StandardSettings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EmployeeNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DepartmentId = table.Column<int>(type: "integer", nullable: false),
                    Position = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    HireDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsFirstLogin = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Employees_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PointsEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmployeeId = table.Column<int>(type: "integer", nullable: false),
                    StandardId = table.Column<int>(type: "integer", nullable: false),
                    EntryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PointsEarned = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    BasePoints = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    BonusPoints = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    PenaltyPoints = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    PromotionMultiplier = table.Column<decimal>(type: "numeric(3,2)", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    EvidenceFiles = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReviewedBy = table.Column<int>(type: "integer", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewComments = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointsEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PointsEntries_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PointsEntries_StandardSettings_StandardId",
                        column: x => x.StandardId,
                        principalTable: "StandardSettings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TargetSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmployeeId = table.Column<int>(type: "integer", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Month = table.Column<int>(type: "integer", nullable: false),
                    TargetPoints = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    MinimumPassingPercentage = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TargetSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TargetSettings_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmployeeId = table.Column<int>(type: "integer", nullable: false),
                    LogDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: true),
                    CategoryId = table.Column<int>(type: "integer", nullable: true),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Attachments = table.Column<string>(type: "text", nullable: true),
                    PointsClaimed = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReviewedBy = table.Column<int>(type: "integer", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewComments = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkLogs_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkLogs_LogCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "LogCategories",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Departments",
                columns: new[] { "Id", "CreatedAt", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8027), "生產製造部門", true, "製造部" },
                    { 2, new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8033), "品質控制與工程部門", true, "品質工程部" },
                    { 3, new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8034), "行政管理部門", true, "管理部" },
                    { 4, new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8035), "業務銷售部門", true, "業務部" }
                });

            migrationBuilder.InsertData(
                table: "LogCategories",
                columns: new[] { "Id", "Color", "CreatedAt", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "#10B981", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8198), null, true, "生產作業" },
                    { 2, "#3B82F6", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8203), null, true, "品質檢驗" },
                    { 3, "#F59E0B", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8205), null, true, "設備維護" },
                    { 4, "#8B5CF6", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8206), null, true, "改善提案" },
                    { 5, "#EF4444", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8206), null, true, "教育訓練" },
                    { 6, "#6B7280", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8207), null, true, "其他事項" }
                });

            migrationBuilder.InsertData(
                table: "PointsCategories",
                columns: new[] { "Id", "Color", "CreatedAt", "Description", "IsActive", "Multiplier", "Name", "Type" },
                values: new object[,]
                {
                    { 1, "#3B82F6", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8246), "基本工作項目", true, 1.0m, "一般積分", "general" },
                    { 2, "#3B82F6", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8253), "技術專業項目", true, 1.0m, "專業積分", "professional" },
                    { 3, "#3B82F6", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8255), "管理職能項目", true, 1.0m, "管理積分", "management" },
                    { 4, "#3B82F6", new DateTime(2025, 7, 17, 3, 12, 15, 753, DateTimeKind.Utc).AddTicks(8256), "全體適用核心職能", true, 1.0m, "核心職能積分", "core" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_DepartmentId",
                table: "Employees",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PointsEntries_EmployeeId",
                table: "PointsEntries",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_PointsEntries_StandardId",
                table: "PointsEntries",
                column: "StandardId");

            migrationBuilder.CreateIndex(
                name: "IX_StandardSettings_ParentId",
                table: "StandardSettings",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_TargetSettings_EmployeeId",
                table: "TargetSettings",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkLogs_CategoryId",
                table: "WorkLogs",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkLogs_EmployeeId",
                table: "WorkLogs",
                column: "EmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalculationRules");

            migrationBuilder.DropTable(
                name: "FileAttachments");

            migrationBuilder.DropTable(
                name: "PointsCategories");

            migrationBuilder.DropTable(
                name: "PointsEntries");

            migrationBuilder.DropTable(
                name: "TargetSettings");

            migrationBuilder.DropTable(
                name: "WorkLogs");

            migrationBuilder.DropTable(
                name: "StandardSettings");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropTable(
                name: "LogCategories");

            migrationBuilder.DropTable(
                name: "Departments");
        }
    }
}
