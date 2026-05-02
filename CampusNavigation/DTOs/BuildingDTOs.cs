using CampusNavigation.Models;

namespace CampusNavigation.DTOs
{
    public class BuildingDto
    {
        public string BuildingId { get; set; } = string.Empty;
        public string BuildingName { get; set; } = string.Empty;
        public double Lat { get; set; }
        public double Long { get; set; }
        public int FloorCount { get; set; }
        public string Algorithm { get; set; } = string.Empty;
        public double GeofenceRadiusFeet { get; set; }
    }

    public class CreateBuildingRequest
    {
        public string BuildingName { get; set; } = string.Empty;
        public double Lat { get; set; }
        public double Long { get; set; }
        public int FloorCount { get; set; }
        public NavigationType Algorithm { get; set; } = NavigationType.Bilateration;
        public double GeofenceRadiusFeet { get; set; } = 164.0;
    }

    public class UpdateBuildingRequest
    {
        public string BuildingName { get; set; } = string.Empty;
        public double Lat { get; set; }
        public double Long { get; set; }
        public int FloorCount { get; set; }
        public NavigationType? Algorithm { get; set; } = NavigationType.Bilateration;
        public double GeofenceRadiusFeet { get; set; } = 164.0;
    }
}
