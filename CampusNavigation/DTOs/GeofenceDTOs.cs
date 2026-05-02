namespace CampusNavigation.DTOs
{
    public class GeofenceCheckRequest
    {
        public double CurrentLatitude { get; set; }
        public double CurrentLongitude { get; set; }
        public string BuildingId { get; set; } = string.Empty;
    }

    public class GeofenceCheckResponse
    {
        /// <summary>
        /// When true, the app should swap from Google Maps navigation to BLE indoor navigation mode.
        /// </summary>
        public bool IsInsideGeofence { get; set; }
        public double DistanceFeet { get; set; }
        public double GeofenceRadiusFeet { get; set; }
        public string BuildingId { get; set; } = string.Empty;
    }
}
