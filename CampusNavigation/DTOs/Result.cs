namespace CampusNavigation.DTOs;

public class Result<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string ErrorCode { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;

    public static Result<T> Success(T data)
    {
        return new Result<T>
        {
            IsSuccess = true,
            Data = data
        };
    }

    public static Result<T> Failure(string errorCode, string errorMessage)
    {
        return new Result<T>
        {
            IsSuccess = false,
            ErrorCode = errorCode,
            ErrorMessage = errorMessage
        };
    }
}

public record Result(bool IsSuccess)
{
    public string ErrorCode { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;

    public static Result Success()
    {
        return new Result(true);
    }

    public static Result Failure(string errorCode, string errorMessage)
    {
        return new Result(false)
        {
            ErrorCode = errorCode,
            ErrorMessage = errorMessage
        };
    }
}
