using CampusNavigation.Utilities;

namespace CampusNavigation.Tests;

public class NavigationUtilitiesTests
{
    // ── ConvertRSSIToDistance ────────────────────────────────────────────────

    [Fact]
    public void ConvertRSSIToDistance_WhenRssiEqualsTxPower_ReturnsOneMetreInFeet()
    {
        double result = NavigationUtilities.ConvertRSSIToDistance(-59, -59);
        Assert.Equal(3.28084, result, precision: 4);
    }

    [Fact]
    public void ConvertRSSIToDistance_WeakerSignal_ReturnsLargerDistance()
    {
        double close = NavigationUtilities.ConvertRSSIToDistance(-60, -59);
        double far   = NavigationUtilities.ConvertRSSIToDistance(-80, -59);
        Assert.True(far > close);
    }

    [Fact]
    public void ConvertRSSIToDistance_StrongerSignal_ReturnsSmallerDistance()
    {
        double weak   = NavigationUtilities.ConvertRSSIToDistance(-70, -59);
        double strong = NavigationUtilities.ConvertRSSIToDistance(-50, -59);
        Assert.True(strong < weak);
    }

    // ── Bilaterate ───────────────────────────────────────────────────────────

    [Fact]
    public void Bilaterate_EqualDistances_ReturnsMidpoint()
    {
        var b1 = new BeaconLocation { X = 0, Y = 0 };
        var b2 = new BeaconLocation { X = 10, Y = 0 };

        var result = NavigationUtilities.Bilaterate(b1, 5, b2, 5);

        Assert.NotNull(result);
        Assert.Equal(5.0, result!.X, precision: 5);
        Assert.Equal(0.0, result.Y, precision: 5);
    }

    [Fact]
    public void Bilaterate_CloserToFirstBeacon_ReturnsPositionBiasedTowardFirst()
    {
        var b1 = new BeaconLocation { X = 0, Y = 0 };
        var b2 = new BeaconLocation { X = 10, Y = 0 };

        var result = NavigationUtilities.Bilaterate(b1, 1, b2, 9);

        Assert.NotNull(result);
        Assert.True(result!.X < 5.0);
    }

    [Fact]
    public void Bilaterate_NearZeroR1_ReturnsB1Position()
    {
        var b1 = new BeaconLocation { X = 3, Y = 7 };
        var b2 = new BeaconLocation { X = 20, Y = 20 };

        var result = NavigationUtilities.Bilaterate(b1, 0.0001, b2, 10);

        Assert.NotNull(result);
        Assert.Equal(3.0, result!.X, precision: 3);
        Assert.Equal(7.0, result.Y, precision: 3);
    }

    [Fact]
    public void Bilaterate_NearZeroR2_ReturnsB2Position()
    {
        var b1 = new BeaconLocation { X = 0, Y = 0 };
        var b2 = new BeaconLocation { X = 5, Y = 5 };

        var result = NavigationUtilities.Bilaterate(b1, 10, b2, 0.0001);

        Assert.NotNull(result);
        Assert.Equal(5.0, result!.X, precision: 3);
        Assert.Equal(5.0, result.Y, precision: 3);
    }

    // ── Trilaterate ──────────────────────────────────────────────────────────

    [Fact]
    public void Trilaterate_ThreeBeaconsAroundOrigin_ReturnsApproximateOrigin()
    {
        var beacons = new List<BeaconLocation>
        {
            new() { X = 5,  Y = 10 },
            new() { X = 0,  Y = 0  },
            new() { X = 10, Y = 0  }
        };
        var distances = new List<double> { 5.0, 7.071, 7.071 };

        var result = NavigationUtilities.Trilaterate(beacons, distances);

        Assert.NotNull(result);
        Assert.Equal(5.0, result.X, precision: 0);
        Assert.Equal(5.0, result.Y, precision: 0);
    }

    [Fact]
    public void Trilaterate_FewerThanThreeBeacons_ThrowsArgumentException()
    {
        var beacons   = new List<BeaconLocation> { new() { X = 0, Y = 0 }, new() { X = 5, Y = 0 } };
        var distances = new List<double> { 3.0, 4.0 };

        Assert.Throws<ArgumentException>(() => NavigationUtilities.Trilaterate(beacons, distances));
    }

    [Fact]
    public void Trilaterate_MismatchedCounts_ThrowsArgumentException()
    {
        var beacons   = new List<BeaconLocation> { new(), new(), new() };
        var distances = new List<double> { 1.0, 2.0 };

        Assert.Throws<ArgumentException>(() => NavigationUtilities.Trilaterate(beacons, distances));
    }

    // ── BilaterateWithSmoothing ──────────────────────────────────────────────

    [Fact]
    public void BilaterateWithSmoothing_NoSmoothing_ReturnsSameAsRawBilaterate()
    {
        NavigationUtilities.ResetKalmanFilter();

        var b1 = new BeaconLocation { X = 0, Y = 0 };
        var b2 = new BeaconLocation { X = 10, Y = 0 };

        var raw      = NavigationUtilities.Bilaterate(b1, 5, b2, 5);
        var smoothed = NavigationUtilities.BilaterateWithSmoothing(b1, 5, b2, 5, applySmoothing: false);

        Assert.NotNull(raw);
        Assert.NotNull(smoothed);
        Assert.Equal(raw!.X, smoothed!.X, precision: 5);
        Assert.Equal(raw.Y,  smoothed.Y,  precision: 5);
    }

    [Fact]
    public void BilaterateWithSmoothing_WithSmoothing_ReturnsNonNullPosition()
    {
        NavigationUtilities.ResetKalmanFilter();

        var b1 = new BeaconLocation { X = 0, Y = 0 };
        var b2 = new BeaconLocation { X = 10, Y = 0 };

        var result = NavigationUtilities.BilaterateWithSmoothing(b1, 5, b2, 5);

        Assert.NotNull(result);
    }

    // ── TrilaterateWithSmoothing ─────────────────────────────────────────────

    [Fact]
    public void TrilaterateWithSmoothing_NoSmoothing_ReturnsSameAsRawTrilaterate()
    {
        NavigationUtilities.ResetKalmanFilter();

        var beacons = new List<BeaconLocation>
        {
            new() { X = 5,  Y = 10 },
            new() { X = 0,  Y = 0  },
            new() { X = 10, Y = 0  }
        };
        var distances = new List<double> { 5.0, 7.071, 7.071 };

        var raw      = NavigationUtilities.Trilaterate(beacons, distances);
        var smoothed = NavigationUtilities.TrilaterateWithSmoothing(beacons, distances, applySmoothing: false);

        Assert.NotNull(smoothed);
        Assert.Equal(raw.X, smoothed!.X, precision: 5);
        Assert.Equal(raw.Y, smoothed.Y,  precision: 5);
    }

    // ── ResetKalmanFilter ────────────────────────────────────────────────────

    [Fact]
    public void ResetKalmanFilter_AfterReset_FirstCallReturnsRawPosition()
    {
        NavigationUtilities.ResetKalmanFilter();

        var b1 = new BeaconLocation { X = 2, Y = 3 };
        var b2 = new BeaconLocation { X = 8, Y = 3 };

        var result = NavigationUtilities.BilaterateWithSmoothing(b1, 3, b2, 3);
        var raw    = NavigationUtilities.Bilaterate(b1, 3, b2, 3);

        Assert.NotNull(result);
        Assert.Equal(raw!.X, result!.X, precision: 5);
        Assert.Equal(raw.Y,  result.Y,  precision: 5);
    }
}
