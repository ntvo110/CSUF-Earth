using CampusNavigation.Data;
using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;
using CampusNavigation.Services;
using CampusNavigation.Utilities;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace CampusNavigation.Tests;

public class IndoorNavigationServiceTests : IDisposable
{
    private readonly ApplicationDbContext          _context;
    private readonly Mock<IRepository<Building>>   _buildingRepoMock;
    private readonly Mock<IRepository<Beacon>>     _beaconRepoMock;
    private readonly Mock<IRepository<IndoorNode>> _nodeRepoMock;
    private readonly Mock<IRepository<IndoorEdge>> _edgeRepoMock;
    private readonly IndoorNavigationService       _service;

    private const string BuildingId = "bld-1";
    private const string NodeAId    = "node-a";
    private const string NodeBId    = "node-b";
    private const string NodeCId    = "node-c";
    private const string BeaconUuid = "550E8400-E29B-41D4-A716-446655440000";

    public IndoorNavigationServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        _buildingRepoMock = new Mock<IRepository<Building>>();
        _beaconRepoMock   = new Mock<IRepository<Beacon>>();
        _nodeRepoMock     = new Mock<IRepository<IndoorNode>>();
        _edgeRepoMock     = new Mock<IRepository<IndoorEdge>>();

        _service = new IndoorNavigationService(
            _context,
            _buildingRepoMock.Object,
            _beaconRepoMock.Object,
            _nodeRepoMock.Object,
            _edgeRepoMock.Object);

