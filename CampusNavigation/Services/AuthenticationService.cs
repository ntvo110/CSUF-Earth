using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;
using Microsoft.IdentityModel.Tokens;

namespace CampusNavigation.Services
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration  _configuration;

        public AuthenticationService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration  = configuration;
        }

        public async Task<Result<LoginResponse>> LoginAsync(LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return Result<LoginResponse>.Failure("MISSING_REQUIRED_FIELD", "Email and password are required");

            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Result<LoginResponse>.Failure("INVALID_CREDENTIALS", "Invalid Email or Password");

            var token = GenerateJwtToken(user);
            return Result<LoginResponse>.Success(new LoginResponse
            {
                Token     = token,
                UserId    = user.UserId,
                Name      = user.Name,
                Role      = user.Role,
                ExpiresAt = DateTime.UtcNow.AddHours(60)
            });
        }

        public async Task<Result<LoginResponse>> RegisterAsync(RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return Result<LoginResponse>.Failure("MISSING_REQUIRED_FIELD", "Email and password are required.");

            var exists = await _userRepository.ExistsAsync(u => u.Email == request.Email.ToLowerInvariant());
            if (exists)
                return Result<LoginResponse>.Failure("EMAIL_ALREADY_EXISTS", "An account with this email already exists.");

            var user = new User
            {
                UserId       = Guid.NewGuid().ToString(),
                Email        = request.Email.ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
                Name         = request.Name,
                Role         = "User"
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return Result<LoginResponse>.Success(new LoginResponse
            {
                Token     = token,
                UserId    = user.UserId,
                Name      = user.Name,
                Role      = user.Role,
                ExpiresAt = DateTime.UtcNow.AddHours(60)
            });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey   = jwtSettings["SecretKey"]!;
            var key         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("name", user.Name)
            };

            var token = new JwtSecurityToken(
                issuer:            jwtSettings["Issuer"],
                audience:          jwtSettings["Audience"],
                claims:            claims,
                expires:           DateTime.UtcNow.AddHours(60),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
