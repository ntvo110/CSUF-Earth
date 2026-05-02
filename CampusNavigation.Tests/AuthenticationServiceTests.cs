using CampusNavigation.DTOs;
using CampusNavigation.Models;
using CampusNavigation.Repositories;
using CampusNavigation.Services;
using Microsoft.Extensions.Configuration;
using Moq;

namespace CampusNavigation.Tests;

public class AuthenticationServiceTests
{
    private readonly Mock<IUserRepository>  _userRepoMock;
    private readonly IConfiguration        _configuration;
    private readonly AuthenticationService  _service;

    public AuthenticationServiceTests()
    {
        _userRepoMock = new Mock<IUserRepository>();

        var inMemorySettings = new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "SuperSecretTestKey_AtLeast32Chars!!",
            ["JwtSettings:Issuer"]    = "TestIssuer",
            ["JwtSettings:Audience"]  = "TestAudience"
        };
        _configuration = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();
        _service       = new AuthenticationService(_userRepoMock.Object, _configuration);
    }

    // ── LoginAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsTokenAndUserInfo()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("password123", workFactor: 4);
        var user = new User { UserId = "u1", Email = "test@test.com", PasswordHash = hash, Name = "Alice", Role = "User" };
        _userRepoMock.Setup(r => r.GetByEmailAsync("test@test.com")).ReturnsAsync(user);

        var result = await _service.LoginAsync(new LoginRequest { Email = "test@test.com", Password = "password123" });

        Assert.True(result.IsSuccess);
        Assert.False(string.IsNullOrEmpty(result.Data!.Token));
        Assert.Equal("u1",    result.Data.UserId);
        Assert.Equal("Alice", result.Data.Name);
        Assert.Equal("User",  result.Data.Role);
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ReturnsInvalidCredentials()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("correct", workFactor: 4);
        _userRepoMock.Setup(r => r.GetByEmailAsync("test@test.com"))
                     .ReturnsAsync(new User { UserId = "u1", Email = "test@test.com", PasswordHash = hash, Name = "Alice", Role = "User" });

        var result = await _service.LoginAsync(new LoginRequest { Email = "test@test.com", Password = "wrong" });

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_CREDENTIALS", result.ErrorCode);
    }

    [Fact]
    public async Task LoginAsync_UserNotFound_ReturnsInvalidCredentials()
    {
        _userRepoMock.Setup(r => r.GetByEmailAsync("nobody@test.com")).ReturnsAsync((User?)null);

        var result = await _service.LoginAsync(new LoginRequest { Email = "nobody@test.com", Password = "pass" });

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_CREDENTIALS", result.ErrorCode);
    }

    [Fact]
    public async Task LoginAsync_EmptyEmail_ReturnsMissingRequiredField()
    {
        var result = await _service.LoginAsync(new LoginRequest { Email = "", Password = "pass" });

        Assert.False(result.IsSuccess);
        Assert.Equal("MISSING_REQUIRED_FIELD", result.ErrorCode);
    }

    [Fact]
    public async Task LoginAsync_EmptyPassword_ReturnsMissingRequiredField()
    {
        var result = await _service.LoginAsync(new LoginRequest { Email = "test@test.com", Password = "" });

        Assert.False(result.IsSuccess);
        Assert.Equal("MISSING_REQUIRED_FIELD", result.ErrorCode);
    }

    // ── RegisterAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task RegisterAsync_NewUser_ReturnsTokenAndUserInfo()
    {
        _userRepoMock.Setup(r => r.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>())).ReturnsAsync(false);
        _userRepoMock.Setup(r => r.AddAsync(It.IsAny<User>())).ReturnsAsync((User u) => u);
        _userRepoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.RegisterAsync(new RegisterRequest { Email = "new@test.com", Password = "securePass1", Name = "Bob" });

        Assert.True(result.IsSuccess);
        Assert.False(string.IsNullOrEmpty(result.Data!.Token));
        Assert.Equal("Bob",  result.Data.Name);
        Assert.Equal("User", result.Data.Role);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ReturnsEmailAlreadyExists()
    {
        _userRepoMock.Setup(r => r.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>())).ReturnsAsync(true);

        var result = await _service.RegisterAsync(new RegisterRequest { Email = "existing@test.com", Password = "pass", Name = "Bob" });

        Assert.False(result.IsSuccess);
        Assert.Equal("EMAIL_ALREADY_EXISTS", result.ErrorCode);
    }

    [Fact]
    public async Task RegisterAsync_EmptyEmail_ReturnsMissingRequiredField()
    {
        var result = await _service.RegisterAsync(new RegisterRequest { Email = "", Password = "pass", Name = "Bob" });

        Assert.False(result.IsSuccess);
        Assert.Equal("MISSING_REQUIRED_FIELD", result.ErrorCode);
    }

    [Fact]
    public async Task RegisterAsync_EmptyPassword_ReturnsMissingRequiredField()
    {
        var result = await _service.RegisterAsync(new RegisterRequest { Email = "a@b.com", Password = "", Name = "Bob" });

        Assert.False(result.IsSuccess);
        Assert.Equal("MISSING_REQUIRED_FIELD", result.ErrorCode);
    }

    [Fact]
    public async Task RegisterAsync_EmailStoredAsLowercase()
    {
        User? savedUser = null;
        _userRepoMock.Setup(r => r.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>())).ReturnsAsync(false);
        _userRepoMock.Setup(r => r.AddAsync(It.IsAny<User>())).Callback<User>(u => savedUser = u).ReturnsAsync((User u) => u);
        _userRepoMock.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        await _service.RegisterAsync(new RegisterRequest { Email = "UPPER@TEST.COM", Password = "pass", Name = "Bob" });

        Assert.NotNull(savedUser);
        Assert.Equal("upper@test.com", savedUser!.Email);
    }
}
