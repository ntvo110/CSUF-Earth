using CampusNavigation.DTOs;
using CampusNavigation.Services;
using Microsoft.AspNetCore.Mvc;

namespace CampusNavigation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthenticationService _authService;

        public AuthController(IAuthenticationService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Authenticates a user with email and password.
        /// </summary>
        /// <param name="request">Email and password credentials.</param>
        /// <returns>A JWT token, user ID, name, role, and token expiry time.</returns>
        [HttpPost("login")]
        public async Task<ActionResult<Result<LoginResponse>>> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);
            if (result.IsSuccess) return Ok(result);
            if (result.ErrorCode == "INVALID_CREDENTIALS") return Unauthorized(result);
            return BadRequest(result);
        }

        /// <summary>
        /// Registers a new user account.
        /// </summary>
        /// <param name="request">Email, password, and display name.</param>
        /// <returns>A JWT token for the newly created account.</returns>
        [HttpPost("register")]
        public async Task<ActionResult<Result<LoginResponse>>> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);
            if (result.IsSuccess) return CreatedAtAction(nameof(Login), result);
            if (result.ErrorCode == "EMAIL_ALREADY_EXISTS") return Conflict(result);
            return BadRequest(result);
        }
    }
}
