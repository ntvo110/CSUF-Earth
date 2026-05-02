using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;
using CampusNavigation.Services;
using Moq;

namespace CampusNavigation.Tests;

public class BeaconServiceTests
{
    private readonly Mock<IBeaconRepository>     _beaconRepoMock;
    private readonly Mock<IRepository<Building>> _buildingRepoMock;
    private readonly BeaconService               _service;

    private const string ValidUuid       = "550E8400-E29B-41D4-A716-446655440000";
    private const string ValidBuildingId = "building-1";

    public BeaconServiceTests()
    {
        _beaconRepoMock   = new Mock<IBeaconRepository>();
        _buildingRepoMock = new Mock<IRepository<Building>>();
        _service          = new BeaconService(_beaconRepoMock.Object, _buildingRepoMock.Object);
    }

    // ── GetBeaconsByBuilding ─────────────────────────────────────────────────

    [Fact]
    public async Task GetBeaconsByBuilding_ValidId_ReturnsBeacons()
    {
        _beaconRepoMock.Setup(r => r.GetByBuildingAsync(ValidBuildingId))
                       .ReturnsAsync(new List<Beacon> { new() { BeaconId = "bc1", UUID = ValidUuid, Major = 1, Minor = 1, BuildingId = ValidBuildingId, Floor = 1 } });

        var result = await _service.GetBeaconsByBuilding(ValidBuildingId);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Data!);
    }

    [Fact]
    public async Task GetBeaconsByBuilding_EmptyId_ReturnsInvalidInput()
    {
        var result = await _service.GetBeaconsByBuilding("  ");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_INPUT", result.ErrorCode);
    }

    [Fact]
    public async Task GetBeaconsByBuilding_RepositoryThrows_ReturnsFailure()
    {
        _beaconRepoMock.Setup(r => r.GetByBuildingAsync(ValidBuildingId)).ThrowsAsync(new Exception("DB error"));

        var result = await _service.GetBeaconsByBuilding(ValidBuildingId);

        Assert.False(result.IsSuccess);
        Assert.Equal("DATABASE_ERROR", result.ErrorCode);
    }

    // ── RegisterBeacon ───────────────────────────────────────────────────────

    [Fact]
    public async Task RegisterBeacon_ValidRequest_ReturnsNewBeaconId()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(ValidBuildingId)).ReturnsAsync(new Building { BuildingId = ValidBuildingId });
        _beaconRepoMock.Setup(r => r.GetByIdentifiersAsync(ValidUuid, 1, 1)).ReturnsAsync((Beacon?)null);
        _beaconRepoMock.Setup(r => r.AddAsync(It.IsAny<Beacon>())).ReturnsAsync((Beacon b) => b);
        _beaconRepoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.RegisterBeacon(new BeaconRegistrationDto { Uuid = ValidUuid, Major = 1, Minor = 1, BuildingId = ValidBuildingId, Floor = 1, TxPower = -59 });

        Assert.True(result.IsSuccess);
        Assert.False(string.IsNullOrEmpty(result.Data));
    }

    [Fact]
    public async Task RegisterBeacon_MissingUuid_ReturnsFailure()
    {
        var result = await _service.RegisterBeacon(new BeaconRegistrationDto { Uuid = "", BuildingId = ValidBuildingId });

        Assert.False(result.IsSuccess);
        Assert.Equal("MISSING_REQUIRED_FIELD", result.ErrorCode);
    }

    [Fact]
    public async Task RegisterBeacon_InvalidUuidFormat_ReturnsFailure()
    {
        var result = await _service.RegisterBeacon(new BeaconRegistrationDto { Uuid = "not-a-uuid", BuildingId = ValidBuildingId });

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_UUID_FORMAT", result.ErrorCode);
    }

    [Fact]
    public async Task RegisterBeacon_MajorOutOfRange_ReturnsFailure()
    {
        var result = await _service.RegisterBeacon(new BeaconRegistrationDto { Uuid = ValidUuid, Major = 70000, Minor = 1, BuildingId = ValidBuildingId });

        Assert.False(result.IsSuccess);
        Assert.Equal("VALUE_OUT_OF_RANGE", result.ErrorCode);
    }

    [Fact]
    public async Task RegisterBeacon_MinorOutOfRange_ReturnsFailure()
    {
        var result = await _service.RegisterBeacon(new BeaconRegistrationDto { Uuid = ValidUuid, Major = 1, Minor = -1, BuildingId = ValidBuildingId });

        Assert.False(result.IsSuccess);
        Assert.Equal("VALUE_OUT_OF_RANGE", result.ErrorCode);
    }

    [Fact]
    public async Task RegisterBeacon_BuildingNotFound_ReturnsFailure()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(ValidBuildingId)).ReturnsAsync((Building?)null);

        var result = await _service.RegisterBeacon(new BeaconRegistrationDto { Uuid = ValidUuid, Major = 1, Minor = 1, BuildingId = ValidBuildingId });

        Assert.False(result.IsSuccess);
        Assert.Equal("BUILDING_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task RegisterBeacon_DuplicateBeacon_ReturnsFailure()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(ValidBuildingId)).ReturnsAsync(new Building { BuildingId = ValidBuildingId });
        _beaconRepoMock.Setup(r => r.GetByIdentifiersAsync(ValidUuid, 1, 1)).ReturnsAsync(new Beacon { UUID = ValidUuid, Major = 1, Minor = 1 });

        var result = await _service.RegisterBeacon(new BeaconRegistrationDto { Uuid = ValidUuid, Major = 1, Minor = 1, BuildingId = ValidBuildingId });

        Assert.False(result.IsSuccess);
        Assert.Equal("DUPLICATE_BEACON", result.ErrorCode);
    }

    // ── UpdateBeacon ─────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateBeacon_ValidRequest_ReturnsSuccess()
    {
        var beacon = new Beacon { BeaconId = "bc1", BuildingId = ValidBuildingId };
        _beaconRepoMock.Setup(r => r.GetByIdAsync("bc1")).ReturnsAsync(beacon);
        _buildingRepoMock.Setup(r => r.GetByIdAsync(ValidBuildingId)).ReturnsAsync(new Building { BuildingId = ValidBuildingId });
        _beaconRepoMock.Setup(r => r.UpdateAsync(beacon)).Returns(Task.CompletedTask);
        _beaconRepoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.UpdateBeacon("bc1", new BeaconUpdateDto { X = 5, Y = 10, Floor = 2, BuildingId = ValidBuildingId });

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task UpdateBeacon_BeaconNotFound_ReturnsFailure()
    {
        _beaconRepoMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Beacon?)null);

        var result = await _service.UpdateBeacon("missing", new BeaconUpdateDto { BuildingId = ValidBuildingId });

        Assert.False(result.IsSuccess);
        Assert.Equal("BEACON_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task UpdateBeacon_BuildingNotFound_ReturnsFailure()
    {
        _beaconRepoMock.Setup(r => r.GetByIdAsync("bc1")).ReturnsAsync(new Beacon { BeaconId = "bc1" });
        _buildingRepoMock.Setup(r => r.GetByIdAsync("bad-building")).ReturnsAsync((Building?)null);

        var result = await _service.UpdateBeacon("bc1", new BeaconUpdateDto { BuildingId = "bad-building" });

        Assert.False(result.IsSuccess);
        Assert.Equal("BUILDING_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task UpdateBeacon_EmptyId_ReturnsInvalidInput()
    {
        var result = await _service.UpdateBeacon("", new BeaconUpdateDto());

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_INPUT", result.ErrorCode);
    }

    // ── DeleteBeacon ─────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteBeacon_ExistingBeacon_ReturnsSuccess()
    {
        var beacon = new Beacon { BeaconId = "bc1" };
        _beaconRepoMock.Setup(r => r.GetByIdAsync("bc1")).ReturnsAsync(beacon);
        _beaconRepoMock.Setup(r => r.DeleteAsync(beacon)).Returns(Task.CompletedTask);
        _beaconRepoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.DeleteBeacon("bc1");

        Assert.True(result.IsSuccess);
        _beaconRepoMock.Verify(r => r.DeleteAsync(beacon), Times.Once);
    }

    [Fact]
    public async Task DeleteBeacon_NotFound_ReturnsFailure()
    {
        _beaconRepoMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Beacon?)null);

        var result = await _service.DeleteBeacon("missing");

        Assert.False(result.IsSuccess);
        Assert.Equal("BEACON_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task DeleteBeacon_EmptyId_ReturnsInvalidInput()
    {
        var result = await _service.DeleteBeacon("  ");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_INPUT", result.ErrorCode);
    }

    // ── GetBeaconByIdentifiers ───────────────────────────────────────────────

    [Fact]
    public async Task GetBeaconByIdentifiers_Found_ReturnsBeacon()
    {
        _beaconRepoMock.Setup(r => r.GetByIdentifiersAsync(ValidUuid, 1, 1)).ReturnsAsync(new Beacon { UUID = ValidUuid, Major = 1, Minor = 1 });

        var result = await _service.GetBeaconByIdentifiers(ValidUuid, 1, 1);

        Assert.True(result.IsSuccess);
        Assert.Equal(ValidUuid, result.Data!.UUID);
    }

    [Fact]
    public async Task GetBeaconByIdentifiers_NotFound_ReturnsFailure()
    {
        _beaconRepoMock.Setup(r => r.GetByIdentifiersAsync(ValidUuid, 9, 9)).ReturnsAsync((Beacon?)null);

        var result = await _service.GetBeaconByIdentifiers(ValidUuid, 9, 9);

        Assert.False(result.IsSuccess);
        Assert.Equal("BEACON_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task GetBeaconByIdentifiers_EmptyUuid_ReturnsInvalidInput()
    {
        var result = await _service.GetBeaconByIdentifiers("", 1, 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_INPUT", result.ErrorCode);
    }
}
