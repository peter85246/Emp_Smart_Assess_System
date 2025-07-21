using Microsoft.AspNetCore.Mvc;
using PointsManagementAPI.Services;

namespace PointsManagementAPI.Controllers
{
    /// <summary>
    /// 檔案上傳控制器 - 處理檔案上傳、下載、預覽功能
    /// 主要功能：檔案上傳、檔案下載、檔案預覽
    /// API路由前綴：/api/fileupload
    /// 支援格式：圖片、PDF、Word、Excel等
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class FileUploadController : ControllerBase
    {
        private readonly IFileStorageService _fileStorageService;

        /// <summary>
        /// 檔案上傳控制器建構函數
        /// </summary>
        /// <param name="fileStorageService">檔案存儲服務</param>
        public FileUploadController(IFileStorageService fileStorageService)
        {
            _fileStorageService = fileStorageService;
        }

        /// <summary>
        /// 【POST】 /api/fileupload/upload - 上傳檔案並存儲到指定實體
        /// 功能：處理檔案上傳，存儲檔案並記錄到資料庫
        /// 前端使用：各種檔案上傳功能（積分證明、工作日誌附件等）
        /// 支援：自動檔案驗證、路徑管理、資料庫記錄
        /// </summary>
        /// <param name="file">上傳的檔案</param>
        /// <param name="entityType">實體類型（如PointsEntry、WorkLog）</param>
        /// <param name="entityId">實體ID</param>
        /// <param name="uploadedBy">上傳者ID，預設為1</param>
        /// <returns>檔案上傳結果，包含檔案ID和基本信息</returns>
        [HttpPost("upload")]
        public async Task<ActionResult> UploadFile(
            IFormFile file,
            [FromForm] string entityType,
            [FromForm] int entityId,
            [FromForm] int uploadedBy = 1)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "請選擇檔案" });

                var fileAttachment = await _fileStorageService.SaveFileAsync(file, entityType, entityId, uploadedBy);

                return Ok(new
                {
                    id = fileAttachment.Id,
                    fileName = fileAttachment.FileName,
                    filePath = fileAttachment.FilePath,
                    fileSize = fileAttachment.FileSize,
                    message = "檔案上傳成功"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("upload-multiple")]
        public async Task<ActionResult> UploadMultipleFiles(
            List<IFormFile> files,
            [FromForm] string entityType,
            [FromForm] int entityId,
            [FromForm] int uploadedBy = 1)
        {
            try
            {
                if (files == null || files.Count == 0)
                    return BadRequest(new { message = "請選擇檔案" });

                var uploadResults = new List<object>();

                foreach (var file in files)
                {
                    if (file.Length > 0)
                    {
                        var fileAttachment = await _fileStorageService.SaveFileAsync(file, entityType, entityId, uploadedBy);
                        uploadResults.Add(new
                        {
                            id = fileAttachment.Id,
                            fileName = fileAttachment.FileName,
                            filePath = fileAttachment.FilePath,
                            fileSize = fileAttachment.FileSize
                        });
                    }
                }

                return Ok(new
                {
                    files = uploadResults,
                    message = $"成功上傳 {uploadResults.Count} 個檔案"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("download/{fileId}")]
        public async Task<ActionResult> DownloadFile(int fileId)
        {
            try
            {
                var fileAttachment = await _fileStorageService.GetFileAsync(fileId);
                if (fileAttachment == null)
                    return NotFound(new { message = "檔案不存在" });

                var fileStream = await _fileStorageService.GetFileStreamAsync(fileId);
                if (fileStream == null)
                    return NotFound(new { message = "檔案不存在" });

                return File(fileStream, fileAttachment.ContentType ?? "application/octet-stream", fileAttachment.FileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("delete/{fileId}")]
        public async Task<ActionResult> DeleteFile(int fileId)
        {
            try
            {
                var result = await _fileStorageService.DeleteFileAsync(fileId);
                if (!result)
                    return NotFound(new { message = "檔案不存在或刪除失敗" });

                return Ok(new { message = "檔案刪除成功" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("entity/{entityType}/{entityId}")]
        public async Task<ActionResult> GetFilesByEntity(string entityType, int entityId)
        {
            try
            {
                var files = await _fileStorageService.GetFilesByEntityAsync(entityType, entityId);
                return Ok(files.Select(f => new
                {
                    id = f.Id,
                    fileName = f.FileName,
                    filePath = f.FilePath,
                    fileSize = f.FileSize,
                    contentType = f.ContentType,
                    uploadedAt = f.UploadedAt
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("validate")]
        public ActionResult ValidateFile([FromQuery] string fileName, [FromQuery] long fileSize)
        {
            var isValidType = _fileStorageService.IsValidFileType(fileName);
            var isValidSize = _fileStorageService.IsValidFileSize(fileSize);

            return Ok(new
            {
                isValidType = isValidType,
                isValidSize = isValidSize,
                isValid = isValidType && isValidSize,
                message = !isValidType ? "不支援的檔案格式" :
                         !isValidSize ? "檔案大小超過限制" : "檔案驗證通過"
            });
        }
    }
}
