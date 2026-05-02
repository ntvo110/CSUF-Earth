namespace CampusNavigation.Utilities;

public class Position
{
    public double X { get; set; }
    public double Y { get; set; }
}

public class BeaconLocation
{
    public double X { get; set; }
    public double Y { get; set; }
}

public static class NavigationUtilities
{
    [ThreadStatic]
    private static KalmanFilter? _kalmanFilter;

    public static double ConvertRSSIToDistance(int rssi, int txPower)
    {
        const double pathLossExponent = 2.5;
        double exponent = (txPower - rssi) / (10.0 * pathLossExponent);
        double distanceMeters = Math.Pow(10, exponent);
        return distanceMeters * 3.28084; // Convert to feet
    }

    public static Position Trilaterate(IEnumerable<BeaconLocation> beacons, IEnumerable<double> distances)
    {
        var beaconList   = beacons.ToList();
        var distanceList = distances.ToList();

        if (beaconList.Count < 3)
            throw new ArgumentException("At least 3 beacons are required for trilateration.", nameof(beacons));
        if (beaconList.Count != distanceList.Count)
            throw new ArgumentException("Beacon count must match distances count.");

        var x1 = beaconList[0].X;
        var y1 = beaconList[0].Y;
        var d1 = distanceList[0];

        int n = beaconList.Count - 1;
        double[,] A = new double[n, 2];
        double[] b = new double[n];

        for (int i = 0; i < n; i++)
        {
            var xi = beaconList[i + 1].X;
            var yi = beaconList[i + 1].Y;
            var di = distanceList[i + 1];

            A[i, 0] = 2 * (xi - x1);
            A[i, 1] = 2 * (yi - y1);
            b[i] = xi * xi + yi * yi - x1 * x1 - y1 * y1 + d1 * d1 - di * di;
        }

        var position = SolveLeastSquares(A, b);
        return new Position { X = position[0], Y = position[1] };
    }

    public static Position? Bilaterate(BeaconLocation b1, double r1, BeaconLocation b2, double r2)
    {
        if (r1 < 0.001) return new Position { X = b1.X, Y = b1.Y };
        if (r2 < 0.001) return new Position { X = b2.X, Y = b2.Y };

        double w1 = 1.0 / (r1 * r1);
        double w2 = 1.0 / (r2 * r2);
        double totalWeight = w1 + w2;

        return new Position
        {
            X = (b1.X * w1 + b2.X * w2) / totalWeight,
            Y = (b1.Y * w1 + b2.Y * w2) / totalWeight
        };
    }

    public static Position? BilaterateWithSmoothing(BeaconLocation b1, double r1, BeaconLocation b2, double r2,
        bool applySmoothing = true, double processNoise = 0.1, double measurementNoise = 1.0)
    {
        var rawPosition = Bilaterate(b1, r1, b2, r2);
        if (rawPosition == null) return null;
        return applySmoothing ? ApplyKalmanSmoothing(rawPosition, processNoise, measurementNoise) : rawPosition;
    }

    /// <summary>
    /// Trilaterates and then passes the result through a Kalman filter.
    /// Call ResetKalmanFilter() when the user changes floors or restarts navigation.
    /// </summary>
    public static Position? TrilaterateWithSmoothing(IEnumerable<BeaconLocation> beacons, IEnumerable<double> distances,
        bool applySmoothing = true, double processNoise = 0.1, double measurementNoise = 1.0)
    {
        var rawPosition = Trilaterate(beacons, distances);
        if (rawPosition == null) return null;
        return applySmoothing ? ApplyKalmanSmoothing(rawPosition, processNoise, measurementNoise) : rawPosition;
    }

    public static Position ApplyKalmanSmoothing(Position rawPosition, double processNoise = 0.1, double measurementNoise = 1.0)
    {
        if (_kalmanFilter == null)
        {
            _kalmanFilter = new KalmanFilter(rawPosition.X, rawPosition.Y, processNoise, measurementNoise);
            return rawPosition;
        }

        var smoothed = _kalmanFilter.Update(rawPosition.X, rawPosition.Y);
        return new Position { X = smoothed.X, Y = smoothed.Y };
    }

    public static void ResetKalmanFilter() => _kalmanFilter = null;

    private static double[] SolveLeastSquares(double[,] A, double[] b)
    {
        int rows = A.GetLength(0);
        int cols = A.GetLength(1);

        // Compute A^T * A
        double[,] AtA = new double[cols, cols];
        for (int i = 0; i < cols; i++)
        {
            for (int j = 0; j < cols; j++)
            {
                double sum = 0;
                for (int k = 0; k < rows; k++)
                    sum += A[k, i] * A[k, j];
                AtA[i, j] = sum;
            }
        }

        // Compute A^T * b
        double[] Atb = new double[cols];
        for (int i = 0; i < cols; i++)
        {
            double sum = 0;
            for (int k = 0; k < rows; k++)
                sum += A[k, i] * b[k];
            Atb[i] = sum;
        }

        // Solve 2x2 normal equations via Cramer's rule
        double det = AtA[0, 0] * AtA[1, 1] - AtA[0, 1] * AtA[1, 0];
        if (Math.Abs(det) < 1e-10)
            throw new InvalidOperationException("System is singular, beacons may be collinear.");

        double x = (Atb[0] * AtA[1, 1] - Atb[1] * AtA[0, 1]) / det;
        double y = (AtA[0, 0] * Atb[1] - AtA[1, 0] * Atb[0]) / det;
        return new double[] { x, y };
    }
}
