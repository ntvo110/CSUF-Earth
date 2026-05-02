using System.ComponentModel.DataAnnotations;

namespace CampusNavigation.Models;

public class Building
{
    [Key]
    public string BuildingId { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(200)]
    public string BuildingName { get; set; } = string.Empty;

    [Required]
    [Range(-90.0, 90.0)]
    public double Lat { get; set; }

    [Required]
    [Range(-180.0, 180.0)]
    public double Long { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int FloorCount { get; set; }

    [Required]
    [Range(0, 1)]
    public NavigationType Algorithm { get; set; } = NavigationType.Bilateration;

    [Required]
    [Range(10.0, 5000.0)]
    public double GeofenceRadiusFeet { get; set; } = 164.0;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Beacon> Beacons { get; set; } = new List<Beacon>();

    public ICollection<IndoorNode> IndoorNodes { get; set; } = new List<IndoorNode>();
}
