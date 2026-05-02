namespace CampusNavigation.DTOs
{
    public class IndoorNodeDto
    {
        public string IndoorNodeId { get; set; } = string.Empty;
        public string BuildingId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Floor { get; set; }
        public string NodeType { get; set; } = "Hallway";
        public float X { get; set; }
        public float Y { get; set; }
    }

    public class CreateIndoorNodeRequest
    {
        public string BuildingId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Floor { get; set; }
        public string NodeType { get; set; } = "Hallway";
        public float X { get; set; }
        public float Y { get; set; }
    }

    public class UpdateIndoorNodeRequest
    {
        public string Name { get; set; } = string.Empty;
        public int Floor { get; set; }
        public string NodeType { get; set; } = "Hallway";
        public float X { get; set; }
        public float Y { get; set; }
    }

    public class IndoorEdgeDto
    {
        public string EdgeId { get; set; } = string.Empty;
        public string BuildingId { get; set; } = string.Empty;
        public string StartNodeId { get; set; } = string.Empty;
        public string EndNodeId { get; set; } = string.Empty;
        public float Distance { get; set; }
    }

    public class CreateIndoorEdgeRequest
    {
        public string BuildingId { get; set; } = string.Empty;
        public string StartNodeId { get; set; } = string.Empty;
        public string EndNodeId { get; set; } = string.Empty;
        public float Distance { get; set; }
    }
}
