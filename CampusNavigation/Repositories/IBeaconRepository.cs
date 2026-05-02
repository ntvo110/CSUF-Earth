using CampusNavigation.Models;

namespace CampusNavigation.Repositories
{
    public interface IBeaconRepository : IRepository<Beacon>
    {
        Task<IEnumerable<Beacon>> GetByBuildingAsync(string buildingId);

        /// <summary>
        /// Looks up a beacon by its iBeacon identifiers (UUID + Major + Minor).
        /// Used by the navigation engine to match detected BLE signals to known beacons.
        /// </summary>
        Task<Beacon?> GetByIdentifiersAsync(string uuid, int major, int minor);
    }
}
