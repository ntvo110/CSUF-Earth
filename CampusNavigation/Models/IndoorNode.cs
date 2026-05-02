using System.ComponentModel.DataAnnotations;

namespace CampusNavigation.Models
{
    public class IndoorNode
    {
        [Key]
        public string IndoorNodeId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string BuildingId { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public int Floor { get; set; }

        [Required]
        public float X { get; set; }

        [Required]
        public float Y { get; set; }

        [Required]
        [MaxLength(50)]
        public string NodeType { get; set; } = "Hallway"; // Room, Stairs, Elevator, Hallway

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

        public Building? Building { get; set; }

        public ICollection<NavigationHistory> NavigationHistories { get; set; } = new List<NavigationHistory>();
    }
}
