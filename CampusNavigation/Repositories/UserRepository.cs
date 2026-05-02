using CampusNavigation.Data;
using CampusNavigation.Models;
using Microsoft.EntityFrameworkCore;

namespace CampusNavigation.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(ApplicationDbContext context) : base(context) { }

        public async Task<User?> GetByEmailAsync(string email) =>
            await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());
    }
}
