using CampusNavigation.DTOs;

namespace CampusNavigation.Services
{
    public interface IIndoorNodeService
    {
        Task<Result<IEnumerable<IndoorNodeDto>>> GetNodesByBuilding(string buildingId);
        Task<Result<IndoorNodeDto>> GetNodeById(string indoorNodeId);
        Task<Result<IndoorNodeDto>> CreateNode(CreateIndoorNodeRequest request);
        Task<Result<IndoorNodeDto>> UpdateNode(string indoorNodeId, UpdateIndoorNodeRequest request);
        Task<Result> DeleteNode(string indoorNodeId);
    }
}
