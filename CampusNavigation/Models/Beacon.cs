using System.ComponentModel.DataAnnotations;

namespace CampusNavigation.Models
{
    public class Beacon
    {
        [Key]
        public string BeaconId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string BuildingId { get; set; } = string.Empty;

        [Required]
        [MaxLength(36)]
        [MinLength(36)]
        public string UUID { get; set; } = string.Empty;

        [Required]
        public int Major { get; set; }

        [Required]
        public int Minor { get; set; }

        [Required]
        public float X { get; set; }

        [Required]
        public float Y { get; set; }

        [Required]
        public int Floor { get; set; }

        [Required]
        public int TxPower { get; set; } = -59;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Building Building { get; set; } = null!;
    }
}
