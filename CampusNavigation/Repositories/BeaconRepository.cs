using CampusNavigation.Data;
using CampusNavigation.Models;
using Microsoft.EntityFrameworkCore;

namespace CampusNavigation.Repositories
{
    public class BeaconRepository : Repository<Beacon>, IBeaconRepository
    {
        public BeaconRepository(ApplicationDbContext context) : base(context) { }

        public async Task<IEnumerable<Beacon>> GetByBuildingAsync(string buildingId)
        {
            if (string.IsNullOrWhiteSpace(buildingId))
                return Enumerable.Empty<Beacon>();

            return await _dbSet.Where(b => b.BuildingId == buildingId).ToListAsync();
        }

        public async Task<Beacon?> GetByIdentifiersAsync(string uuid, int major, int minor)
        {
            if (string.IsNullOrWhiteSpace(uuid)) return null;

            return await _dbSet.FirstOrDefaultAsync(b =>
                b.UUID == uuid && b.Major == major && b.Minor == minor);
        }
    }
}
