using CampusNavigation.DTOs;

namespace CampusNavigation.Services
{
    public interface IAuthenticationService
    {
        Task<Result<LoginResponse>> LoginAsync(LoginRequest request);
        Task<Result<LoginResponse>> RegisterAsync(RegisterRequest request);
    }
}
