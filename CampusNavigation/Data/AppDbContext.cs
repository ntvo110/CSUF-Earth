using Microsoft.EntityFrameworkCore;
using CampusNavigation.Models;

namespace CampusNavigation.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Building> Buildings { get; set; } = null!;
        public DbSet<IndoorEdge> IndoorEdges { get; set; } = null!;
        public DbSet<IndoorNode> IndoorNodes { get; set; } = null!;
        public DbSet<Beacon> Beacons { get; set; } = null!;
        public DbSet<NavigationHistory> NavigationHistories { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<Building>(entity =>
            {
                entity.HasKey(e => e.BuildingId);
                entity.Property(e => e.BuildingName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Lat).IsRequired();
                entity.Property(e => e.Long).IsRequired();
                entity.Property(e => e.FloorCount).IsRequired();
                entity.Property(e => e.GeofenceRadiusFeet).IsRequired().HasDefaultValue(164.0);
            });

            modelBuilder.Entity<IndoorEdge>(entity =>
            {
                entity.HasKey(e => e.EdgeId);
                entity.HasIndex(e => e.BuildingId);
                entity.Property(e => e.Distance).IsRequired();

                entity.HasOne(e => e.StartNode)
                    .WithMany()
                    .HasForeignKey(e => e.StartNodeId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.EndNode)
                    .WithMany()
                    .HasForeignKey(e => e.EndNodeId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Building)
                    .WithMany()
                    .HasForeignKey(e => e.BuildingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<IndoorNode>(entity =>
            {
                entity.HasKey(e => e.IndoorNodeId);
                entity.HasIndex(e => e.BuildingId);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Floor).IsRequired();
                entity.Property(e => e.NodeType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.X).IsRequired();
                entity.Property(e => e.Y).IsRequired();

                entity.HasOne(e => e.Building)
                    .WithMany(e => e.IndoorNodes)
                    .HasForeignKey(e => e.BuildingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Beacon>(entity =>
            {
                entity.HasKey(e => e.BeaconId);
                entity.HasIndex(e => new { e.UUID, e.Major, e.Minor }).IsUnique();
                entity.HasIndex(e => e.BuildingId);
                entity.Property(e => e.UUID).IsRequired().HasMaxLength(36);

                entity.HasOne(e => e.Building)
                    .WithMany(b => b.Beacons)
                    .HasForeignKey(e => e.BuildingId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<NavigationHistory>(entity =>
            {
                entity.HasKey(e => e.HistoryId);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.IndoorNode)
                    .WithMany()
                    .HasForeignKey(e => e.IndoorNodeId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
