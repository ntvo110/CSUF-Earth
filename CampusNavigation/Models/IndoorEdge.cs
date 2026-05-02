using System.ComponentModel.DataAnnotations;

namespace CampusNavigation.Models
{
    public class IndoorEdge
    {
        [Key]
        public string EdgeId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string BuildingId { get; set; } = string.Empty;

        [Required]
        public string StartNodeId { get; set; } = string.Empty;

        [Required]
        public string EndNodeId { get; set; } = string.Empty;

        [Required]
        public float Distance { get; set; }

        public Building Building { get; set; } = null!;

        public IndoorNode StartNode { get; set; } = null!;

        public IndoorNode EndNode { get; set; } = null!;
    }
}
