using CampusNavigation.DTOs;

namespace CampusNavigation.Services
{
    public interface IBuildingService
    {
        Task<Result<IEnumerable<BuildingDto>>> GetAllBuildings();
        Task<Result<BuildingDto>> GetBuildingById(string buildingId);
        Task<Result<BuildingDto>> CreateBuilding(CreateBuildingRequest request);
        Task<Result<BuildingDto>> UpdateBuilding(string buildingId, UpdateBuildingRequest request);
        Task<Result> DeleteBuilding(string buildingId);
    }
}
