using CampusNavigation.DTOs;
using CampusNavigation.Data;
using CampusNavigation.Models;
using CampusNavigation.Repositories;
using CampusNavigation.Utilities;

namespace CampusNavigation.Services;

public class IndoorNavigationService : IIndoorNavigationService
{
    private readonly ApplicationDbContext      _context;
    private readonly IRepository<Building>     _buildingRepo;
    private readonly IRepository<Beacon>       _beaconRepo;
    private readonly IRepository<IndoorNode>   _nodeRepo;
    private readonly IRepository<IndoorEdge>   _edgeRepo;

    public IndoorNavigationService(
        ApplicationDbContext context,
        IRepository<Building> buildingRepo,
        IRepository<Beacon> beaconRepo,
        IRepository<IndoorNode> nodeRepo,
        IRepository<IndoorEdge> edgeRepo)
    {
        _context      = context;
        _buildingRepo = buildingRepo;
        _beaconRepo   = beaconRepo;
        _nodeRepo     = nodeRepo;
        _edgeRepo     = edgeRepo;
    }

    public async Task<Result<NavigateResponse>> NavigateAsync(NavigateRequest request, string userId)
    {
        var building = await _buildingRepo.GetByIdAsync(request.BuildingId);
        if (building == null)
            return Result<NavigateResponse>.Failure("NOT_FOUND", "Building not found.");

        // 1) Determine user position from BLE signals
        var positionResult = await CalculateUserPositionAsync(request.Beacons, building);
        if (!positionResult.IsSuccess || positionResult.Data == null)
            return Result<NavigateResponse>.Failure(positionResult.ErrorMessage, "Not enough signal to locate user.");

        var (userPos, userFloor) = positionResult.Data.Value;

        // 2) Snap to the nearest graph node on the same floor
        var allNodes   = await _nodeRepo.FindAsync(b => b.BuildingId == building.BuildingId);
        var floorNodes = allNodes.Where(n => n.Floor == userFloor).ToList();

        if (!floorNodes.Any())
            return Result<NavigateResponse>.Failure("NOT_FOUND", "No map nodes found for the user's current floor.");

        var startNode = floorNodes
            .OrderBy(n => Math.Sqrt(Math.Pow(n.X - userPos.X, 2) + Math.Pow(n.Y - userPos.Y, 2)))
            .First();

        var destinationNode = allNodes.FirstOrDefault(n => n.IndoorNodeId == request.DestinationNodeId);
        if (destinationNode == null)
            return Result<NavigateResponse>.Failure("NOT_FOUND", "Destination Node not found");

        // Already at destination
        if (startNode.IndoorNodeId == destinationNode.IndoorNodeId)
        {
            return Result<NavigateResponse>.Success(new NavigateResponse
            {
                CurrentX       = userPos.X,
                CurrentY       = userPos.Y,
                CurrentFloor   = userFloor,
                SnappedNodeId  = startNode.IndoorNodeId,
                SnappedNodeName = startNode.Name,
                TotalDistanceFeet = 0
            });
        }

        // 3) Run A* pathfinding
        var edges        = await _edgeRepo.FindAsync(e => e.BuildingId == building.BuildingId);
        var pathSegments = AStar(startNode, destinationNode, allNodes.ToDictionary(n => n.IndoorNodeId), edges.ToList());

        if (!pathSegments.Any())
            return Result<NavigateResponse>.Failure("NO_PATH_FOUND",
                "No route could be found to the destination. Ensure the map graph is fully connected.");

        return Result<NavigateResponse>.Success(new NavigateResponse
        {
            CurrentX          = userPos.X,
            CurrentY          = userPos.Y,
            CurrentFloor      = userFloor,
            SnappedNodeId     = startNode.IndoorNodeId,
            SnappedNodeName   = startNode.Name,
            Path              = pathSegments,
            TotalDistanceFeet = pathSegments.Sum(p => p.DistanceFeet)
        });
    }

