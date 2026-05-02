namespace CampusNavigation.DTOs
{
    public class BeaconDto
    {
        public string BeaconId { get; set; } = string.Empty;
        public string Uuid { get; set; } = string.Empty;
        public int Major { get; set; }
        public int Minor { get; set; }
        public float X { get; set; }
        public float Y { get; set; }
        public int Floor { get; set; }
        public string BuildingId { get; set; } = string.Empty;
    }

    public class BeaconRegistrationDto
    {
        public string Uuid { get; set; } = string.Empty;
        public int Major { get; set; }
        public int Minor { get; set; }
        public float X { get; set; }
        public float Y { get; set; }
        public int Floor { get; set; }
        public string BuildingId { get; set; } = string.Empty;
        public int TxPower { get; set; } = -59;
    }

    public class BeaconUpdateDto
    {
        public float X { get; set; }
        public float Y { get; set; }
        public int Floor { get; set; }
        public string BuildingId { get; set; } = string.Empty;
    }
}
