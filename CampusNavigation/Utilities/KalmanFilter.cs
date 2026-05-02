namespace CampusNavigation.Utilities;

public class KalmanFilter
{
    private double[] state;
    private double[,] covariance;

    private readonly double processNoise;
    private readonly double measurementNoise;
    private readonly double dt;

    public double X => state[0];
    public double Y => state[1];

    public KalmanFilter(double initialX, double initialY, double processNoise = 0.1, double measurementNoise = 1.0, double dt = 1.0)
    {
        state = new double[] { initialX, initialY, 0, 0 };
        covariance = new double[4, 4];
        for (int i = 0; i < 4; i++) covariance[i, i] = 1.0;

        this.processNoise    = processNoise;
        this.measurementNoise = measurementNoise;
        this.dt              = dt;
    }

    public Position Update(double measuredX, double measuredY)
    {
        Predict();
        Correct(measuredX, measuredY);
        return new Position { X = state[0], Y = state[1] };
    }

    private void Predict()
    {
        double[,] F =
        {
            { 1, 0, dt, 0  },
            { 0, 1, 0,  dt },
            { 0, 0, 1,  0  },
            { 0, 0, 0,  1  }
        };

        double[] predicted = new double[4];
        for (int i = 0; i < 4; i++)
            for (int j = 0; j < 4; j++)
                predicted[i] += F[i, j] * state[j];
        state = predicted;

        double[,] Q = new double[4, 4];
        Q[0, 0] = processNoise * dt * dt / 4;
        Q[0, 2] = processNoise * dt / 2;
        Q[1, 1] = processNoise * dt * dt / 4;
        Q[1, 3] = processNoise * dt / 2;
        Q[2, 0] = processNoise * dt / 2;
        Q[2, 2] = processNoise;
        Q[3, 1] = processNoise * dt / 2;
        Q[3, 3] = processNoise;

        covariance = MatrixAdd(MatrixMultiply(MatrixMultiply(F, covariance), Transpose(F)), Q);
    }

    private void Correct(double measuredX, double measuredY)
    {
        double[,] H = { { 1, 0, 0, 0 }, { 0, 1, 0, 0 } };
        double[,] R = { { measurementNoise, 0 }, { 0, measurementNoise } };

        double[] Hx        = MultiplyMatrixVector(H, state);
        double[] innovation = { measuredX - Hx[0], measuredY - Hx[1] };

        double[,] S = MatrixAdd(MatrixMultiply(MatrixMultiply(H, covariance), Transpose(H)), R);
        double[,] K = MatrixMultiply(MatrixMultiply(covariance, Transpose(H)), Invert2x2(S));

        double[] Ky = MultiplyMatrixVector(K, innovation);
        for (int i = 0; i < 4; i++) state[i] += Ky[i];

        double[,] KH    = MatrixMultiply(K, H);
        double[,] I_KH  = new double[4, 4];
        for (int i = 0; i < 4; i++)
            for (int j = 0; j < 4; j++)
                I_KH[i, j] = (i == j ? 1.0 : 0.0) - KH[i, j];

        covariance = MatrixMultiply(I_KH, covariance);
    }

    // ── Matrix helpers ───────────────────────────────────────────────────────

    public static double[,] MatrixMultiply(double[,] A, double[,] B)
    {
        int r = A.GetLength(0), inner = A.GetLength(1), c = B.GetLength(1);
        var result = new double[r, c];
        for (int i = 0; i < r; i++)
            for (int j = 0; j < c; j++)
                for (int k = 0; k < inner; k++)
                    result[i, j] += A[i, k] * B[k, j];
        return result;
    }

    private static double[] MultiplyMatrixVector(double[,] A, double[] v)
    {
        int rows = A.GetLength(0), cols = A.GetLength(1);
        var result = new double[rows];
        for (int i = 0; i < rows; i++)
            for (int j = 0; j < cols; j++)
                result[i] += A[i, j] * v[j];
        return result;
    }

    private static double[,] Transpose(double[,] matrix)
    {
        int rows = matrix.GetLength(0), cols = matrix.GetLength(1);
        var t = new double[cols, rows];
        for (int i = 0; i < rows; i++)
            for (int j = 0; j < cols; j++)
                t[j, i] = matrix[i, j];
        return t;
    }

    private static double[,] MatrixAdd(double[,] A, double[,] B)
    {
        int row = A.GetLength(0), col = A.GetLength(1);
        var result = new double[row, col];
        for (int i = 0; i < row; i++)
            for (int j = 0; j < col; j++)
                result[i, j] = A[i, j] + B[i, j];
        return result;
    }

    private static double[,] Invert2x2(double[,] matrix)
    {
        double det = matrix[0, 0] * matrix[1, 1] - matrix[0, 1] * matrix[1, 0];
        if (Math.Abs(det) < 1e-10)
            throw new InvalidOperationException("Innovation covariance matrix is singular.");
        return new double[2, 2]
        {
            {  matrix[1, 1] / det, -matrix[0, 1] / det },
            { -matrix[1, 0] / det,  matrix[0, 0] / det }
        };
    }
}
