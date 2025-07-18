using PointsManagementAPI.Models;

namespace PointsManagementAPI.Services
{
    public interface IFileStorageService
    {
        Task<FileAttachment> SaveFileAsync(IFormFile file, string entityType, int entityId, int uploadedBy);
        Task<FileAttachment?> GetFileAsync(int fileId);
        Task<IEnumerable<FileAttachment>> GetFilesByEntityAsync(string entityType, int entityId);
        Task<bool> DeleteFileAsync(int fileId);
        Task<Stream?> GetFileStreamAsync(int fileId);
        Task<string> GetFilePathAsync(int fileId);
        bool IsValidFileType(string fileName);
        bool IsValidFileSize(long fileSize);
    }
}