    /// <summary>
    /// Estimates the user's position from detected BLE beacon signals. Converts RSSI readings
    /// to distances, then applies bilateration or trilateration depending on the building's
    /// configured algorithm. The result is smoothed with a Kalman filter.
    /// </summary>
    private async Task<Result<(Position, int)?>> CalculateUserPositionAsync(List<DetectedBeacon> detected, Building building)
    {
        if (!detected.Any())
            return Result<(Position, int)?>.Failure("NOT_FOUND", "No Beacons Detected.");

        var dbBeacons    = await _beaconRepo.FindAsync(b => b.BuildingId == building.BuildingId);
        var validSignals = new List<(Beacon dbBeacon, double distance)>();

        foreach (var d in detected)
        {
            var match = dbBeacons.FirstOrDefault(b => b.UUID == d.UUID && b.Major == d.Major && b.Minor == d.Minor);
            if (match != null)
            {
                var distance = NavigationUtilities.ConvertRSSIToDistance(d.RSSI, match.TxPower);
                validSignals.Add((match, distance));
            }
        }

        if (!validSignals.Any())
            return Result<(Position, int)?>.Failure("NOT_FOUND", "No registered beacons match the detected signals.");

        // Sort by distance — closest (strongest) first
        validSignals = validSignals.OrderBy(s => s.distance).ToList();

        int currentFloor      = validSignals.First().dbBeacon.Floor;
        var sameFloorSignals  = validSignals.Where(s => s.dbBeacon.Floor == currentFloor).ToList();

        Position? finalPos = null;

        if (building.Algorithm == NavigationType.Bilateration && sameFloorSignals.Count >= 2)
        {
            var b1 = new BeaconLocation { X = sameFloorSignals[0].dbBeacon.X, Y = sameFloorSignals[0].dbBeacon.Y };
            var b2 = new BeaconLocation { X = sameFloorSignals[1].dbBeacon.X, Y = sameFloorSignals[1].dbBeacon.Y };
            finalPos = NavigationUtilities.BilaterateWithSmoothing(b1, sameFloorSignals[0].distance, b2, sameFloorSignals[1].distance);
        }
        else if (sameFloorSignals.Count >= 3)
        {
            var locations = sameFloorSignals.Take(3).Select(s => new BeaconLocation { X = s.dbBeacon.X, Y = s.dbBeacon.Y });
            var distances = sameFloorSignals.Take(3).Select(s => s.distance);
            finalPos = NavigationUtilities.TrilaterateWithSmoothing(locations, distances);
        }

        // Fallback: snap to nearest beacon if not enough signals
        if (finalPos == null)
            finalPos = new Position { X = sameFloorSignals[0].dbBeacon.X, Y = sameFloorSignals[0].dbBeacon.Y };

        return Result<(Position, int)?>.Success((finalPos, currentFloor));
    }

    /// <summary>
    /// A* pathfinding. Edges are treated as bidirectional.
    /// </summary>
    private List<PathSegment> AStar(IndoorNode start, IndoorNode goal,
        Dictionary<string, IndoorNode> nodes, List<IndoorEdge> allEdges)
    {
        var adjacency = new Dictionary<string, List<IndoorEdge>>();
        foreach (var node in nodes.Keys) adjacency[node] = new List<IndoorEdge>();

        foreach (var edge in allEdges)
        {
            if (!adjacency.ContainsKey(edge.StartNodeId) || !adjacency.ContainsKey(edge.EndNodeId)) continue;
            adjacency[edge.StartNodeId].Add(edge);
            adjacency[edge.EndNodeId].Add(new IndoorEdge
            {
                StartNodeId = edge.EndNodeId,
                EndNodeId   = edge.StartNodeId,
                Distance    = edge.Distance
            });
        }

        var openSet  = new PriorityQueue<string, double>();
        var cameFrom = new Dictionary<string, IndoorEdge>();
        var gScore   = nodes.Keys.ToDictionary(k => k, _ => double.PositiveInfinity);

        gScore[start.IndoorNodeId] = 0;
        openSet.Enqueue(start.IndoorNodeId, Heuristic(start, goal));

        while (openSet.Count > 0)
        {
            var currentId = openSet.Dequeue();
            if (currentId == goal.IndoorNodeId)
                return ReconstructPath(cameFrom, currentId, nodes);

            foreach (var edge in adjacency[currentId])
            {
                var neighborId        = edge.EndNodeId;
                double tentativeScore = gScore[currentId] + edge.Distance;

                if (tentativeScore < gScore[neighborId])
                {
                    cameFrom[neighborId] = edge;
                    gScore[neighborId]   = tentativeScore;
                    openSet.Enqueue(neighborId, tentativeScore + Heuristic(nodes[neighborId], goal));
                }
            }
        }

        return new List<PathSegment>(); // No path found
    }

    private static double Heuristic(IndoorNode a, IndoorNode b)
    {
        double dx = a.X - b.X;
        double dy = a.Y - b.Y;
        // Add a large penalty for floor changes so A* prefers staying on the same floor
        double floorPenalty = Math.Abs(a.Floor - b.Floor) * 1000.0;
        return Math.Sqrt(dx * dx + dy * dy) + floorPenalty;
    }

    private static List<PathSegment> ReconstructPath(
        Dictionary<string, IndoorEdge> cameFrom, string currentId, Dictionary<string, IndoorNode> nodes)
    {
        var path = new List<PathSegment>();
        while (cameFrom.ContainsKey(currentId))
        {
            var edge      = cameFrom[currentId];
            var startNode = nodes[edge.StartNodeId];
            var endNode   = nodes[edge.EndNodeId];

            string action = startNode.Floor == endNode.Floor
                ? "Walk"
                : (endNode.NodeType == "Stairs" ? "Take Stairs" : "Take Elevator");

            path.Insert(0, new PathSegment
            {
                StartNodeId  = startNode.IndoorNodeId,
                EndNodeId    = endNode.IndoorNodeId,
                StartName    = startNode.Name,
                EndName      = endNode.Name,
                Action       = action,
                DistanceFeet = edge.Distance
            });
            currentId = edge.StartNodeId;
        }
        return path;
    }
}
