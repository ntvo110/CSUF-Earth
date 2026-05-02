using CampusNavigation.DTOs;
using CampusNavigation.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusNavigation.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BuildingController : ControllerBase
{
    private readonly IBuildingService _buildingService;

    public BuildingController(IBuildingService buildingService)
    {
        _buildingService = buildingService;
    }

    /// <summary>
    /// Returns all buildings registered in the system.
    /// </summary>
    /// <returns>List of all buildings.</returns>
    [HttpGet]
    public async Task<ActionResult<Result<IEnumerable<BuildingDto>>>> GetAll()
    {
        var result = await _buildingService.GetAllBuildings();
        return result.IsSuccess ? Ok(result) : StatusCode(500, result);
    }

    /// <summary>
    /// Returns a single building by its ID.
    /// </summary>
    /// <param name="id">The building's unique identifier.</param>
    /// <returns>The matching building, or 404 if not found.</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<Result<BuildingDto>>> GetById(string id)
    {
        var result = await _buildingService.GetBuildingById(id);
        if (result.IsSuccess) return Ok(result);
        if (result.ErrorCode == "BUILDING_NOT_FOUND") return NotFound(result);
        return BadRequest(result);
    }

    /// <summary>
    /// Creates a new building (Admin only).
    /// </summary>
    /// <param name="request">Building details including name, coordinates, floor count, geofence radius, and positioning algorithm.</param>
    /// <returns>The newly created building.</returns>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<BuildingDto>>> Create([FromBody] CreateBuildingRequest request)
    {
        var result = await _buildingService.CreateBuilding(request);
        if (result.IsSuccess)
            return CreatedAtAction(nameof(GetById), new { id = result.Data!.BuildingId }, result);
        return BadRequest(result);
    }

    /// <summary>
    /// Updates an existing building's details (Admin only).
    /// </summary>
    /// <param name="id">The ID of the building to update.</param>
    /// <param name="request">Updated building details.</param>
    /// <returns>The updated building, or 404 if not found.</returns>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<BuildingDto>>> Update(string id, [FromBody] UpdateBuildingRequest request)
    {
        var result = await _buildingService.UpdateBuilding(id, request);
        if (result.IsSuccess) return Ok(result);
        if (result.ErrorCode == "BUILDING_NOT_FOUND") return NotFound(result);
        return BadRequest(result);
    }

    /// <summary>
    /// Deletes a building and all associated nodes, edges, and beacons (Admin only).
    /// </summary>
    /// <param name="id">The ID of the building to delete.</param>
    /// <returns>204 No Content on success, or 404 if not found.</returns>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result>> Delete(string id)
    {
        var result = await _buildingService.DeleteBuilding(id);
        if (result.IsSuccess) return NoContent();
        if (result.ErrorCode == "BUILDING_NOT_FOUND") return NotFound(result);
        return BadRequest(result);
    }
}
