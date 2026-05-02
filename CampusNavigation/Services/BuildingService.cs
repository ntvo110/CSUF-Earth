using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;

namespace CampusNavigation.Services;

public class BuildingService : IBuildingService
{
    private readonly IRepository<Building> _buildingRepository;

    public BuildingService(IRepository<Building> buildingRepository)
    {
        _buildingRepository = buildingRepository;
    }

    public async Task<Result<IEnumerable<BuildingDto>>> GetAllBuildings()
    {
        try
        {
            var buildings = await _buildingRepository.GetAllAsync();
            return Result<IEnumerable<BuildingDto>>.Success(buildings.Select(MapToDto));
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<BuildingDto>>.Failure("DATABASE_ERROR", $"Failed to retrieve buildings: {ex.Message}");
        }
    }

    public async Task<Result<BuildingDto>> GetBuildingById(string buildingId)
    {
        if (string.IsNullOrWhiteSpace(buildingId))
            return Result<BuildingDto>.Failure("INVALID_INPUT", "Building ID cannot be empty.");

        var building = await _buildingRepository.GetByIdAsync(buildingId);
        if (building == null)
            return Result<BuildingDto>.Failure("BUILDING_NOT_FOUND", $"Building with ID {buildingId} not found.");

        return Result<BuildingDto>.Success(MapToDto(building));
    }

    public async Task<Result<BuildingDto>> CreateBuilding(CreateBuildingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.BuildingName))
            return Result<BuildingDto>.Failure("MISSING_REQUIRED_FIELD", "Building Name is required.");
        if (request.Lat < -90.0 || request.Lat > 90.0)
            return Result<BuildingDto>.Failure("VALUE_OUT_OF_RANGE", "Latitude must be a value between -90 and 90.");
        if (request.Long < -180.0 || request.Long > 180.0)
            return Result<BuildingDto>.Failure("VALUE_OUT_OF_RANGE", "Longitude must be a value between -180 and 180.");
        if (request.FloorCount < 1)
            return Result<BuildingDto>.Failure("VALUE_OUT_OF_RANGE", "Floor count must be 1 or greater.");

        var building = new Building
        {
            BuildingId         = Guid.NewGuid().ToString(),
            BuildingName       = request.BuildingName,
            Lat                = request.Lat,
            Long               = request.Long,
            FloorCount         = request.FloorCount,
            Algorithm          = request.Algorithm,
            GeofenceRadiusFeet = request.GeofenceRadiusFeet,
            CreatedAt          = DateTime.UtcNow
        };

        await _buildingRepository.AddAsync(building);
        await _buildingRepository.SaveChangesAsync();

        return Result<BuildingDto>.Success(MapToDto(building));
    }

    public async Task<Result<BuildingDto>> UpdateBuilding(string buildingId, UpdateBuildingRequest request)
    {
        var building = await _buildingRepository.GetByIdAsync(buildingId);
        if (building == null)
            return Result<BuildingDto>.Failure("BUILDING_NOT_FOUND", $"Building {buildingId} not found.");

        building.BuildingName       = request.BuildingName;
        building.Lat                = request.Lat;
        building.Long               = request.Long;
        building.FloorCount         = request.FloorCount;
        building.Algorithm          = request.Algorithm ?? building.Algorithm;
        building.GeofenceRadiusFeet = request.GeofenceRadiusFeet;

        await _buildingRepository.UpdateAsync(building);
        await _buildingRepository.SaveChangesAsync();

        return Result<BuildingDto>.Success(MapToDto(building));
    }

    public async Task<Result> DeleteBuilding(string buildingId)
    {
        var building = await _buildingRepository.GetByIdAsync(buildingId);
        if (building == null)
            return Result.Failure("BUILDING_NOT_FOUND", $"Building {buildingId} not found.");

        await _buildingRepository.DeleteAsync(building);
        await _buildingRepository.SaveChangesAsync();

        return Result.Success();
    }

    private static BuildingDto MapToDto(Building b) => new()
    {
        BuildingId         = b.BuildingId,
        BuildingName       = b.BuildingName,
        Lat                = b.Lat,
        Long               = b.Long,
        FloorCount         = b.FloorCount,
        Algorithm          = b.Algorithm.ToString(),
        GeofenceRadiusFeet = b.GeofenceRadiusFeet
    };
}
