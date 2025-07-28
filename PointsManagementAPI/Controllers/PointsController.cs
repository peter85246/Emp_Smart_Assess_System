using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models.PointsModels;
using PointsManagementAPI.Services;
using System.Text.Json;

namespace PointsManagementAPI.Controllers
{
    /// <summary>
    /// 積分管理控制器 - 處理員工積分相關的所有API操作
    /// 主要功能：積分查詢、提交、審核、統計
    /// API路由前綴：/api/points
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PointsController : ControllerBase
    {
        private readonly PointsDbContext _context;
        private readonly IPointsCalculationService _calculationService;
        private readonly ILogger<PointsController> _logger;
        private readonly IFileStorageService _fileStorageService;
        private readonly IReviewPermissionService _reviewPermissionService;

        /// <summary>
        /// 積分控制器建構函數 - 注入必要的服務依賴
        /// </summary>
        /// <param name="context">資料庫上下文</param>
        /// <param name="calculationService">積分計算服務</param>
        /// <param name="logger">日誌記錄器</param>
        /// <param name="fileStorageService">檔案存儲服務</param>
        /// <param name="reviewPermissionService">審核權限檢查服務</param>
        public PointsController(PointsDbContext context, IPointsCalculationService calculationService, ILogger<PointsController> logger, IFileStorageService fileStorageService, IReviewPermissionService reviewPermissionService)
        {
            _context = context;
            _calculationService = calculationService;
            _logger = logger;
            _fileStorageService = fileStorageService;
            _reviewPermissionService = reviewPermissionService;
        }

        /// <summary>
        /// 【GET】 /api/points/employee/{employeeId} - 獲取指定員工的積分記錄
        /// 功能：查詢員工的所有積分記錄，支援日期範圍篩選
        /// 前端使用：個人積分查詢、績效報告
        /// </summary>
        /// <param name="employeeId">員工ID</param>
        /// <param name="startDate">開始日期（可選）</param>
        /// <param name="endDate">結束日期（可選）</param>
        /// <returns>包含積分記錄和檔案詳情的列表</returns>
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
                var pointsQuery = await query
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
                        // 審核相關欄位
                        reviewComments = p.ReviewComments,
                        approvedBy = p.ApprovedBy,
                        approvedAt = p.ApprovedAt,
                        standard = new
                        {
                            id = p.Standard.Id,
                            categoryName = p.Standard.CategoryName,
                            pointsType = p.Standard.PointsType,
                            pointsValue = p.Standard.PointsValue
                        }
                    })
                    .ToListAsync();

                // 擴展檔案信息（向後兼容）
                var points = new List<object>();
                foreach (var point in pointsQuery)
                {
                    var fileDetails = new List<object>();
                    
                    // 解析檔案ID並獲取檔案詳細信息
                    if (!string.IsNullOrEmpty(point.evidenceFiles))
                    {
                        try
                        {
                            var fileIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(point.evidenceFiles);
                            var fileAttachments = await _context.FileAttachments
                                .Where(f => fileIds.Contains(f.Id) && f.IsActive)
                                .Select(f => new
                                {
                                    id = f.Id,
                                    fileName = f.FileName,
                                    fileSize = f.FileSize,
                                    contentType = f.ContentType,
                                    uploadedAt = f.UploadedAt
                                })
                                .ToListAsync();
                            
                            fileDetails.AddRange(fileAttachments);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"解析檔案信息時出錯: {ex.Message}");
                        }
                    }

                    points.Add(new
                    {
                        id = point.id,
                        employeeId = point.employeeId,
                        standardId = point.standardId,
                        entryDate = point.entryDate,
                        pointsEarned = point.pointsEarned,
                        basePoints = point.basePoints,
                        bonusPoints = point.bonusPoints,
                        status = point.status,
                        description = point.description,
                        evidenceFiles = point.evidenceFiles, // 保留原始JSON字符串（向後兼容）
                        evidenceFileDetails = fileDetails, // 新增：檔案詳細信息列表
                        createdAt = point.createdAt,
                        reviewComments = point.reviewComments,
                        approvedBy = point.approvedBy,
                        approvedAt = point.approvedAt,
                        standard = point.standard
                    });
                }

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

        /// <summary>
        /// 【POST】 /api/points/{id}/approve - 審核通過積分記錄
        /// 功能：主管審核員工積分提交，標記為通過狀態
        /// 前端使用：ManagerReviewForm組件的審核通過功能
        /// 權限：僅限主管角色使用
        /// </summary>
        /// <param name="id">積分記錄ID</param>
        /// <param name="request">審核請求，包含審核人ID和備註</param>
        /// <returns>審核結果</returns>
        [HttpPost("{id}/approve")]
        public async Task<ActionResult> ApprovePointsEntry(int id, [FromBody] ApprovalRequest request)
        {
            try
            {
                _logger.LogInformation("核准積分記錄: {Id}, 核准人: {ApproverId}", id, request.ApproverId);

                // 新增：權限檢查
                var hasPermission = await _reviewPermissionService.CanReviewEntryAsync(request.ApproverId, id);
                if (!hasPermission)
                {
                    _logger.LogWarning("審核者 {ApproverId} 沒有權限審核積分記錄 {EntryId}", request.ApproverId, id);
                    return Forbid(new { message = "您沒有權限審核此積分記錄" }.ToString());
                }

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

        /// <summary>
        /// 【POST】 /api/points/batch/submit - 批量提交積分項目（支援多項目+檔案上傳）
        /// 功能：員工一次提交多個積分項目，每個項目可附帶檔案證明
        /// 前端使用：InteractivePointsForm組件的主要提交功能
        /// 特色：支援檔案與特定項目的精確關聯
        /// </summary>
        /// <param name="employeeId">員工ID</param>
        /// <param name="submissionDate">提交日期</param>
        /// <param name="status">狀態（通常為pending）</param>
        /// <param name="totalPoints">總積分</param>
        /// <param name="items">積分項目JSON字符串</param>
        /// <param name="files">上傳的檔案列表（可選）</param>
        /// <param name="fileKeys">檔案關聯鍵（格式：g1_0, g2_0等）</param>
        /// <returns>創建的積分記錄摘要</returns>
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

                // 檢查EmployeeId是否為數字，並獲取員工角色信息
                int empId;
                if (employeeId.StartsWith("EMP"))
                {
                    if (!int.TryParse(employeeId.Replace("EMP", ""), out empId))
                    {
                        empId = 1;
                    }
                }
                else
                {
                    if (!int.TryParse(employeeId, out empId))
                    {
                        empId = 1;
                    }
                }

                // 獲取提交者的角色信息（用於boss自動審核邏輯）
                var submitter = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == empId && e.IsActive);
                
                if (submitter == null)
                {
                    return BadRequest(new { message = "找不到有效的員工記錄" });
                }

                // Boss角色的積分提交自動審核通過
                string finalStatus = status;
                int? approvedBy = null;
                DateTime? approvedAt = null;
                string? reviewComments = null;

                if (submitter.Role == "boss")
                {
                    finalStatus = "approved";
                    approvedBy = empId;
                    approvedAt = DateTime.UtcNow;
                    reviewComments = "董事長層級自動審核通過";
                    Console.WriteLine($"董事長 {submitter.Name} 提交的積分將自動審核通過");
                }

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
                        Console.WriteLine($"處理項目: {item.CategoryName}, 工作說明: {item.Description}, 積分: {item.CalculatedPoints}");

                        // 驗證項目數據
                        if (string.IsNullOrWhiteSpace(item.CategoryName))
                        {
                            Console.WriteLine("跳過項目：積分項目類別名稱為空");
                            continue;
                        }

                        if (item.CalculatedPoints <= 0)
                        {
                            Console.WriteLine($"跳過項目 {item.CategoryName}：積分為 {item.CalculatedPoints}");
                            continue;
                        }

                        // 查找對應的標準設定 - 使用CategoryName查找積分項目類別
                        var standard = await _context.StandardSettings
                            .Where(s => s.CategoryName == item.CategoryName)
                            .Select(s => new { s.Id, s.CategoryName, s.PointsValue })
                            .FirstOrDefaultAsync();

                        int standardId;
                        if (standard == null)
                        {
                            Console.WriteLine($"為項目 '{item.CategoryName}' 創建新的標準設定");
                            // 如果找不到標準，創建一個新的
                            var newStandard = new StandardSetting
                            {
                                CategoryName = item.CategoryName, // 使用積分項目類別名稱
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
                            Console.WriteLine($"找到現有標準設定 ID: {standard.Id} 為項目 '{item.CategoryName}'");
                            standardId = standard.Id;
                        }

                        var entry = new PointsEntry
                        {
                            EmployeeId = empId,
                            StandardId = standardId,
                            EntryDate = submissionDate,
                            Description = item.Description,
                            Status = finalStatus, // 使用處理過的狀態（boss自動審核）
                            PointsEarned = item.CalculatedPoints,
                            BasePoints = item.CalculatedPoints,
                            BonusPoints = 0,
                            PenaltyPoints = 0,
                            PromotionMultiplier = 1.0m,
                            ApprovedBy = approvedBy, // boss自動審核時設置審核者
                            ApprovedAt = approvedAt, // boss自動審核時設置審核時間
                            ReviewComments = reviewComments // boss自動審核時設置審核備註
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
                        var entryFileMap = new Dictionary<int, List<int>>(); // 每個entry對應的檔案ID列表
                        
                        if (files != null && files.Count > 0 && fileKeys != null && fileKeys.Count > 0)
                        {
                            try
                            {
                                Console.WriteLine($"開始處理 {files.Count} 個檔案，對應 {fileKeys.Count} 個檔案鍵");
                                
                                // 根據fileKeys將檔案分配到對應的積分記錄
                                for (int i = 0; i < files.Count && i < fileKeys.Count; i++)
                                {
                                    var file = files[i];
                                    var fileKey = fileKeys[i];
                                    
                                    Console.WriteLine($"處理檔案 {file.FileName}，對應鍵: {fileKey}");
                                    
                                    // 解析fileKey以確定對應的項目索引
                                    // fileKey格式應該是 "g1_0", "g2_0" 等
                                    var keyParts = fileKey.Split('_');
                                    if (keyParts.Length >= 1)
                                    {
                                        var itemKey = keyParts[0]; // 例如 "g1", "g2"
                                        
                                        // 從itemKey提取索引（去掉'g'前綴）
                                        if (itemKey.StartsWith("g") && int.TryParse(itemKey.Substring(1), out int itemIndex))
                                        {
                                            // 調整索引為從0開始
                                            itemIndex = itemIndex - 1;
                                            
                                            if (itemIndex >= 0 && itemIndex < results.Count)
                                            {
                                                var targetEntry = results[itemIndex];
                                                
                                                // 保存檔案
                                                var fileAttachment = await _fileStorageService.SaveFileAsync(
                                                    file,
                                                    "PointsEntry",
                                                    targetEntry.Id,
                                                    int.Parse(employeeId)
                                                );
                                                
                                                uploadedFiles.Add(fileAttachment.FileName);
                                                
                                                // 記錄檔案關聯到對應的積分記錄
                                                if (!entryFileMap.ContainsKey(targetEntry.Id))
                                                {
                                                    entryFileMap[targetEntry.Id] = new List<int>();
                                                }
                                                entryFileMap[targetEntry.Id].Add(fileAttachment.Id);
                                                
                                                Console.WriteLine($"檔案 {file.FileName} 已關聯到積分記錄 {targetEntry.Id} (項目索引: {itemIndex})");
                                            }
                                            else
                                            {
                                                Console.WriteLine($"警告：檔案鍵 {fileKey} 對應的項目索引 {itemIndex} 超出範圍");
                                            }
                                        }
                                        else
                                        {
                                            Console.WriteLine($"警告：無法解析檔案鍵 {fileKey} 的項目索引");
                                        }
                                    }
                                    else
                                    {
                                        Console.WriteLine($"警告：檔案鍵格式不正確: {fileKey}");
                                    }
                                }
                                
                                // 更新PointsEntry的EvidenceFiles欄位
                                foreach (var kvp in entryFileMap)
                                {
                                    var entry = results.FirstOrDefault(e => e.Id == kvp.Key);
                                    if (entry != null)
                                    {
                                        entry.EvidenceFiles = System.Text.Json.JsonSerializer.Serialize(kvp.Value);
                                        Console.WriteLine($"積分記錄 {entry.Id} 關聯檔案: {string.Join(", ", kvp.Value)}");
                                    }
                                }
                                
                                // 保存檔案關聯更新
                                await _context.SaveChangesAsync();
                                
                                Console.WriteLine($"成功上傳 {uploadedFiles.Count} 個檔案並建立正確關聯");
                            }
                            catch (Exception fileEx)
                            {
                                Console.WriteLine($"檔案上傳警告: {fileEx.Message}");
                                // 檔案上傳失敗不影響積分記錄的保存
                            }
                        }
                        else if (files != null && files.Count > 0)
                        {
                            Console.WriteLine("檔案存在但無對應的檔案鍵，跳過檔案處理");
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

        /// <summary>
        /// 【GET】 /api/points/pending - 獲取所有待審核的積分記錄
        /// 功能：供主管查看所有員工提交的待審核積分項目
        /// 前端使用：ManagerReviewForm組件顯示待審核列表
        /// 特色：包含完整的員工信息、檔案詳情、部門信息
        /// </summary>
        /// <returns>待審核積分記錄列表，包含員工和檔案詳情</returns>
        [HttpGet("pending")]
        public async Task<ActionResult<List<object>>> GetPendingEntries()
        {
            try
            {
                _logger.LogInformation("獲取待審核積分記錄");

                var pendingQuery = await _context.PointsEntries
                    .Include(p => p.Employee)
                    .ThenInclude(e => e.Department)
                    .Include(p => p.Standard)
                    .Where(p => p.Status == "pending")
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new
                    {
                        id = p.Id,
                        employeeId = p.EmployeeId,
                        employeeName = p.Employee.Name,
                        employeeNumber = p.Employee.EmployeeNumber,
                        employeeRole = p.Employee.Role, // 新增：員工角色信息
                        employeePosition = p.Employee.Position, // 新增：員工職位信息
                        department = p.Employee.Department!.Name,
                        departmentId = p.Employee.DepartmentId, // 新增：部門ID
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

                // 擴展檔案信息（向後兼容）
                var pendingEntries = new List<object>();
                foreach (var entry in pendingQuery)
                {
                    var fileDetails = new List<object>();
                    
                    // 解析檔案ID並獲取檔案詳細信息
                    if (!string.IsNullOrEmpty(entry.evidenceFiles))
                    {
                        try
                        {
                            var fileIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(entry.evidenceFiles);
                            var fileAttachments = await _context.FileAttachments
                                .Where(f => fileIds.Contains(f.Id) && f.IsActive)
                                .Select(f => new
                                {
                                    id = f.Id,
                                    fileName = f.FileName,
                                    fileSize = f.FileSize,
                                    contentType = f.ContentType,
                                    uploadedAt = f.UploadedAt
                                })
                                .ToListAsync();
                            
                            fileDetails.AddRange(fileAttachments);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"解析待審核檔案信息時出錯: {ex.Message}");
                        }
                    }

                    pendingEntries.Add(new
                    {
                        id = entry.id,
                        employeeId = entry.employeeId,
                        employeeName = entry.employeeName,
                        employeeNumber = entry.employeeNumber,
                        employeeRole = entry.employeeRole, // 新增：員工角色信息
                        employeePosition = entry.employeePosition, // 新增：員工職位信息
                        department = entry.department,
                        departmentId = entry.departmentId, // 新增：部門ID
                        standardName = entry.standardName,
                        description = entry.description,
                        pointsCalculated = entry.pointsCalculated,
                        evidenceFiles = entry.evidenceFiles, // 保留原始JSON字符串（向後兼容）
                        evidenceFileDetails = fileDetails, // 新增：檔案詳細信息列表
                        submittedAt = entry.submittedAt,
                        status = entry.status,
                        basePoints = entry.basePoints,
                        bonusPoints = entry.bonusPoints,
                        promotionMultiplier = entry.promotionMultiplier
                    });
                }

                _logger.LogInformation("找到 {Count} 筆待審核記錄", pendingEntries.Count);
                return Ok(pendingEntries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取待審核記錄時發生錯誤");
                return StatusCode(500, new { message = "獲取待審核記錄時發生錯誤" });
            }
        }

        /// <summary>
        /// 【GET】 /api/points/pending/department - 根據審核者權限獲取待審核的積分記錄
        /// 功能：支援部門權限控制的待審核記錄查詢
        /// 權限：老闆/管理員可查看所有部門，主管只能查看同部門員工
        /// 前端使用：新版ManagerReviewForm組件的權限控制功能
        /// </summary>
        /// <param name="reviewerId">審核者員工ID</param>
        /// <returns>根據權限過濾後的待審核積分記錄列表</returns>
        [HttpGet("pending/department")]
        public async Task<ActionResult<List<object>>> GetPendingEntriesByDepartment([FromQuery] int reviewerId)
        {
            try
            {
                _logger.LogInformation("獲取部門權限過濾的待審核積分記錄, 審核者ID: {ReviewerId}", reviewerId);

                // 獲取審核者可以審核的部門列表
                var reviewableDepartments = await _reviewPermissionService.GetReviewableDepartmentsAsync(reviewerId);
                
                // 如果返回空列表，表示無權限
                if (reviewableDepartments != null && reviewableDepartments.Count == 0)
                {
                    _logger.LogWarning("審核者 {ReviewerId} 無審核權限", reviewerId);
                    return Ok(new List<object>());
                }

                // 建構查詢
                var query = _context.PointsEntries
                    .Include(p => p.Employee)
                    .ThenInclude(e => e.Department)
                    .Include(p => p.Standard)
                    .Where(p => p.Status == "pending");

                // 如果 reviewableDepartments 為 null，表示可以審核所有部門（老闆/管理員）
                // 如果不為 null，則按部門過濾（主管）
                if (reviewableDepartments != null)
                {
                    query = query.Where(p => reviewableDepartments.Contains(p.Employee.DepartmentId));
                    _logger.LogInformation("按部門過濾: 可審核部門 {Departments}", string.Join(",", reviewableDepartments));
                }
                else
                {
                    _logger.LogInformation("老闆/管理員權限: 可審核所有部門");
                }

                var pendingQuery = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                // 根據層級權限進一步過濾記錄
                var filteredQuery = new List<PointsEntry>();
                foreach (var entry in pendingQuery)
                {
                    // 檢查層級審核權限
                    var canReview = await _reviewPermissionService.CanReviewEntryAsync(reviewerId, entry.Id);
                    if (canReview)
                    {
                        filteredQuery.Add(entry);
                    }
                }

                _logger.LogInformation("層級權限過濾：原始記錄 {OriginalCount} 筆，過濾後 {FilteredCount} 筆", 
                    pendingQuery.Count, filteredQuery.Count);

                // 擴展檔案信息（與原有方法保持一致）
                var pendingEntries = new List<object>();
                foreach (var entry in filteredQuery)
                {
                    var fileDetails = new List<object>();
                    
                    // 解析檔案ID並獲取檔案詳細信息
                    if (!string.IsNullOrEmpty(entry.EvidenceFiles))
                    {
                        try
                        {
                            var fileIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(entry.EvidenceFiles);
                            var fileAttachments = await _context.FileAttachments
                                .Where(f => fileIds.Contains(f.Id) && f.IsActive)
                                .Select(f => new
                                {
                                    id = f.Id,
                                    fileName = f.FileName,
                                    fileSize = f.FileSize,
                                    contentType = f.ContentType,
                                    uploadedAt = f.UploadedAt
                                })
                                .ToListAsync();
                            
                            fileDetails.AddRange(fileAttachments);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "解析檔案信息時出錯: {EvidenceFiles}", entry.EvidenceFiles);
                        }
                    }

                    pendingEntries.Add(new
                    {
                        id = entry.Id,
                        employeeId = entry.EmployeeId,
                        employeeName = entry.Employee.Name,
                        employeeNumber = entry.Employee.EmployeeNumber,
                        employeeRole = entry.Employee.Role, // 新增：員工角色信息
                        employeePosition = entry.Employee.Position, // 新增：員工職位信息
                        department = entry.Employee.Department!.Name,
                        departmentId = entry.Employee.DepartmentId,
                        standardName = entry.Standard.CategoryName,
                        description = entry.Description,
                        pointsCalculated = entry.PointsEarned,
                        evidenceFiles = entry.EvidenceFiles, // 保留原始JSON字符串（向後兼容）
                        evidenceFileDetails = fileDetails, // 新增：檔案詳細信息列表
                        submittedAt = entry.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                        status = entry.Status,
                        basePoints = entry.BasePoints,
                        bonusPoints = entry.BonusPoints,
                        promotionMultiplier = entry.PromotionMultiplier
                    });
                }

                _logger.LogInformation("根據部門權限找到 {Count} 筆待審核記錄", pendingEntries.Count);
                return Ok(pendingEntries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取部門權限過濾的待審核記錄時發生錯誤: ReviewerId={ReviewerId}", reviewerId);
                return StatusCode(500, new { message = "獲取待審核記錄時發生錯誤" });
            }
        }

        /// <summary>
        /// 【POST】 /api/points/{id}/reject - 審核拒絕積分記錄
        /// 功能：主管審核員工積分提交，標記為拒絕狀態並記錄拒絕原因
        /// 前端使用：ManagerReviewForm組件的審核拒絕功能
        /// 權限：僅限主管角色使用
        /// </summary>
        /// <param name="id">積分記錄ID</param>
        /// <param name="request">拒絕請求，包含拒絕人ID和拒絕原因</param>
        /// <returns>拒絕結果</returns>
        [HttpPost("{id}/reject")]
        public async Task<ActionResult> RejectPointsEntry(int id, [FromBody] PointsManagementAPI.Models.AuthModels.RejectRequest request)
        {
            try
            {
                _logger.LogInformation("拒絕積分記錄: {Id}, 拒絕人: {RejectedBy}", id, request.RejectedBy);

                // 新增：權限檢查
                var hasPermission = await _reviewPermissionService.CanReviewEntryAsync(request.RejectedBy, id);
                if (!hasPermission)
                {
                    _logger.LogWarning("審核者 {RejectedBy} 沒有權限審核積分記錄 {EntryId}", request.RejectedBy, id);
                    return Forbid(new { message = "您沒有權限審核此積分記錄" }.ToString());
                }

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
                entry.ReviewComments = request.Reason;

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

        /// <summary>
        /// 【GET】 /api/points/all-entries-count - 獲取全公司積分項目統計
        /// 功能：統計所有積分項目的審核狀態
        /// 權限：董事長專用
        /// </summary>
        /// <returns>包含 approved, rejected, pending 數量的統計結果</returns>
        [HttpGet("all-entries-count")]
        public async Task<ActionResult<object>> GetAllEntriesCount()
        {
            try
            {
                var totalEntries = await _context.PointsEntries.CountAsync();
                var approvedEntries = await _context.PointsEntries
                    .CountAsync(p => p.Status == "approved");
                var rejectedEntries = await _context.PointsEntries
                    .CountAsync(p => p.Status == "rejected");
                var pendingEntries = await _context.PointsEntries
                    .CountAsync(p => p.Status == "pending");

                return Ok(new
                {
                    total = totalEntries,
                    approved = approvedEntries,
                    rejected = rejectedEntries,
                    pending = pendingEntries
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取全公司項目統計失敗");
                return StatusCode(500, new { message = "獲取統計數據時發生錯誤" });
            }
        }

        /// <summary>
        /// 【GET】 /api/points/executive-entries-count - 獲取總經理權限範圍積分項目統計
        /// 功能：統計除董事長外所有積分項目的審核狀態
        /// 權限：總經理專用
        /// </summary>
        /// <returns>包含 approved, rejected, pending 數量的統計結果</returns>
        [HttpGet("executive-entries-count")]
        public async Task<ActionResult<object>> GetExecutiveEntriesCount()
        {
            try
            {
                // 排除董事長的項目統計
                var query = _context.PointsEntries
                    .Include(p => p.Employee)
                    .Where(p => p.Employee.Position != "董事長" && 
                               !p.Employee.Name.Contains("董事長"));

                var totalEntries = await query.CountAsync();
                var approvedEntries = await query
                    .CountAsync(p => p.Status == "approved");
                var rejectedEntries = await query
                    .CountAsync(p => p.Status == "rejected");
                var pendingEntries = await query
                    .CountAsync(p => p.Status == "pending");

                return Ok(new
                {
                    total = totalEntries,
                    approved = approvedEntries,
                    rejected = rejectedEntries,
                    pending = pendingEntries
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取總經理權限項目統計失敗");
                return StatusCode(500, new { message = "獲取統計數據時發生錯誤" });
            }
        }

        /// <summary>
        /// 【GET】 /api/points/department-entries-count/{departmentId} - 獲取指定部門積分項目統計
        /// 功能：統計指定部門積分項目的審核狀態
        /// 權限：部門主管、管理員
        /// </summary>
        /// <param name="departmentId">部門ID</param>
        /// <returns>包含 approved, rejected, pending 數量的統計結果</returns>
        [HttpGet("department-entries-count/{departmentId}")]
        public async Task<ActionResult<object>> GetDepartmentEntriesCount(int departmentId)
        {
            try
            {
                var query = _context.PointsEntries
                    .Include(p => p.Employee)
                    .Where(p => p.Employee.DepartmentId == departmentId);

                var totalEntries = await query.CountAsync();
                var approvedEntries = await query
                    .CountAsync(p => p.Status == "approved");
                var rejectedEntries = await query
                    .CountAsync(p => p.Status == "rejected");
                var pendingEntries = await query
                    .CountAsync(p => p.Status == "pending");

                return Ok(new
                {
                    total = totalEntries,
                    approved = approvedEntries,
                    rejected = rejectedEntries,
                    pending = pendingEntries
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取部門 {DepartmentId} 項目統計失敗", departmentId);
                return StatusCode(500, new { message = "獲取統計數據時發生錯誤" });
            }
        }

        /// <summary>
        /// 【GET】 /api/points/departments - 獲取所有部門列表
        /// 功能：動態獲取系統中所有部門的ID和名稱
        /// 權限：所有管理級別用戶
        /// </summary>
        /// <returns>包含 id, name 的部門列表</returns>
        [HttpGet("departments")]
        public async Task<ActionResult<object>> GetDepartments()
        {
            try
            {
                var departments = await _context.Departments
                    .Select(d => new { id = d.Id, name = d.Name })
                    .OrderBy(d => d.id)
                    .ToListAsync();

                return Ok(departments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取部門列表失敗");
                return StatusCode(500, new { message = "獲取部門列表時發生錯誤" });
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
        public string CategoryName { get; set; } = string.Empty; // 積分項目類別名稱
        public string Description { get; set; } = string.Empty; // 員工填寫的工作說明
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
