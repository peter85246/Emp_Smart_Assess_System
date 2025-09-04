using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models.PointsModels;

namespace PointsManagementAPI.Services
{
    public class StandardsService : IStandardsService
    {
        private readonly PointsDbContext _context;

        public StandardsService(PointsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StandardSetting>> GetAllStandardsAsync()
        {
            return await _context.StandardSettings
                .Include(s => s.Children)
                .Where(s => s.IsActive)
                .OrderBy(s => s.SortOrder)
                .ThenBy(s => s.CategoryName)
                .ToListAsync();
        }

        public async Task<IEnumerable<StandardSetting>> GetStandardsByDepartmentAsync(int departmentId)
        {
            return await _context.StandardSettings
                .Include(s => s.Children)
                .Where(s => s.IsActive && 
                    (s.DepartmentFilter == null || 
                     s.DepartmentFilter.Contains(departmentId.ToString()) ||
                     s.DepartmentId == departmentId || 
                     s.DepartmentId == null))
                .OrderBy(s => s.SortOrder)
                .ThenBy(s => s.CategoryName)
                .ToListAsync();
        }

        public async Task<IEnumerable<StandardSetting>> GetStandardsByTypeAsync(string pointsType)
        {
            return await _context.StandardSettings
                .Include(s => s.Children)
                .Where(s => s.IsActive && s.PointsType == pointsType)
                .OrderBy(s => s.CategoryName)
                .ToListAsync();
        }

        public async Task<StandardSetting?> GetStandardByIdAsync(int id)
        {
            return await _context.StandardSettings
                .Include(s => s.Children)
                .Include(s => s.Parent)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<StandardSetting> CreateStandardAsync(StandardSetting standard)
        {
            _context.StandardSettings.Add(standard);
            await _context.SaveChangesAsync();
            return standard;
        }

        public async Task<StandardSetting> UpdateStandardAsync(StandardSetting standard)
        {
            _context.StandardSettings.Update(standard);
            await _context.SaveChangesAsync();
            return standard;
        }

        public async Task<bool> DeleteStandardAsync(int id)
        {
            var standard = await _context.StandardSettings.FindAsync(id);
            if (standard == null) return false;

            standard.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> StandardExistsAsync(int id)
        {
            return await _context.StandardSettings.AnyAsync(s => s.Id == id);
        }

        public async Task<IEnumerable<StandardSetting>> GetStandardsTreeAsync()
        {
            var allStandards = await _context.StandardSettings
                .Include(s => s.Children)
                .Where(s => s.IsActive)
                .ToListAsync();

            return allStandards.Where(s => s.ParentId == null);
        }
    }


}
