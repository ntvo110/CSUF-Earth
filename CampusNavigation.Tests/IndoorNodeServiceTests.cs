using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;
using CampusNavigation.Services;
using Moq;

namespace CampusNavigation.Tests;

public class IndoorNodeServiceTests
{
    private readonly Mock<IIndoorNodeRepository>  _nodeRepoMock;
    private readonly Mock<IRepository<Building>>  _buildingRepoMock;
    private readonly IndoorNodeService            _service;

    private const string BuildingId = "building-1";
    private const string NodeId     = "node-1";

    private static Building MakeBuilding(int floors = 5) =>
        new() { BuildingId = BuildingId, BuildingName = "Test Hall", FloorCount = floors };

    private static IndoorNode MakeNode(string id = NodeId) =>
        new() { IndoorNodeId = id, BuildingId = BuildingId, Name = "Room 101", Floor = 1, NodeType = "Room", X = 10, Y = 20 };

    public IndoorNodeServiceTests()
    {
        _nodeRepoMock     = new Mock<IIndoorNodeRepository>();
        _buildingRepoMock = new Mock<IRepository<Building>>();
        _service          = new IndoorNodeService(_nodeRepoMock.Object, _buildingRepoMock.Object);
    }

    // ── GetNodesByBuilding ───────────────────────────────────────────────────

