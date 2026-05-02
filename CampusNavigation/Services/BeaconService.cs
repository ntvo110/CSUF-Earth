using System.Text.RegularExpressions;
using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;

namespace CampusNavigation.Services;

public class BeaconService : IBeaconService
{
    private readonly IBeaconRepository       _beaconRepository;
    private readonly IRepository<Building>   _buildingRepository;

    // iBeacon UUID format: 8-4-4-4-12 hex chars
    private static readonly Regex UuidRegex = new(
        @"^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$",
        RegexOptions.Compiled);

    public BeaconService(IBeaconRepository beaconRepository, IRepository<Building> buildingRepository)
    {
        _beaconRepository  = beaconRepository  ?? throw new ArgumentNullException(nameof(beaconRepository));
        _buildingRepository = buildingRepository ?? throw new ArgumentNullException(nameof(buildingRepository));
    }

    public async Task<Result<IEnumerable<BeaconDto>>> GetBeaconsByBuilding(string buildingId)
    {
        if (string.IsNullOrWhiteSpace(buildingId))
            return Result<IEnumerable<BeaconDto>>.Failure("INVALID_INPUT", "Building ID cannot be empty");

        try
        {
            var beacons = await _beaconRepository.GetByBuildingAsync(buildingId);
            var dtos = beacons.Select(b => new BeaconDto
            {
                BeaconId   = b.BeaconId,
                Uuid       = b.UUID,
                Major      = b.Major,
                Minor      = b.Minor,
                X          = b.X,
                Y          = b.Y,
                Floor      = b.Floor,
                BuildingId = b.BuildingId
            });
            return Result<IEnumerable<BeaconDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<BeaconDto>>.Failure("DATABASE_ERROR", $"Failed to retrieve beacons: {ex.Message}");
        }
    }

    public async Task<Result<string>> RegisterBeacon(BeaconRegistrationDto beacon)
    {
        if (string.IsNullOrWhiteSpace(beacon.Uuid))
            return Result<string>.Failure("MISSING_REQUIRED_FIELD", "Beacon UUID is required.");
        if (!UuidRegex.IsMatch(beacon.Uuid))
            return Result<string>.Failure("INVALID_UUID_FORMAT", "UUID must be in the iBeacon format of 8-4-4-4-12 hex chars.");
        if (beacon.Major < 0 || beacon.Major > 65535)
            return Result<string>.Failure("VALUE_OUT_OF_RANGE", "Major value must be between 0 and 65535.");
        if (beacon.Minor < 0 || beacon.Minor > 65535)
            return Result<string>.Failure("VALUE_OUT_OF_RANGE", "Minor must be between 0 and 65535.");
        if (string.IsNullOrWhiteSpace(beacon.BuildingId))
            return Result<string>.Failure("MISSING_REQUIRED_FIELD", "Building ID is required");

        try
        {
            var building = await _buildingRepository.GetByIdAsync(beacon.BuildingId);
            if (building == null)
                return Result<string>.Failure("BUILDING_NOT_FOUND", $"Building {beacon.BuildingId} not found.");

            var existing = await _beaconRepository.GetByIdentifiersAsync(beacon.Uuid.ToUpperInvariant(), beacon.Major, beacon.Minor);
            if (existing != null)
                return Result<string>.Failure("DUPLICATE_BEACON",
                    $"A beacon with UUID {existing.UUID}, Major {existing.Major}, Minor {existing.Minor} already exists.");

            var newBeacon = new Beacon
            {
                BeaconId   = Guid.NewGuid().ToString(),
                UUID       = beacon.Uuid.ToUpperInvariant(),
                Major      = beacon.Major,
                Minor      = beacon.Minor,
                X          = beacon.X,
                Y          = beacon.Y,
                Floor      = beacon.Floor,
                BuildingId = beacon.BuildingId,
                TxPower    = beacon.TxPower,
                CreatedAt  = DateTime.UtcNow,
                UpdatedAt  = DateTime.UtcNow
            };

            await _beaconRepository.AddAsync(newBeacon);
            await _beaconRepository.SaveChangesAsync();

            return Result<string>.Success(newBeacon.BeaconId);
        }
        catch (Exception ex)
        {
            return Result<string>.Failure("DATABASE_ERROR", $"Failed to register beacon: {ex.Message}");
        }
    }

    public async Task<Result> UpdateBeacon(string beaconId, BeaconUpdateDto update)
    {
        if (string.IsNullOrWhiteSpace(beaconId))
            return Result.Failure("INVALID_INPUT", "Beacon ID cannot be empty.");

        try
        {
            var beacon = await _beaconRepository.GetByIdAsync(beaconId);
            if (beacon == null)
                return Result.Failure("BEACON_NOT_FOUND", $"Beacon with ID: {beaconId} not found.");

            var building = await _buildingRepository.GetByIdAsync(update.BuildingId);
            if (building == null)
                return Result.Failure("BUILDING_NOT_FOUND", $"Building {update.BuildingId} not found.");

            beacon.X          = update.X;
            beacon.Y          = update.Y;
            beacon.Floor      = update.Floor;
            beacon.BuildingId = update.BuildingId;
            beacon.UpdatedAt  = DateTime.UtcNow;

            await _beaconRepository.UpdateAsync(beacon);
            await _beaconRepository.SaveChangesAsync();

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure("DATABASE_ERROR", $"Failed to update beacon: {ex.Message}");
        }
    }

    public async Task<Result> DeleteBeacon(string beaconId)
    {
        if (string.IsNullOrWhiteSpace(beaconId))
            return Result.Failure("INVALID_INPUT", "Beacon ID cannot be empty.");

        try
        {
            var beacon = await _beaconRepository.GetByIdAsync(beaconId);
            if (beacon == null)
                return Result.Failure("BEACON_NOT_FOUND", $"Beacon with ID {beaconId} not found.");

            await _beaconRepository.DeleteAsync(beacon);
            await _beaconRepository.SaveChangesAsync();

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure("DATABASE_ERROR", $"Failed to delete beacon: {ex.Message}");
        }
    }

    public async Task<Result<Beacon>> GetBeaconByIdentifiers(string uuid, int major, int minor)
    {
        if (string.IsNullOrWhiteSpace(uuid))
            return Result<Beacon>.Failure("INVALID_INPUT", "UUID cannot be empty.");

        var beacon = await _beaconRepository.GetByIdentifiersAsync(uuid.ToUpperInvariant(), major, minor);
        if (beacon == null)
            return Result<Beacon>.Failure("BEACON_NOT_FOUND", $"Beacon with UUID {uuid}, Major {major}, Minor {minor} not found.");

        return Result<Beacon>.Success(beacon);
    }
}
