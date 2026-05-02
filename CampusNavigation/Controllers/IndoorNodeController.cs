using CampusNavigation.DTOs;
using CampusNavigation.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusNavigation.Controllers
{
    [Route("api/indoorNodes")]
    [ApiController]
    [Authorize]
    public class IndoorNodeController : ControllerBase
    {
        private readonly IIndoorNodeService _nodeService;

        public IndoorNodeController(IIndoorNodeService nodeService)
        {
            _nodeService = nodeService ?? throw new ArgumentNullException(nameof(nodeService));
        }

        /// <summary>
        /// Returns all nodes in a building. Filter by NodeType == "Room" to get a list of
        /// navigable destinations to present to the user.
        /// </summary>
        /// <param name="buildingId">The ID of the building to retrieve nodes for.</param>
        /// <returns>All indoor nodes in the building.</returns>
        [HttpGet("building/{buildingId}")]
        public async Task<ActionResult<Result<IEnumerable<IndoorNodeDto>>>> GetByBuilding(string buildingId)
        {
            var result = await _nodeService.GetNodesByBuilding(buildingId);
            if (result.IsSuccess) return Ok(result);
            if (result.ErrorCode == "BUILDING_NOT_FOUND") return NotFound(result);
            return BadRequest(result);
        }

        /// <summary>
        /// Returns a single indoor node by its ID.
        /// </summary>
        /// <param name="id">The node's unique identifier.</param>
        /// <returns>The matching node, or 404 if not found.</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<Result<IndoorNodeDto>>> GetById(string id)
        {
            var result = await _nodeService.GetNodeById(id);
            if (result.IsSuccess) return Ok(result);
            if (result.ErrorCode == "NODE_NOT_FOUND") return NotFound(result);
            return BadRequest(result);
        }

        /// <summary>
        /// Creates a new indoor node (Admin only). Use to add rooms, hallways, stairs,
        /// and elevator nodes for navigation graph mapping.
        /// </summary>
        /// <param name="request">Node details: BuildingId, Name, Floor, NodeType (Room/Hallway/Stairs/Elevator), X, Y.</param>
        /// <returns>The newly created node.</returns>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Result<IndoorNodeDto>>> Create([FromBody] CreateIndoorNodeRequest request)
        {
            var result = await _nodeService.CreateNode(request);
            if (result.IsSuccess) return CreatedAtAction(nameof(GetById), new { id = result.Data!.IndoorNodeId }, result);
            return BadRequest(result);
        }

        /// <summary>
        /// Updates an existing indoor node's details (Admin only).
        /// </summary>
        /// <param name="id">The ID of the node to update.</param>
        /// <param name="request">Updated Name, Floor, NodeType, X, and Y values.</param>
        /// <returns>The updated node, or 404 if not found.</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Result<IndoorNodeDto>>> Update(string id, [FromBody] UpdateIndoorNodeRequest request)
        {
            var result = await _nodeService.UpdateNode(id, request);
            if (result.IsSuccess) return Ok(result);
            if (result.ErrorCode == "NODE_NOT_FOUND") return NotFound(result);
            return BadRequest(result);
        }

        /// <summary>
        /// Deletes an indoor node and all edges connected to it (Admin only).
        /// </summary>
        /// <param name="id">The ID of the node to delete.</param>
        /// <returns>204 No Content on success, or 404 if not found.</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Result>> Delete(string id)
        {
            var result = await _nodeService.DeleteNode(id);
            if (result.IsSuccess) return NoContent();
            if (result.ErrorCode == "NODE_NOT_FOUND") return NotFound(result);
            return BadRequest(result);
        }
    }
}
