using System;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using LocalStarDefenderBackend;

namespace StarDefenderTests
{
    public class CustomWebApplicationFactory<TStartup> : WebApplicationFactory<TStartup> where TStartup : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Test");
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<StarDefenderDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }
                services.AddDbContext<StarDefenderDbContext>(options =>
                {
                    options.UseInMemoryDatabase("InMemoryStarDefenderTestDb");
                });
            });
        }
    }

    public class ApiTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        public ApiTests(CustomWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
        }
        [Fact]
        public async Task Register_NewUser_ReturnsOk()
        {
            var newUser = new { Username = "testuser", Password = "password123" };
            var content = new StringContent(JsonSerializer.Serialize(newUser), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/api/register", content);
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("registered", responseContent, StringComparison.OrdinalIgnoreCase);
        }
        [Fact]
        public async Task Register_ExistingUser_ReturnsBadRequest()
        {
            var user = new { Username = "existinguser", Password = "password123" };
            var content = new StringContent(JsonSerializer.Serialize(user), Encoding.UTF8, "application/json");
            var response1 = await _client.PostAsync("/api/register", content);
            response1.EnsureSuccessStatusCode();
            var response2 = await _client.PostAsync("/api/register", content);
            Assert.Equal(HttpStatusCode.BadRequest, response2.StatusCode);
        }
        [Fact]
        public async Task Login_CorrectCredentials_ReturnsToken()
        {
            var user = new { Username = "loginuser", Password = "password123" };
            var registerContent = new StringContent(JsonSerializer.Serialize(user), Encoding.UTF8, "application/json");
            await _client.PostAsync("/api/register", registerContent);
            var loginContent = new StringContent(JsonSerializer.Serialize(user), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/api/login", loginContent);
            response.EnsureSuccessStatusCode();
            var responseJson = await response.Content.ReadAsStringAsync();
            Assert.Contains("token", responseJson);
        }
        [Fact]
        public async Task Login_IncorrectCredentials_ReturnsUnauthorized()
        {
            var credentials = new { Username = "nonexistent", Password = "wrongpassword" };
            var content = new StringContent(JsonSerializer.Serialize(credentials), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/api/login", content);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
        [Fact]
        public async Task PostScore_WithValidToken_ReturnsCreated()
        {
            var user = new { Username = "scoreuser", Password = "password123" };
            var userContent = new StringContent(JsonSerializer.Serialize(user), Encoding.UTF8, "application/json");
            await _client.PostAsync("/api/register", userContent);
            var loginContent = new StringContent(JsonSerializer.Serialize(user), Encoding.UTF8, "application/json");
            var loginResponse = await _client.PostAsync("/api/login", loginContent);
            loginResponse.EnsureSuccessStatusCode();
            var loginResponseJson = await loginResponse.Content.ReadAsStringAsync();
            var loginData = JsonSerializer.Deserialize<JsonElement>(loginResponseJson);
            var token = loginData.GetProperty("token").GetString();
            var newScore = new { Points = 50 };
            var scoreContent = new StringContent(JsonSerializer.Serialize(newScore), Encoding.UTF8, "application/json");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = await _client.PostAsync("/api/scores", scoreContent);
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }
        [Fact]
        public async Task PostScore_WithoutToken_ReturnsUnauthorized()
        {
            var newScore = new { Points = 50 };
            var scoreContent = new StringContent(JsonSerializer.Serialize(newScore), Encoding.UTF8, "application/json");
            _client.DefaultRequestHeaders.Authorization = null;
            var response = await _client.PostAsync("/api/scores", scoreContent);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
