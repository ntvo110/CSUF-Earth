using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusNavigation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IndoorEdgeController : ControllerBase
{
    private readonly IRepository<IndoorEdge> _edgeRepository;

    public IndoorEdgeController(IRepository<IndoorEdge> edgeRepository)
    {
        _edgeRepository = edgeRepository ?? throw new ArgumentNullException(nameof(edgeRepository));
    }

    /// <summary>
    /// Returns all edges (walkable connections) for a given building.
    /// Used by the navigation engine to build the graph for A* pathfinding.
    /// </summary>
    /// <param name="buildingId">The ID of the building to retrieve edges for.</param>
    /// <returns>List of edges with their start/end node IDs and distances.</returns>
    [HttpGet("building/{buildingId}")]
    public async Task<ActionResult<Result<IEnumerable<IndoorEdgeDto>>>> GetEdgesForBuilding(string buildingId)
    {
        var edges = await _edgeRepository.FindAsync(e => e.BuildingId == buildingId);
        var response = edges.Select(e => new IndoorEdgeDto
        {
            EdgeId      = e.EdgeId,
            BuildingId  = e.BuildingId,
            StartNodeId = e.StartNodeId,
            EndNodeId   = e.EndNodeId,
            Distance    = e.Distance
        });
        return Ok(Result<IEnumerable<IndoorEdgeDto>>.Success(response));
    }

    /// <summary>
    /// Returns a single edge by its ID.
    /// </summary>
    /// <param name="id">The edge's unique identifier.</param>
    /// <returns>The matching edge, or 404 if not found.</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Result<IndoorEdgeDto>>> GetById(string id)
    {
        var edge = await _edgeRepository.GetByIdAsync(id);
        if (edge == null)
            return NotFound(Result<IndoorEdgeDto>.Failure("EDGE_NOT_FOUND", $"Edge with ID {id} not found."));

        return Ok(Result<IndoorEdgeDto>.Success(new IndoorEdgeDto
        {
            EdgeId      = edge.EdgeId,
            BuildingId  = edge.BuildingId,
            StartNodeId = edge.StartNodeId,
            EndNodeId   = edge.EndNodeId,
            Distance    = edge.Distance
        }));
    }

    /// <summary>
    /// Creates a directed edge between two indoor nodes (Admin only).
    /// Edges are treated as bidirectional by the navigation engine, so you only need
    /// one edge per corridor or connection.
    /// </summary>
    /// <param name="request">Edge details: building ID, start/end node IDs, and distance in feet.</param>
    /// <returns>The newly created edge.</returns>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<IndoorEdgeDto>>> CreateEdge([FromBody] CreateIndoorEdgeRequest request)
    {
        var edge = new IndoorEdge
        {
            BuildingId  = request.BuildingId,
            StartNodeId = request.StartNodeId,
            EndNodeId   = request.EndNodeId,
            Distance    = request.Distance
        };

        var saved = await _edgeRepository.AddAsync(edge);
        await _edgeRepository.SaveChangesAsync();

        var dto = new IndoorEdgeDto
        {
            EdgeId      = saved.EdgeId,
            BuildingId  = saved.BuildingId,
            StartNodeId = saved.StartNodeId,
            EndNodeId   = saved.EndNodeId,
            Distance    = saved.Distance
        };

        return CreatedAtAction(nameof(GetById), new { id = saved.EdgeId }, Result<IndoorEdgeDto>.Success(dto));
    }

    /// <summary>
    /// Deletes an edge between two indoor nodes (Admin only).
    /// </summary>
    /// <param name="id">The ID of the edge to delete.</param>
    /// <returns>204 No Content on success, or 404 if not found.</returns>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var edge = await _edgeRepository.GetByIdAsync(id);
        if (edge == null)
            return NotFound(Result<IndoorEdgeDto>.Failure("EDGE_NOT_FOUND", $"Edge with ID {id} not found."));

        await _edgeRepository.DeleteAsync(edge);
        await _edgeRepository.SaveChangesAsync();

        return NoContent();
    }
}
