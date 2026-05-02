using CampusNavigation.Models;

namespace CampusNavigation.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
    }
}