        NavigationUtilities.ResetKalmanFilter();
    }

    public void Dispose() => _context.Dispose();

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static Building MakeBuilding(NavigationType algo = NavigationType.Bilateration) =>
        new() { BuildingId = BuildingId, BuildingName = "Test Hall", FloorCount = 3, Algorithm = algo };

    private static (List<IndoorNode> nodes, List<IndoorEdge> edges) MakeLinearGraph()
    {
        var nodeA = new IndoorNode { IndoorNodeId = NodeAId, BuildingId = BuildingId, Name = "A", Floor = 1, X = 0,  Y = 0, NodeType = "Hallway" };
        var nodeB = new IndoorNode { IndoorNodeId = NodeBId, BuildingId = BuildingId, Name = "B", Floor = 1, X = 10, Y = 0, NodeType = "Hallway" };
        var nodeC = new IndoorNode { IndoorNodeId = NodeCId, BuildingId = BuildingId, Name = "C", Floor = 1, X = 20, Y = 0, NodeType = "Room" };

        var edgeAB = new IndoorEdge { EdgeId = "e1", BuildingId = BuildingId, StartNodeId = NodeAId, EndNodeId = NodeBId, Distance = 10 };
        var edgeBC = new IndoorEdge { EdgeId = "e2", BuildingId = BuildingId, StartNodeId = NodeBId, EndNodeId = NodeCId, Distance = 10 };

        return (new List<IndoorNode> { nodeA, nodeB, nodeC }, new List<IndoorEdge> { edgeAB, edgeBC });
    }

    private static List<Beacon> MakeBeacons() => new()
    {
        new() { BeaconId = "bc1", UUID = BeaconUuid, Major = 1, Minor = 1, BuildingId = BuildingId, Floor = 1, X = 0,  Y = 0,  TxPower = -59 },
        new() { BeaconId = "bc2", UUID = BeaconUuid, Major = 1, Minor = 2, BuildingId = BuildingId, Floor = 1, X = 10, Y = 0,  TxPower = -59 }
    };

    private static List<DetectedBeacon> MakeDetectedBeacons() => new()
    {
        new() { UUID = BeaconUuid, Major = 1, Minor = 1, RSSI = -59 },
        new() { UUID = BeaconUuid, Major = 1, Minor = 2, RSSI = -80 }
    };

    // ── Tests ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task NavigateAsync_BuildingNotFound_ReturnsFailure()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync((Building?)null);

        var result = await _service.NavigateAsync(new NavigateRequest { BuildingId = BuildingId, DestinationNodeId = NodeCId, Beacons = MakeDetectedBeacons() }, "user-1");

        Assert.False(result.IsSuccess);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task NavigateAsync_NoBeaconsDetected_ReturnsFailure()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding());
        _beaconRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Beacon, bool>>>())).ReturnsAsync(MakeBeacons());

        var result = await _service.NavigateAsync(new NavigateRequest { BuildingId = BuildingId, DestinationNodeId = NodeCId, Beacons = new List<DetectedBeacon>() }, "user-1");

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task NavigateAsync_NoMatchingBeaconsInDb_ReturnsFailure()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding());
        _beaconRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Beacon, bool>>>())).ReturnsAsync(new List<Beacon>());

        var result = await _service.NavigateAsync(new NavigateRequest { BuildingId = BuildingId, DestinationNodeId = NodeCId, Beacons = MakeDetectedBeacons() }, "user-1");

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task NavigateAsync_DestinationNodeNotFound_ReturnsFailure()
    {
        NavigationUtilities.ResetKalmanFilter();
        var (nodes, edges) = MakeLinearGraph();
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding());
        _beaconRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Beacon, bool>>>())).ReturnsAsync(MakeBeacons());
        _nodeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorNode, bool>>>())).ReturnsAsync(nodes);
        _edgeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorEdge, bool>>>())).ReturnsAsync(edges);

        var result = await _service.NavigateAsync(new NavigateRequest { BuildingId = BuildingId, DestinationNodeId = "nonexistent", Beacons = MakeDetectedBeacons() }, "user-1");

        Assert.False(result.IsSuccess);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task NavigateAsync_UserAlreadyAtDestination_ReturnsZeroDistance()
    {
        NavigationUtilities.ResetKalmanFilter();
        var (nodes, edges) = MakeLinearGraph();
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding());
        _beaconRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Beacon, bool>>>())).ReturnsAsync(MakeBeacons());
        _nodeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorNode, bool>>>())).ReturnsAsync(nodes);
        _edgeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorEdge, bool>>>())).ReturnsAsync(edges);

        var result = await _service.NavigateAsync(new NavigateRequest { BuildingId = BuildingId, DestinationNodeId = NodeAId, Beacons = MakeDetectedBeacons() }, "user-1");

        Assert.True(result.IsSuccess);
        Assert.Equal(0, result.Data!.TotalDistanceFeet);
        Assert.Empty(result.Data.Path);
    }

    [Fact]
    public async Task NavigateAsync_ValidRoute_ReturnsPathWithCorrectTotalDistance()
    {
        NavigationUtilities.ResetKalmanFilter();
        var (nodes, edges) = MakeLinearGraph();
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding());
        _beaconRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Beacon, bool>>>())).ReturnsAsync(MakeBeacons());
        _nodeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorNode, bool>>>())).ReturnsAsync(nodes);
        _edgeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorEdge, bool>>>())).ReturnsAsync(edges);

        var result = await _service.NavigateAsync(new NavigateRequest { BuildingId = BuildingId, DestinationNodeId = NodeCId, Beacons = MakeDetectedBeacons() }, "user-1");

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Data!.Path.Count);
        Assert.Equal(20.0, result.Data.TotalDistanceFeet, precision: 1);
    }

    [Fact]
    public async Task NavigateAsync_ValidRoute_PathSegmentsHaveWalkAction()
    {
        NavigationUtilities.ResetKalmanFilter();
        var (nodes, edges) = MakeLinearGraph();
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding());
        _beaconRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Beacon, bool>>>())).ReturnsAsync(MakeBeacons());
        _nodeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorNode, bool>>>())).ReturnsAsync(nodes);
        _edgeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorEdge, bool>>>())).ReturnsAsync(edges);

        var result = await _service.NavigateAsync(new NavigateRequest { BuildingId = BuildingId, DestinationNodeId = NodeCId, Beacons = MakeDetectedBeacons() }, "user-1");

        Assert.True(result.IsSuccess);
        Assert.All(result.Data!.Path, seg => Assert.Equal("Walk", seg.Action));
    }

    [Fact]
    public async Task NavigateAsync_DisconnectedGraph_ReturnsNoPathFound()
    {
        NavigationUtilities.ResetKalmanFilter();
        var (nodes, _) = MakeLinearGraph();
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding());
        _beaconRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Beacon, bool>>>())).ReturnsAsync(MakeBeacons());
        _nodeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorNode, bool>>>())).ReturnsAsync(nodes);
        _edgeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorEdge, bool>>>())).ReturnsAsync(new List<IndoorEdge>());

        var result = await _service.NavigateAsync(new NavigateRequest { BuildingId = BuildingId, DestinationNodeId = NodeCId, Beacons = MakeDetectedBeacons() }, "user-1");

        Assert.False(result.IsSuccess);
        Assert.Equal("NO_PATH_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task NavigateAsync_TrilaterationBuilding_SucceedsWithThreeBeacons()
    {
        NavigationUtilities.ResetKalmanFilter();
        var (nodes, edges) = MakeLinearGraph();

        var beacons = MakeBeacons();
        beacons.Add(new Beacon { BeaconId = "bc3", UUID = BeaconUuid, Major = 1, Minor = 3, BuildingId = BuildingId, Floor = 1, X = 5, Y = 10, TxPower = -59 });

        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding(NavigationType.Trilateration));
        _beaconRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Beacon, bool>>>())).ReturnsAsync(beacons);
        _nodeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorNode, bool>>>())).ReturnsAsync(nodes);
        _edgeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<IndoorEdge, bool>>>())).ReturnsAsync(edges);

        var detected = MakeDetectedBeacons();
        detected.Add(new DetectedBeacon { UUID = BeaconUuid, Major = 1, Minor = 3, RSSI = -70 });

        var result = await _service.NavigateAsync(new NavigateRequest { BuildingId = BuildingId, DestinationNodeId = NodeCId, Beacons = detected }, "user-1");

        Assert.True(result.IsSuccess);
        Assert.NotEmpty(result.Data!.Path);
    }
}
