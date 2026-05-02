using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;
using CampusNavigation.Services;
using Moq;

namespace CampusNavigation.Tests;

public class BuildingServiceTests
{
    private readonly Mock<IRepository<Building>> _repoMock;
    private readonly BuildingService             _service;

    public BuildingServiceTests()
    {
        _repoMock = new Mock<IRepository<Building>>();
        _service  = new BuildingService(_repoMock.Object);
    }

    // ── GetAllBuildings ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllBuildings_ReturnsAllBuildings()
    {
        var buildings = new List<Building>
        {
            new() { BuildingId = "b1", BuildingName = "Hall A", Algorithm = NavigationType.Bilateration },
            new() { BuildingId = "b2", BuildingName = "Hall B", Algorithm = NavigationType.Trilateration }
        };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(buildings);

        var result = await _service.GetAllBuildings();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Data!.Count());
    }

    [Fact]
    public async Task GetAllBuildings_MapsAlgorithmToString()
    {
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Building>
        {
            new() { BuildingId = "b1", BuildingName = "Hall A", Algorithm = NavigationType.Trilateration }
        });

        var result = await _service.GetAllBuildings();

        Assert.Equal("Trilateration", result.Data!.First().Algorithm);
    }

    [Fact]
    public async Task GetAllBuildings_WhenRepositoryThrows_ReturnsFailure()
    {
        _repoMock.Setup(r => r.GetAllAsync()).ThrowsAsync(new Exception("DB down"));

        var result = await _service.GetAllBuildings();

        Assert.False(result.IsSuccess);
        Assert.Equal("DATABASE_ERROR", result.ErrorCode);
    }

    // ── GetBuildingById ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetBuildingById_ExistingId_ReturnsBuilding()
    {
        _repoMock.Setup(r => r.GetByIdAsync("b1"))
                 .ReturnsAsync(new Building { BuildingId = "b1", BuildingName = "Hall A", Algorithm = NavigationType.Bilateration });

        var result = await _service.GetBuildingById("b1");

        Assert.True(result.IsSuccess);
        Assert.Equal("b1", result.Data!.BuildingId);
    }

    [Fact]
    public async Task GetBuildingById_NotFound_ReturnsFailure()
    {
        _repoMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Building?)null);

        var result = await _service.GetBuildingById("missing");

        Assert.False(result.IsSuccess);
        Assert.Equal("BUILDING_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task GetBuildingById_EmptyId_ReturnsInvalidInput()
    {
        var result = await _service.GetBuildingById("   ");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_INPUT", result.ErrorCode);
    }

    // ── CreateBuilding ───────────────────────────────────────────────────────

    [Fact]
    public async Task CreateBuilding_ValidRequest_ReturnsCreatedBuilding()
    {
        _repoMock.Setup(r => r.AddAsync(It.IsAny<Building>())).ReturnsAsync((Building b) => b);
        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var request = new CreateBuildingRequest
        {
            BuildingName = "Science Hall", Lat = 33.88, Long = -117.88,
            FloorCount = 4, Algorithm = NavigationType.Bilateration, GeofenceRadiusFeet = 200
        };

        var result = await _service.CreateBuilding(request);

        Assert.True(result.IsSuccess);
        Assert.Equal("Science Hall", result.Data!.BuildingName);
    }

    [Fact]
    public async Task CreateBuilding_MissingName_ReturnsFailure()
    {
        var result = await _service.CreateBuilding(new CreateBuildingRequest { BuildingName = "", Lat = 33.8, Long = -117.8, FloorCount = 1 });

        Assert.False(result.IsSuccess);
        Assert.Equal("MISSING_REQUIRED_FIELD", result.ErrorCode);
    }

    [Fact]
    public async Task CreateBuilding_InvalidLatitude_ReturnsFailure()
    {
        var result = await _service.CreateBuilding(new CreateBuildingRequest { BuildingName = "Hall", Lat = 95.0, Long = -117.8, FloorCount = 1 });

        Assert.False(result.IsSuccess);
        Assert.Equal("VALUE_OUT_OF_RANGE", result.ErrorCode);
    }

    [Fact]
    public async Task CreateBuilding_InvalidLongitude_ReturnsFailure()
    {
        var result = await _service.CreateBuilding(new CreateBuildingRequest { BuildingName = "Hall", Lat = 33.8, Long = 200.0, FloorCount = 1 });

        Assert.False(result.IsSuccess);
        Assert.Equal("VALUE_OUT_OF_RANGE", result.ErrorCode);
    }

    [Fact]
    public async Task CreateBuilding_ZeroFloorCount_ReturnsFailure()
    {
        var result = await _service.CreateBuilding(new CreateBuildingRequest { BuildingName = "Hall", Lat = 33.8, Long = -117.8, FloorCount = 0 });

        Assert.False(result.IsSuccess);
        Assert.Equal("VALUE_OUT_OF_RANGE", result.ErrorCode);
    }

    // ── UpdateBuilding ───────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateBuilding_ExistingBuilding_UpdatesAndReturnsDto()
    {
        var existing = new Building { BuildingId = "b1", BuildingName = "Old", Lat = 33.8, Long = -117.8, FloorCount = 2, Algorithm = NavigationType.Bilateration, GeofenceRadiusFeet = 164 };
        _repoMock.Setup(r => r.GetByIdAsync("b1")).ReturnsAsync(existing);
        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<Building>())).Returns(Task.CompletedTask);
        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.UpdateBuilding("b1", new UpdateBuildingRequest { BuildingName = "New", Lat = 33.9, Long = -117.9, FloorCount = 5, Algorithm = NavigationType.Trilateration, GeofenceRadiusFeet = 300 });

        Assert.True(result.IsSuccess);
        Assert.Equal("New", result.Data!.BuildingName);
    }

    [Fact]
    public async Task UpdateBuilding_NotFound_ReturnsFailure()
    {
        _repoMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Building?)null);

        var result = await _service.UpdateBuilding("missing", new UpdateBuildingRequest { BuildingName = "X", FloorCount = 1 });

        Assert.False(result.IsSuccess);
        Assert.Equal("BUILDING_NOT_FOUND", result.ErrorCode);
    }

    // ── DeleteBuilding ───────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteBuilding_ExistingBuilding_ReturnsSuccess()
    {
        var building = new Building { BuildingId = "b1", BuildingName = "Hall A" };
        _repoMock.Setup(r => r.GetByIdAsync("b1")).ReturnsAsync(building);
        _repoMock.Setup(r => r.DeleteAsync(building)).Returns(Task.CompletedTask);
        _repoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.DeleteBuilding("b1");

        Assert.True(result.IsSuccess);
        _repoMock.Verify(r => r.DeleteAsync(building), Times.Once);
    }

    [Fact]
    public async Task DeleteBuilding_NotFound_ReturnsFailure()
    {
        _repoMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Building?)null);

        var result = await _service.DeleteBuilding("missing");

        Assert.False(result.IsSuccess);
        Assert.Equal("BUILDING_NOT_FOUND", result.ErrorCode);
    }
}
