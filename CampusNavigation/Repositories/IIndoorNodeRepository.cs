using CampusNavigation.Models;

namespace CampusNavigation.Repositories
{
    public interface IIndoorNodeRepository : IRepository<IndoorNode>
    {
        /// <summary>
        /// Returns all nodes belonging to a building.
        /// Uses the BuildingId index defined in AppDbContext.
        /// </summary>
        Task<IEnumerable<IndoorNode>> GetByBuildingAsync(string buildingId);
    }
}
