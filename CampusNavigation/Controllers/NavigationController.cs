using CampusNavigation.DTOs;
using CampusNavigation.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CampusNavigation.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class NavigationController : ControllerBase
{
    private readonly IIndoorNavigationService _navigationService;

    public NavigationController(IIndoorNavigationService navigationService)
    {
        _navigationService = navigationService;
    }

    /// <summary>
    /// Calculates the user's indoor position from detected BLE beacon signals and returns
    /// a step-by-step A* route to the requested destination node.
    /// The user's position is determined via bilateration or trilateration (per building config)
    /// and smoothed with a Kalman filter before being snapped to the nearest graph node.
    /// </summary>
    /// <param name="request">
    /// The building ID, destination node ID, and a list of currently detected BLE beacons
    /// with their UUID, major, minor, and RSSI values.
    /// </param>
    /// <returns>
    /// The estimated user position, the snapped start node, total route distance in feet,
    /// and a list of path segments describing each step of the route.
    /// </returns>
    [HttpPost("route")]
    public async Task<IActionResult> Navigate([FromBody] NavigateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.Claims
            .FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _navigationService.NavigateAsync(request, userId);
        if (!result.IsSuccess) return BadRequest(result);

        return Ok(result.Data);
    }
}
