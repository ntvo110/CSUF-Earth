using System.ComponentModel.DataAnnotations;

namespace CampusNavigation.Models
{
    public class NavigationHistory
    {
        [Key]
        public string HistoryId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string IndoorNodeId { get; set; } = string.Empty;

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;

        public IndoorNode IndoorNode { get; set; } = null!;
    }
}
