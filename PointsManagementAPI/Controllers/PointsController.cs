using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models.PointsModels;
using PointsManagementAPI.Services;
using System.Text.Json;

namespace PointsManagementAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PointsController : ControllerBase
    {
        private readonly PointsDbContext _context;
        private readonly IPointsCalculationService _calculationService;
        private readonly ILogger<PointsController> _logger;
        private readonly IFileStorageService _fileStorageService;

        public PointsController(PointsDbContext context, IPointsCalculationService calculationService, ILogger<PointsController> logger, IFileStorageService fileStorageService)
        {
            _context = context;
            _calculationService = calculationService;
            _logger = logger;
            _fileStorageService = fileStorageService;
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult> GetEmployeePoints(int employeeId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                _logger.LogInformation("獲取員工積分記錄: {EmployeeId}", employeeId);

                var query = _context.PointsEntries
                    .Include(p => p.Standard)
                    .Where(p => p.EmployeeId == employeeId);

                if (startDate.HasValue)
                    query = query.Where(p => p.EntryDate >= startDate.Value);

                if (endDate.HasValue)
                    query = query.Where(p => p.EntryDate <= endDate.Value);

                // 使用明確的 Select 來避免模型問題
                var points = await query
                    .OrderByDescending(p => p.EntryDate)
                    .Select(p => new
                    {
                        id = p.Id,
                        employeeId = p.EmployeeId,
                        standardId = p.StandardId,
                        entryDate = p.EntryDate,
                        pointsEarned = p.PointsEarned,
                        basePoints = p.BasePoints,
                        bonusPoints = p.BonusPoints,
                        status = p.Status,
                        description = p.Description,
                        evidenceFiles = p.EvidenceFiles,
                        createdAt = p.CreatedAt,
                        standard = new
                        {
                            id = p.Standard.Id,
                            categoryName = p.Standard.CategoryName,
                            pointsType = p.Standard.PointsType,
                            pointsValue = p.Standard.PointsValue
                        }
                    })
                    .ToListAsync();

                _logger.LogInformation("找到 {Count} 筆積分記錄", points.Count);
                return Ok(points);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取員工積分記錄時發生錯誤: {EmployeeId}", employeeId);
                return StatusCode(500, new { message = "獲取積分記錄時發生錯誤" });
            }
        }

        [HttpGet("employee/{employeeId}/summary")]
        public async Task<ActionResult> GetEmployeePointsSummary(int employeeId, [FromQuery] DateTime? month)
        {
            var targetMonth = month ?? DateTime.UtcNow;
            var monthlyTotal = await _calculationService.CalculateMonthlyTotalAsync(employeeId, targetMonth);
            var categoryTotals = await _calculationService.CalculateCategoryTotalsAsync(employeeId, targetMonth);
            var meetsRequirements = await _calculationService.CheckMinimumRequirementsAsync(employeeId, targetMonth);

            return Ok(new
            {
                EmployeeId = employeeId,
                Month = targetMonth.ToString("yyyy-MM"),
                MonthlyTotal = monthlyTotal,
                CategoryTotals = categoryTotals,
                MeetsRequirements = meetsRequirements
            });
        }

        [HttpPost]
        public async Task<ActionResult<PointsEntry>> CreatePointsEntry([FromBody] PointsEntry entry)
        {
            try
            {
                // 計算積分
                var calculationResult = await _calculationService.CalculatePointsAsync(entry);
                
                entry.BasePoints = calculationResult.BasePoints;
                entry.BonusPoints = calculationResult.BonusPoints;
                entry.PenaltyPoints = calculationResult.PenaltyPoints;
                entry.PromotionMultiplier = calculationResult.PromotionMultiplier;
                entry.PointsEarned = calculationResult.FinalPoints;

                _context.PointsEntries.Add(entry);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPointsEntry), new { id = entry.Id }, entry);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PointsEntry>> GetPointsEntry(int id)
        {
            var entry = await _context.PointsEntries
                .Include(p => p.Standard)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (entry == null)
                return NotFound();

            return Ok(entry);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<PointsEntry>> UpdatePointsEntry(int id, [FromBody] PointsEntry entry)
        {
            if (id != entry.Id)
                return BadRequest();

            try
            {
                // 重新計算積分
                var calculationResult = await _calculationService.CalculatePointsAsync(entry);
                
                entry.BasePoints = calculationResult.BasePoints;
                entry.BonusPoints = calculationResult.BonusPoints;
                entry.PenaltyPoints = calculationResult.PenaltyPoints;
                entry.PromotionMultiplier = calculationResult.PromotionMultiplier;
                entry.PointsEarned = calculationResult.FinalPoints;

                _context.PointsEntries.Update(entry);
                await _context.SaveChangesAsync();

                return Ok(entry);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePointsEntry(int id)
        {
            var entry = await _context.PointsEntries.FindAsync(id);
            if (entry == null)
                return NotFound();

            _context.PointsEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/approve")]
        public async Task<ActionResult> ApprovePointsEntry(int id, [FromBody] ApprovalRequest request)
        {
            try
            {
                _logger.LogInformation("核准積分記錄: {Id}, 核准人: {ApproverId}", id, request.ApproverId);

                var entry = await _context.PointsEntries.FindAsync(id);
                if (entry == null)
                {
                    return NotFound(new { message = "找不到指定的積分記錄" });
                }

                if (entry.Status != "pending")
                {
                    return BadRequest(new { message = "只能核准待審核的積分記錄" });
                }

                entry.Status = "approved";
                entry.ApprovedBy = request.ApproverId;
                entry.ApprovedAt = DateTime.UtcNow;
                entry.ReviewComments = request.Comments ?? "審核通過";

                await _context.SaveChangesAsync();

                _logger.LogInformation("積分記錄已核准: {Id}", id);
                return Ok(new { message = "積分記錄已核准" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "核准積分記錄時發生錯誤: {Id}", id);
                return StatusCode(500, new { message = "核准積分記錄時發生錯誤" });
            }
        }



        [HttpPost("calculate")]
        public async Task<ActionResult<PointsCalculationResult>> CalculatePoints([FromBody] PointsEntry entry)
        {
            try
            {
                var result = await _calculationService.CalculatePointsAsync(entry);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("test-submit")]
        public async Task<ActionResult> TestSubmit([FromBody] TestSubmissionRequest request)
        {
            try
            {
                // 創建一個簡單的積分記錄
                var entry = new PointsEntry
                {
                    EmployeeId = 1,
                    StandardId = 1, // 假設存在ID為1的標準
                    EntryDate = DateTime.UtcNow,
                    Description = "測試積分記錄",
                    Status = "pending",
                    PointsEarned = 10,
                    BasePoints = 10,
                    BonusPoints = 0,
                    PenaltyPoints = 0,
                    PromotionMultiplier = 1.0m
                };

                _context.PointsEntries.Add(entry);
                await _context.SaveChangesAsync();

                return Ok(new { message = "測試提交成功", entryId = entry.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new {
                    message = ex.Message,
                    innerException = ex.InnerException?.Message ?? "無內部異常詳情"
                });
            }
        }

        [HttpPost("batch/submit")]
        public async Task<ActionResult> SubmitBatchPoints(
            [FromForm] string employeeId,
            [FromForm] DateTime submissionDate,
            [FromForm] string status,
            [FromForm] decimal totalPoints,
            [FromForm] string items,
            [FromForm] List<IFormFile>? files = null,
            [FromForm] List<string>? fileKeys = null)
        {
            try
            {
                var results = new List<PointsEntry>();

                // 解析積分項目JSON - 配置支持camelCase
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    PropertyNameCaseInsensitive = true
                };
                var itemsList = System.Text.Json.JsonSerializer.Deserialize<List<PointsItem>>(items, jsonOptions);
                
                if (itemsList == null)
                {
                    Console.WriteLine("警告：itemsList 為 null");
                    return BadRequest(new { message = "積分項目解析失敗", receivedData = items });
                }
                
                Console.WriteLine($"收到 {itemsList.Count} 個積分項目進行處理");
                Console.WriteLine($"原始JSON數據: {items}");

                // 處理每個積分項目
                foreach (var item in itemsList)
                {
                    try
                    {
                        Console.WriteLine($"處理項目: {item.Description}, 積分: {item.CalculatedPoints}");
                        
                        // 驗證項目數據
                        if (string.IsNullOrWhiteSpace(item.Description))
                        {
                            Console.WriteLine("跳過項目：描述為空");
                            continue;
                        }
                        
                        if (item.CalculatedPoints <= 0)
                        {
                            Console.WriteLine($"跳過項目 {item.Description}：積分為 {item.CalculatedPoints}");
                            continue;
                        }
                        
                        // 查找對應的標準設定 - 使用簡單的查詢避免欄位問題
                        var standard = await _context.StandardSettings
                            .Where(s => s.CategoryName == item.Description)
                            .Select(s => new { s.Id, s.CategoryName, s.PointsValue })
                            .FirstOrDefaultAsync();

                        int standardId;
                        if (standard == null)
                        {
                            Console.WriteLine($"為項目 '{item.Description}' 創建新的標準設定");
                            // 如果找不到標準，創建一個新的
                            var newStandard = new StandardSetting
                            {
                                CategoryName = item.Description,
                                PointsValue = item.CalculatedPoints,
                                PointsType = "general",
                                InputType = "number",
                                IsActive = true,
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.StandardSettings.Add(newStandard);
                            await _context.SaveChangesAsync();
                            standardId = newStandard.Id;
                        }
                        else
                        {
                            Console.WriteLine($"找到現有標準設定 ID: {standard.Id} 為項目 '{item.Description}'");
                            standardId = standard.Id;
                        }

                        // 檢查EmployeeId是否為數字
                        int empId;
                        if (employeeId.StartsWith("EMP"))
                        {
                            // 嘗試解析EMP001 -> 1
                            if (!int.TryParse(employeeId.Replace("EMP", ""), out empId))
                            {
                                // 如果無法解析，使用默認值1
                                empId = 1;
                            }
                        }
                        else
                        {
                            // 嘗試直接解析
                            if (!int.TryParse(employeeId, out empId))
                            {
                                empId = 1;
                            }
                        }

                        var entry = new PointsEntry
                        {
                            EmployeeId = empId,
                            StandardId = standardId,
                            EntryDate = submissionDate,
                            Description = item.Description,
                            Status = status,
                            PointsEarned = item.CalculatedPoints,
                            BasePoints = item.CalculatedPoints,
                            BonusPoints = 0,
                            PenaltyPoints = 0,
                            PromotionMultiplier = 1.0m
                        };

                        _context.PointsEntries.Add(entry);
                        results.Add(entry);
                    }
                    catch (Exception itemEx)
                    {
                        // 記錄單個項目的錯誤但繼續處理其他項目
                        Console.WriteLine($"處理項目 '{item.Description}' 時出錯: {itemEx.Message}");
                    }
                }

                // 如果有成功添加的項目，保存它們
                if (results.Any())
                {
                    try
                    {
                        Console.WriteLine($"準備保存 {results.Count} 個積分記錄到資料庫");
                        await _context.SaveChangesAsync();

                        // 處理檔案上傳
                        var uploadedFiles = new List<string>();
                        if (files != null && files.Count > 0)
                        {
                            try
                            {
                                foreach (var file in files)
                                {
                                    // 為每個積分記錄保存檔案
                                    foreach (var entry in results)
                                    {
                                        var fileAttachment = await _fileStorageService.SaveFileAsync(
                                            file,
                                            "PointsEntry",
                                            entry.Id,
                                            int.Parse(employeeId)
                                        );
                                        uploadedFiles.Add(fileAttachment.FileName);
                                    }
                                }
                                Console.WriteLine($"成功上傳 {uploadedFiles.Count} 個檔案");
                            }
                            catch (Exception fileEx)
                            {
                                Console.WriteLine($"檔案上傳警告: {fileEx.Message}");
                                // 檔案上傳失敗不影響積分記錄的保存
                            }
                        }

                        var successMessage = $"積分提交成功！創建了 {results.Count} 個積分記錄，總積分: {results.Sum(r => r.PointsEarned):F1}";
                        Console.WriteLine(successMessage);

                        return Ok(new {
                            message = "積分提交成功",
                            entriesCreated = results.Count,
                            totalPoints = results.Sum(r => r.PointsEarned),
                            filesUploaded = uploadedFiles.Count
                        });
                    }
                    catch (DbUpdateException dbEx)
                    {
                        var innerException = dbEx.InnerException?.Message ?? "無內部異常詳情";
                        Console.WriteLine($"資料庫保存錯誤: {dbEx.Message}");
                        return BadRequest(new {
                            message = $"保存到資料庫時出錯: {dbEx.Message}",
                            innerException = innerException,
                            stackTrace = dbEx.StackTrace
                        });
                    }
                }
                else
                {
                    var errorMessage = $"沒有有效的積分項目可以保存。原始項目數: {itemsList.Count}，處理後項目數: {results.Count}";
                    Console.WriteLine(errorMessage);
                    
                    // 提供更詳細的錯誤信息
                    var debugInfo = new List<string>();
                    foreach (var item in itemsList)
                    {
                        debugInfo.Add($"項目: {item.Description}, 積分: {item.CalculatedPoints}, 勾選: {item.Checked}, 數值: {item.Value}, 選擇值: {item.SelectedValue}");
                    }
                    
                    return BadRequest(new { 
                        message = errorMessage,
                        debugInfo = debugInfo,
                        suggestion = "請確保至少選擇一個項目且積分值大於0"
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new {
                    message = ex.Message,
                    innerException = ex.InnerException?.Message ?? "無內部異常詳情",
                    stackTrace = ex.StackTrace
                });
            }
        }

        // 獲取待審核的積分記錄
        [HttpGet("pending")]
        public async Task<ActionResult<List<object>>> GetPendingEntries()
        {
            try
            {
                _logger.LogInformation("獲取待審核積分記錄");

                var pendingEntries = await _context.PointsEntries
                    .Include(p => p.Employee)
                    .ThenInclude(e => e.Department)
                    .Include(p => p.Standard)
                    .Where(p => p.Status == "pending")
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new
                    {
                        id = p.Id,
                        employeeName = p.Employee.Name,
                        employeeNumber = p.Employee.EmployeeNumber,
                        department = p.Employee.Department!.Name,
                        standardName = p.Standard.CategoryName,
                        description = p.Description,
                        pointsCalculated = p.PointsEarned,
                        evidenceFiles = p.EvidenceFiles,
                        submittedAt = p.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                        status = p.Status,
                        basePoints = p.BasePoints,
                        bonusPoints = p.BonusPoints,
                        promotionMultiplier = p.PromotionMultiplier
                    })
                    .ToListAsync();

                _logger.LogInformation("找到 {Count} 筆待審核記錄", pendingEntries.Count);
                return Ok(pendingEntries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取待審核記錄時發生錯誤");
                return StatusCode(500, new { message = "獲取待審核記錄時發生錯誤" });
            }
        }

        // 拒絕積分記錄
        [HttpPost("{id}/reject")]
        public async Task<ActionResult> RejectPointsEntry(int id, [FromBody] PointsManagementAPI.Models.AuthModels.RejectRequest request)
        {
            try
            {
                _logger.LogInformation("拒絕積分記錄: {Id}, 拒絕人: {RejectedBy}", id, request.RejectedBy);

                var entry = await _context.PointsEntries.FindAsync(id);
                if (entry == null)
                {
                    return NotFound(new { message = "找不到指定的積分記錄" });
                }

                if (entry.Status != "pending")
                {
                    return BadRequest(new { message = "只能拒絕待審核的積分記錄" });
                }

                entry.Status = "rejected";
                entry.ApprovedBy = request.RejectedBy;
                entry.ApprovedAt = DateTime.UtcNow;
                entry.Description = entry.Description + $"\n拒絕原因: {request.Reason}";

                await _context.SaveChangesAsync();

                _logger.LogInformation("積分記錄已拒絕: {Id}", id);
                return Ok(new { message = "積分記錄已拒絕" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "拒絕積分記錄時發生錯誤: {Id}", id);
                return StatusCode(500, new { message = "拒絕積分記錄時發生錯誤" });
            }
        }

        // 獲取員工在部門中的排名
        [HttpGet("employee/{employeeId}/department-rank")]
        public async Task<ActionResult> GetEmployeeDepartmentRank(int employeeId)
        {
            try
            {
                _logger.LogInformation("獲取員工部門排名: {EmployeeId}", employeeId);

                var employee = await _context.Employees
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(e => e.Id == employeeId);
                    
                if (employee == null)
                {
                    return NotFound(new { message = "找不到指定員工" });
                }

                // 獲取同部門所有活躍員工的積分排名
                var departmentRanking = await _context.Employees
                    .Where(e => e.DepartmentId == employee.DepartmentId && e.IsActive)
                    .Select(e => new {
                        EmployeeId = e.Id,
                        EmployeeName = e.Name,
                        TotalPoints = _context.PointsEntries
                            .Where(pe => pe.EmployeeId == e.Id && pe.Status == "approved")
                            .Sum(pe => pe.PointsEarned)
                    })
                    .OrderByDescending(x => x.TotalPoints)
                    .ToListAsync();

                // 找到當前員工的排名
                var employeeRank = departmentRanking
                    .Select((emp, index) => new { emp, rank = index + 1 })
                    .FirstOrDefault(x => x.emp.EmployeeId == employeeId);

                var result = new {
                    rank = employeeRank?.rank ?? departmentRanking.Count + 1,
                    totalEmployees = departmentRanking.Count,
                    totalPoints = employeeRank?.emp.TotalPoints ?? 0,
                    departmentName = employee.Department?.Name ?? "未知部門",
                    departmentId = employee.DepartmentId
                };

                _logger.LogInformation("部門排名查詢成功: 員工{EmployeeId}在{DepartmentName}排名第{Rank}名(共{Total}人)", 
                    employeeId, result.departmentName, result.rank, result.totalEmployees);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取部門排名失敗: {EmployeeId}", employeeId);
                return StatusCode(500, new { message = "獲取排名資料失敗" });
            }
        }

        // 獲取部門完整排名列表（可選，用於調試和管理界面）
        [HttpGet("department/{departmentId}/ranking")]
        public async Task<ActionResult> GetDepartmentRankingList(int departmentId)
        {
            try
            {
                _logger.LogInformation("獲取部門排名列表: {DepartmentId}", departmentId);

                var departmentRanking = await _context.Employees
                    .Where(e => e.DepartmentId == departmentId && e.IsActive)
                    .Select(e => new {
                        employeeId = e.Id,
                        employeeName = e.Name,
                        employeeNumber = e.EmployeeNumber,
                        position = e.Position,
                        totalPoints = _context.PointsEntries
                            .Where(pe => pe.EmployeeId == e.Id && pe.Status == "approved")
                            .Sum(pe => pe.PointsEarned),
                        approvedEntries = _context.PointsEntries
                            .Where(pe => pe.EmployeeId == e.Id && pe.Status == "approved")
                            .Count()
                    })
                    .OrderByDescending(x => x.totalPoints)
                    .ToListAsync();

                var result = departmentRanking
                    .Select((emp, index) => new {
                        rank = index + 1,
                        employeeId = emp.employeeId,
                        employeeName = emp.employeeName,
                        employeeNumber = emp.employeeNumber,
                        position = emp.position,
                        totalPoints = emp.totalPoints,
                        approvedEntries = emp.approvedEntries
                    })
                    .ToList();

                _logger.LogInformation("部門排名列表查詢成功: 部門{DepartmentId}共{Count}名員工", departmentId, result.Count);

                return Ok(new {
                    departmentId,
                    totalEmployees = result.Count,
                    ranking = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取部門排名列表失敗: {DepartmentId}", departmentId);
                return StatusCode(500, new { message = "獲取部門排名列表失敗" });
            }
        }
    }

    public class ApprovalRequest
    {
        public int ApproverId { get; set; }
        public string? Comments { get; set; }
    }

    public class PointsItem
    {
        public string Description { get; set; } = string.Empty;
        public decimal CalculatedPoints { get; set; }
        public bool? Checked { get; set; }
        public decimal? Value { get; set; }
        public decimal? SelectedValue { get; set; }
    }

    public class TestSubmissionRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}
