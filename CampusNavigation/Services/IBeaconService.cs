using CampusNavigation.DTOs;
using CampusNavigation.Models;

namespace CampusNavigation.Services;

public interface IBeaconService
{
    Task<Result<IEnumerable<BeaconDto>>> GetBeaconsByBuilding(string buildingId);
    Task<Result<string>> RegisterBeacon(BeaconRegistrationDto beacon);
    Task<Result> UpdateBeacon(string beaconId, BeaconUpdateDto update);
    Task<Result> DeleteBeacon(string beaconId);
    Task<Result<Beacon>> GetBeaconByIdentifiers(string uuid, int major, int minor);
}
