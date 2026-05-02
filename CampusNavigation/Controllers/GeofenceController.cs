using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusNavigation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GeofenceController : ControllerBase
    {
        private readonly IRepository<Building> _buildingRepository;

        public GeofenceController(IRepository<Building> buildingRepository)
        {
            _buildingRepository = buildingRepository ?? throw new ArgumentNullException(nameof(buildingRepository));
        }

        /// <summary>
        /// Checks whether the user's current GPS coordinates are within a building's geofence.
        /// When <c>IsInsideGeofence</c> is true, the mobile app should switch from outdoor
        /// GPS navigation to indoor BLE-based navigation mode.
        /// </summary>
        /// <param name="request">The user's current latitude/longitude and the target building ID.</param>
        /// <returns>Geofence status including distance to building and whether the user is inside the radius.</returns>
        [HttpPost("check")]
        public async Task<ActionResult<Result<GeofenceCheckResponse>>> CheckGeofence([FromBody] GeofenceCheckRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.BuildingId))
                return BadRequest(Result<GeofenceCheckResponse>.Failure("MISSING_REQUIRED_FIELD", "BuildingId is required"));

            var building = await _buildingRepository.GetByIdAsync(request.BuildingId);
            if (building == null)
                return NotFound(Result<GeofenceCheckResponse>.Failure("BUILDING_NOT_FOUND", $"No building found with ID {request.BuildingId}."));

            double distanceFeet = CalculateDistanceFeet(
                request.CurrentLatitude, request.CurrentLongitude,
                building.Lat, building.Long);

            var response = new GeofenceCheckResponse
            {
                BuildingId        = building.BuildingId,
                DistanceFeet      = Math.Round(distanceFeet, 1),
                GeofenceRadiusFeet = building.GeofenceRadiusFeet,
                IsInsideGeofence  = distanceFeet <= building.GeofenceRadiusFeet
            };

            return Ok(Result<GeofenceCheckResponse>.Success(response));
        }

        private static double CalculateDistanceFeet(double lat1, double lon1, double lat2, double lon2)
        {
            const double FeetPerDegreeLatitude = 364000.0;
            double avgLatRad = (lat1 + lat2) / 2.0 * Math.PI / 180.0;
            double feetPerDegreeLongitude = 364000.0 * Math.Cos(avgLatRad);

            double dx = (lon2 - lon1) * feetPerDegreeLongitude;
            double dy = (lat2 - lat1) * FeetPerDegreeLatitude;

            return Math.Sqrt(dx * dx + dy * dy);
        }
    }
}