    [Fact]
    public async Task GetNodesByBuilding_ValidBuilding_ReturnsNodes()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding());
        _nodeRepoMock.Setup(r => r.GetByBuildingAsync(BuildingId)).ReturnsAsync(new List<IndoorNode> { MakeNode() });

        var result = await _service.GetNodesByBuilding(BuildingId);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Data!);
    }

    [Fact]
    public async Task GetNodesByBuilding_EmptyBuildingId_ReturnsInvalidInput()
    {
        var result = await _service.GetNodesByBuilding("  ");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_INPUT", result.ErrorCode);
    }

    [Fact]
    public async Task GetNodesByBuilding_BuildingNotFound_ReturnsFailure()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Building?)null);

        var result = await _service.GetNodesByBuilding("missing");

        Assert.False(result.IsSuccess);
        Assert.Equal("BUILDING_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task GetNodesByBuilding_RepositoryThrows_ReturnsFailure()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding());
        _nodeRepoMock.Setup(r => r.GetByBuildingAsync(BuildingId)).ThrowsAsync(new Exception("DB error"));

        var result = await _service.GetNodesByBuilding(BuildingId);

        Assert.False(result.IsSuccess);
        Assert.Equal("DATABASE_ERROR", result.ErrorCode);
    }

    // ── GetNodeById ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetNodeById_ExistingNode_ReturnsNode()
    {
        _nodeRepoMock.Setup(r => r.GetByIdAsync(NodeId)).ReturnsAsync(MakeNode());

        var result = await _service.GetNodeById(NodeId);

        Assert.True(result.IsSuccess);
        Assert.Equal(NodeId, result.Data!.IndoorNodeId);
    }

    [Fact]
    public async Task GetNodeById_NotFound_ReturnsFailure()
    {
        _nodeRepoMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((IndoorNode?)null);

        var result = await _service.GetNodeById("missing");

        Assert.False(result.IsSuccess);
        Assert.Equal("NODE_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task GetNodeById_EmptyId_ReturnsInvalidInput()
    {
        var result = await _service.GetNodeById("");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_INPUT", result.ErrorCode);
    }

    // ── CreateNode ───────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateNode_ValidRequest_ReturnsCreatedNode()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding(5));
        _nodeRepoMock.Setup(r => r.AddAsync(It.IsAny<IndoorNode>())).ReturnsAsync((IndoorNode n) => n);
        _nodeRepoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.CreateNode(new CreateIndoorNodeRequest { BuildingId = BuildingId, Name = "Room 202", Floor = 2, NodeType = "Room", X = 15, Y = 25 });

        Assert.True(result.IsSuccess);
        Assert.Equal("Room 202", result.Data!.Name);
    }

    [Fact]
    public async Task CreateNode_MissingBuildingId_ReturnsFailure()
    {
        var result = await _service.CreateNode(new CreateIndoorNodeRequest { BuildingId = "", Name = "Room", Floor = 1 });

        Assert.False(result.IsSuccess);
        Assert.Equal("MISSING_REQUIRED_FIELD", result.ErrorCode);
    }

    [Fact]
    public async Task CreateNode_MissingName_ReturnsFailure()
    {
        var result = await _service.CreateNode(new CreateIndoorNodeRequest { BuildingId = BuildingId, Name = "", Floor = 1 });

        Assert.False(result.IsSuccess);
        Assert.Equal("MISSING_REQUIRED_FIELD", result.ErrorCode);
    }

    [Fact]
    public async Task CreateNode_BuildingNotFound_ReturnsFailure()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync((Building?)null);

        var result = await _service.CreateNode(new CreateIndoorNodeRequest { BuildingId = BuildingId, Name = "Room", Floor = 1 });

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_BUILDING_ASSOCIATION", result.ErrorCode);
    }

    [Fact]
    public async Task CreateNode_FloorExceedsBuilding_ReturnsFailure()
    {
        _buildingRepoMock.Setup(r => r.GetByIdAsync(BuildingId)).ReturnsAsync(MakeBuilding(3));

        var result = await _service.CreateNode(new CreateIndoorNodeRequest { BuildingId = BuildingId, Name = "Room", Floor = 10 });

        Assert.False(result.IsSuccess);
        Assert.Equal("VALUE_OUT_OF_RANGE", result.ErrorCode);
    }

    // ── UpdateNode ───────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateNode_ExistingNode_UpdatesAndReturnsDto()
    {
        var node = MakeNode();
        _nodeRepoMock.Setup(r => r.GetByIdAsync(NodeId)).ReturnsAsync(node);
        _nodeRepoMock.Setup(r => r.UpdateAsync(node)).Returns(Task.CompletedTask);
        _nodeRepoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.UpdateNode(NodeId, new UpdateIndoorNodeRequest { Name = "Updated Room", Floor = 3, NodeType = "Room", X = 50, Y = 60 });

        Assert.True(result.IsSuccess);
        Assert.Equal("Updated Room", result.Data!.Name);
    }

    [Fact]
    public async Task UpdateNode_NotFound_ReturnsFailure()
    {
        _nodeRepoMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((IndoorNode?)null);

        var result = await _service.UpdateNode("missing", new UpdateIndoorNodeRequest { Name = "X", Floor = 1 });

        Assert.False(result.IsSuccess);
        Assert.Equal("NODE_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task UpdateNode_EmptyId_ReturnsInvalidInput()
    {
        var result = await _service.UpdateNode("", new UpdateIndoorNodeRequest { Name = "X", Floor = 1 });

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_INPUT", result.ErrorCode);
    }

    // ── DeleteNode ───────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteNode_ExistingNode_ReturnsSuccess()
    {
        var node = MakeNode();
        _nodeRepoMock.Setup(r => r.GetByIdAsync(NodeId)).ReturnsAsync(node);
        _nodeRepoMock.Setup(r => r.DeleteAsync(node)).Returns(Task.CompletedTask);
        _nodeRepoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.DeleteNode(NodeId);

        Assert.True(result.IsSuccess);
        _nodeRepoMock.Verify(r => r.DeleteAsync(node), Times.Once);
    }

    [Fact]
    public async Task DeleteNode_NotFound_ReturnsFailure()
    {
        _nodeRepoMock.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((IndoorNode?)null);

        var result = await _service.DeleteNode("missing");

        Assert.False(result.IsSuccess);
        Assert.Equal("NODE_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task DeleteNode_EmptyId_ReturnsInvalidInput()
    {
        var result = await _service.DeleteNode("  ");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_INPUT", result.ErrorCode);
    }
}
