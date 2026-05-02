namespace CampusNavigation.DTOs;

public class DetectedBeacon
{
    public string UUID { get; set; } = string.Empty;
    public int Major { get; set; }
    public int Minor { get; set; }

    // RSSI reading from the phone
    public int RSSI { get; set; }
}

public class NavigateRequest
{
    public string BuildingId { get; set; } = string.Empty;
    public string DestinationNodeId { get; set; } = string.Empty;

    // List of beacons the phone currently detects
    public List<DetectedBeacon> Beacons { get; set; } = new();
}

public class PathSegment
{
    public string StartNodeId { get; set; } = string.Empty;
    public string EndNodeId { get; set; } = string.Empty;
    public string StartName { get; set; } = string.Empty;
    public string EndName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // "Walk", "Take Stairs", "Take Elevator"
    public double DistanceFeet { get; set; }
}

public class NavigateResponse
{
    // Calculated user position
    public double CurrentX { get; set; }
    public double CurrentY { get; set; }
    public int CurrentFloor { get; set; }

    // Node the user is snapped to
    public string SnappedNodeId { get; set; } = string.Empty;
    public string SnappedNodeName { get; set; } = string.Empty;

    public double TotalDistanceFeet { get; set; }

    // Step-by-step path to destination
    public List<PathSegment> Path { get; set; } = new();
}
