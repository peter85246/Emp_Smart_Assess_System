using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models;
using System.IO;

namespace PointsManagementAPI.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly PointsDbContext _context;

        public FileStorageService(IConfiguration configuration, IWebHostEnvironment environment, PointsDbContext context)
        {
            _configuration = configuration;
            _environment = environment;
            _context = context;
        }

        public async Task<FileAttachment> SaveFileAsync(IFormFile file, string entityType, int entityId, int uploadedBy)
        {
            if (!IsValidFileType(file.FileName))
                throw new ArgumentException("不支援的檔案格式");

            if (!IsValidFileSize(file.Length))
                throw new ArgumentException("檔案大小超過限制");

            var uploadPath = _configuration["FileStorage:UploadPath"] ?? "uploads";
            var fullUploadPath = Path.Combine(_environment.ContentRootPath, uploadPath, entityType);

            if (!Directory.Exists(fullUploadPath))
                Directory.CreateDirectory(fullUploadPath);

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(fullUploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 記錄檔案資訊到資料庫
            var fileAttachment = new FileAttachment
            {
                FileName = file.FileName,
                FilePath = Path.Combine(uploadPath, entityType, fileName),
                FileSize = file.Length,
                ContentType = file.ContentType,
                EntityType = entityType,
                EntityId = entityId,
                UploadedBy = uploadedBy
            };

            _context.FileAttachments.Add(fileAttachment);
            await _context.SaveChangesAsync();

            return fileAttachment;
        }



        public bool IsValidFileType(string fileName)
        {
            var allowedExtensions = _configuration.GetSection("FileStorage:AllowedExtensions").Get<string[]>() 
                ?? new[] { ".jpg", ".jpeg", ".png", ".pdf", ".docx", ".xlsx" };

            var extension = Path.GetExtension(fileName).ToLower();
            return allowedExtensions.Contains(extension);
        }

        public bool IsValidFileSize(long fileSize)
        {
            var maxFileSize = _configuration.GetValue<long>("FileStorage:MaxFileSize", 10485760); // 10MB default
            return fileSize <= maxFileSize;
        }

        public async Task<FileAttachment?> GetFileAsync(int fileId)
        {
            return await _context.FileAttachments.FindAsync(fileId);
        }

        public async Task<IEnumerable<FileAttachment>> GetFilesByEntityAsync(string entityType, int entityId)
        {
            return await _context.FileAttachments
                .Where(f => f.EntityType == entityType && f.EntityId == entityId && f.IsActive)
                .ToListAsync();
        }

        public async Task<bool> DeleteFileAsync(int fileId)
        {
            var fileAttachment = await _context.FileAttachments.FindAsync(fileId);
            if (fileAttachment == null)
                return false;

            try
            {
                var fullPath = Path.Combine(_environment.ContentRootPath, fileAttachment.FilePath);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }

                fileAttachment.IsActive = false;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<Stream?> GetFileStreamAsync(int fileId)
        {
            var fileAttachment = await _context.FileAttachments.FindAsync(fileId);
            if (fileAttachment == null || !fileAttachment.IsActive)
                return null;

            var fullPath = Path.Combine(_environment.ContentRootPath, fileAttachment.FilePath);
            if (!File.Exists(fullPath))
                return null;

            return new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        }

        public async Task<string> GetFilePathAsync(int fileId)
        {
            var fileAttachment = await _context.FileAttachments.FindAsync(fileId);
            if (fileAttachment == null || !fileAttachment.IsActive)
                return string.Empty;

            return Path.Combine(_environment.ContentRootPath, fileAttachment.FilePath);
        }
    }
}
