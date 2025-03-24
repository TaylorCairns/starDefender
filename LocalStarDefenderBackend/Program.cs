using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

if (builder.Environment.IsEnvironment("Test"))
{
    builder.Services.AddDbContext<StarDefenderDbContext>(options =>
        options.UseInMemoryDatabase("TestDb"));
}
else
{
    builder.Services.AddDbContext<StarDefenderDbContext>(options =>
        options.UseSqlite("Data Source=StarDefender.db"));
}

var app = builder.Build();

if (!app.Environment.IsEnvironment("Test"))
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<StarDefenderDbContext>();
        db.Database.EnsureCreated();
    }
}

app.UseCors("CorsPolicy");
var sessions = new Dictionary<string, string>();

app.MapPost("/api/register", async (StarDefenderDbContext db, User newUser) =>
{
    var existing = await db.Users.FirstOrDefaultAsync(u => u.Username == newUser.Username);
    if (existing != null) return Results.BadRequest("Username already exists");
    db.Users.Add(newUser);
    await db.SaveChangesAsync();
    return Results.Ok("User registered");
});

app.MapPost("/api/login", async (StarDefenderDbContext db, User credentials) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u =>
        u.Username == credentials.Username &&
        u.Password == credentials.Password);
    if (user == null) return Results.Unauthorized();
    var token = Guid.NewGuid().ToString();
    sessions[token] = user.Username;
    return Results.Ok(new { token });
});

app.MapGet("/api/scores", async (StarDefenderDbContext db) =>
{
    var topScores = await db.Scores
        .OrderByDescending(s => s.Points)
        .Take(10)
        .ToListAsync();
    return topScores;
});

app.MapGet("/api/users", async (StarDefenderDbContext db) =>
{
    var users = await db.Users.ToListAsync();
    return users;
});

app.MapPost("/api/scores", async (StarDefenderDbContext db, HttpRequest request, Score newScore) =>
{
    var authHeader = request.Headers.Authorization.ToString();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ")) return Results.Unauthorized();
    var token = authHeader.Substring("Bearer ".Length).Trim();
    if (!sessions.ContainsKey(token)) return Results.Unauthorized();
    var username = sessions[token];
    newScore.PlayerName = username;
    newScore.Timestamp = DateTime.UtcNow;
    db.Scores.Add(newScore);
    await db.SaveChangesAsync();
    return Results.Created($"/api/scores/{newScore.Id}", newScore);
});

app.Run();

public class StarDefenderDbContext : DbContext
{
    public StarDefenderDbContext(DbContextOptions<StarDefenderDbContext> options) : base(options) { }
    public DbSet<User> Users => Set<User>();
    public DbSet<Score> Scores => Set<Score>();
}

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class Score
{
    public int Id { get; set; }
    public string PlayerName { get; set; } = default!;
    public int Points { get; set; }
    public DateTime Timestamp { get; set; }
}

public partial class Program { }
