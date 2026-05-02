using CampusNavigation.Data;
using CampusNavigation.Models;
using Microsoft.EntityFrameworkCore;

namespace CampusNavigation.Repositories
{
    public class IndoorNodeRepository : Repository<IndoorNode>, IIndoorNodeRepository
    {
        public IndoorNodeRepository(ApplicationDbContext context) : base(context) { }

        public async Task<IEnumerable<IndoorNode>> GetByBuildingAsync(string buildingId)
        {
            if (string.IsNullOrWhiteSpace(buildingId))
                return Enumerable.Empty<IndoorNode>();

            return await _dbSet
                .Where(r => r.BuildingId == buildingId)
                .ToListAsync();
        }
    }
}
