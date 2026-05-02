using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;

namespace CampusNavigation.Services
{
    public class IndoorNodeService : IIndoorNodeService
    {
        private readonly IIndoorNodeRepository  _nodeRepository;
        private readonly IRepository<Building>  _buildingRepository;

        public IndoorNodeService(IIndoorNodeRepository nodeRepository, IRepository<Building> buildingRepository)
        {
            _nodeRepository     = nodeRepository     ?? throw new ArgumentNullException(nameof(nodeRepository));
            _buildingRepository = buildingRepository ?? throw new ArgumentNullException(nameof(buildingRepository));
        }

        public async Task<Result<IEnumerable<IndoorNodeDto>>> GetNodesByBuilding(string buildingId)
        {
            if (string.IsNullOrWhiteSpace(buildingId))
                return Result<IEnumerable<IndoorNodeDto>>.Failure("INVALID_INPUT", "Building ID cannot be empty.");

            var building = await _buildingRepository.GetByIdAsync(buildingId);
            if (building == null)
                return Result<IEnumerable<IndoorNodeDto>>.Failure("BUILDING_NOT_FOUND", $"Building {buildingId} does not exist");

            try
            {
                var nodes = await _nodeRepository.GetByBuildingAsync(buildingId);
                return Result<IEnumerable<IndoorNodeDto>>.Success(nodes.Select(MapToDto));
            }
            catch (Exception ex)
            {
                return Result<IEnumerable<IndoorNodeDto>>.Failure("DATABASE_ERROR", $"Failed to retrieve nodes: {ex.Message}");
            }
        }

        public async Task<Result<IndoorNodeDto>> GetNodeById(string indoorNodeId)
        {
            if (string.IsNullOrWhiteSpace(indoorNodeId))
                return Result<IndoorNodeDto>.Failure("INVALID_INPUT", "Node ID cannot be empty.");

            var node = await _nodeRepository.GetByIdAsync(indoorNodeId);
            if (node == null)
                return Result<IndoorNodeDto>.Failure("NODE_NOT_FOUND", $"Node {indoorNodeId} does not exist");

            return Result<IndoorNodeDto>.Success(MapToDto(node));
        }

        public async Task<Result<IndoorNodeDto>> CreateNode(CreateIndoorNodeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.BuildingId))
                return Result<IndoorNodeDto>.Failure("MISSING_REQUIRED_FIELD", "Building ID is required");
            if (string.IsNullOrWhiteSpace(request.Name))
                return Result<IndoorNodeDto>.Failure("MISSING_REQUIRED_FIELD", "Node name is required.");

            var building = await _buildingRepository.GetByIdAsync(request.BuildingId);
            if (building == null)
                return Result<IndoorNodeDto>.Failure("INVALID_BUILDING_ASSOCIATION", $"Building {request.BuildingId} does not exist");

            if (request.Floor < 0 || request.Floor > building.FloorCount)
                return Result<IndoorNodeDto>.Failure("VALUE_OUT_OF_RANGE", $"Floor must be between 0 and {building.FloorCount}");

            var node = new IndoorNode
            {
                IndoorNodeId = Guid.NewGuid().ToString(),
                BuildingId   = request.BuildingId,
                Name         = request.Name,
                Floor        = request.Floor,
                NodeType     = request.NodeType,
                X            = request.X,
                Y            = request.Y,
                CreatedAt    = DateTime.UtcNow
            };

            await _nodeRepository.AddAsync(node);
            await _nodeRepository.SaveChangesAsync();

            return Result<IndoorNodeDto>.Success(MapToDto(node));
        }

        public async Task<Result<IndoorNodeDto>> UpdateNode(string indoorNodeId, UpdateIndoorNodeRequest request)
        {
            if (string.IsNullOrWhiteSpace(indoorNodeId))
                return Result<IndoorNodeDto>.Failure("INVALID_INPUT", "Node ID cannot be empty.");

            var node = await _nodeRepository.GetByIdAsync(indoorNodeId);
            if (node == null)
                return Result<IndoorNodeDto>.Failure("NODE_NOT_FOUND", $"Node {indoorNodeId} does not exist");

            node.Name     = request.Name;
            node.Floor    = request.Floor;
            node.NodeType = request.NodeType;
            node.X        = request.X;
            node.Y        = request.Y;

            await _nodeRepository.UpdateAsync(node);
            await _nodeRepository.SaveChangesAsync();

            return Result<IndoorNodeDto>.Success(MapToDto(node));
        }

        public async Task<Result> DeleteNode(string indoorNodeId)
        {
            if (string.IsNullOrWhiteSpace(indoorNodeId))
                return Result.Failure("INVALID_INPUT", "Node ID cannot be empty.");

            var node = await _nodeRepository.GetByIdAsync(indoorNodeId);
            if (node == null)
                return Result.Failure("NODE_NOT_FOUND", $"Node {indoorNodeId} does not exist.");

            await _nodeRepository.DeleteAsync(node);
            await _nodeRepository.SaveChangesAsync();

            return Result.Success();
        }

        private static IndoorNodeDto MapToDto(IndoorNode n) => new()
        {
            IndoorNodeId = n.IndoorNodeId,
            BuildingId   = n.BuildingId,
            Name         = n.Name,
            Floor        = n.Floor,
            NodeType     = n.NodeType,
            X            = n.X,
            Y            = n.Y
        };
    }
}
