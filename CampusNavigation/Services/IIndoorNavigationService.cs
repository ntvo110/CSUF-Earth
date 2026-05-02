using CampusNavigation.DTOs;

namespace CampusNavigation.Services
{
    public interface IIndoorNavigationService
    {
        Task<Result<NavigateResponse>> NavigateAsync(NavigateRequest request, string userId);
    }
}
