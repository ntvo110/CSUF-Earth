using CampusNavigation.DTOs;
using CampusNavigation.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusNavigation.Controllers
{
    [Route("api/beacons")]
    [ApiController]
    [Authorize]
    public class BeaconController : ControllerBase
    {
        private readonly IBeaconService _beaconService;

        public BeaconController(IBeaconService beaconService)
        {
            _beaconService = beaconService ?? throw new ArgumentNullException(nameof(beaconService));
        }

        /// <summary>
        /// Returns all beacons registered to a building.
        /// </summary>
        /// <param name="buildingId">The ID of the building to retrieve beacons for.</param>
        /// <returns>List of beacons with their UUID, major/minor values, and floor coordinates.</returns>
        [HttpGet]
        public async Task<ActionResult<Result<IEnumerable<BeaconDto>>>> GetByBuilding([FromQuery] string buildingId)
        {
            var result = await _beaconService.GetBeaconsByBuilding(buildingId);
            if (result.IsSuccess) return Ok(result);
            return BadRequest(result);
        }

        /// <summary>
        /// Registers a new BLE beacon to a building (Admin only).
        /// The UUID must follow the iBeacon format (8-4-4-4-12 hex characters).
        /// The UUID/Major/Minor combination must be unique across the system.
        /// </summary>
        /// <param name="beacon">Beacon details including UUID, major, minor, floor, X/Y coordinates, and building ID.</param>
        /// <returns>The ID of the newly registered beacon.</returns>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Result<string>>> Register([FromBody] BeaconRegistrationDto beacon)
        {
            var result = await _beaconService.RegisterBeacon(beacon);
            if (result.IsSuccess) return StatusCode(201, result);
            if (result.ErrorCode == "BUILDING_NOT_FOUND") return NotFound(result);
            if (result.ErrorCode == "DUPLICATE_BEACON") return UnprocessableEntity(result);
            return BadRequest(result);
        }

        /// <summary>
        /// Updates a beacon's physical position or building assignment (Admin only).
        /// Use this when a beacon is physically moved to a new location.
        /// </summary>
        /// <param name="id">The ID of the beacon to update.</param>
        /// <param name="update">Updated floor, X/Y coordinates, and building ID.</param>
        /// <returns>200 OK on success, or 404 if the beacon or building is not found.</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Result>> Update(string id, [FromBody] BeaconUpdateDto update)
        {
            var result = await _beaconService.UpdateBeacon(id, update);
            if (result.IsSuccess) return Ok(result);
            if (result.ErrorCode is "BEACON_NOT_FOUND" or "BUILDING_NOT_FOUND") return NotFound(result);
            return BadRequest(result);
        }

        /// <summary>
        /// Deletes a beacon from the system (Admin only).
        /// </summary>
        /// <param name="id">The ID of the beacon to delete.</param>
        /// <returns>204 No Content on success, or 404 if not found.</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Result>> Delete(string id)
        {
            var result = await _beaconService.DeleteBeacon(id);
            if (result.IsSuccess) return NoContent();
            if (result.ErrorCode == "BEACON_NOT_FOUND") return NotFound(result);
            return BadRequest(result);
        }
    }
}
