---
title: "Using Supabase Free Postgres for Java HomeLab POCs: A Practical Guide"
date: "2026-05-16"
description: "How to leverage Supabase's free tier PostgreSQL database to speed up Java API development for homelabs and proof-of-concepts without managing infrastructure."
tags:
  [
    "supabase",
    "postgres",
    "java",
    "spring-boot",
    "micronaut",
    "database",
    "homelab",
    "poc",
    "free-tier",
  ]
---

Picture this: it's Saturday afternoon, you have a brilliant idea for a side project, and you want to spin up a quick API with a real database to test it out. But then the familiar friction hits — do you install Postgres locally? Docker? Configure connection pools? Manage backups? Suddenly your weekend project feels like a DevOps marathon.

I've been there countless times. That's exactly why I started using **Supabase** for my Java homeLab experiments and POCs. It gives you a real PostgreSQL database with zero setup, and the free tier is surprisingly generous for personal projects.

## What Is Supabase (and Why Should You Care)?

Supabase is essentially **managed PostgreSQL** with a developer-friendly API layer on top. Every project you create gets its own dedicated Postgres instance — not a shared schema, not SQLite pretending to be Postgres, but the real deal. You get:

- **Real PostgreSQL** with full SQL support, extensions, and standard JDBC compatibility
- **Auto-generated REST and GraphQL APIs** based on your schema
- **Built-in authentication** with JWT and Row Level Security
- **Realtime subscriptions** via WebSockets
- **Storage** for files and images
- **Edge Functions** for serverless compute

For Java developers, the killer feature is simple: **you can connect via standard JDBC** just like any other Postgres database. No proprietary SDKs, no lock-in. If you ever outgrow Supabase, you can `pg_dump` your data and move it anywhere.

## The Free Tier: What's Actually Included?

Before we dive into code, let's be honest about what the free tier gives you and where the limits are. Supabase's free plan includes:

| Feature                     | Free Tier Limit                    |
| --------------------------- | ---------------------------------- |
| Database size               | **500 MB**                         |
| Monthly active users (Auth) | 50,000                             |
| Bandwidth (egress)          | **5 GB**                           |
| Storage                     | 1 GB                               |
| Edge function invocations   | 500,000                            |
| Realtime messages           | 2 million                          |
| Concurrent connections      | **200 (pooler)** / **60 (direct)** |
| Compute                     | Shared CPU, 500 MB RAM             |
| Backups                     | ❌ Not included                    |
| **Project pausing**         | **After 1 week of inactivity**     |

The biggest gotchas for homelab use are:

1. **500 MB database size** — plenty for POCs, but you'll hit this quickly if you store large JSON blobs or logs
2. **Project pauses after 7 days of inactivity** — the database goes to sleep and takes ~30 seconds to wake up on the next request. Fine for experiments, annoying for demos
3. **No automated backups on free tier** — export your schema/data manually if you care about it
4. **Shared CPU** — don't expect blazing performance for heavy analytics queries

For context: 500 MB is roughly **~500,000 rows** of typical application data (users, orders, configs). That's more than enough for most POCs and side projects.

## Setting Up Your Free Database

Creating a project takes about 2 minutes:

1. Go to [supabase.com](https://supabase.com) and sign up (GitHub login works)
2. Click **"New Project"** and choose your organization
3. Give it a name like `homelab-experiments`
4. Pick a region close to you (latency matters for JDBC connections)
5. Set a database password — **save this somewhere secure**, you'll need it for the JDBC URL
6. Wait ~2 minutes for provisioning

Once ready, go to **Project Settings → Database** and grab your connection string. It looks like this:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres
```

For Java applications, I strongly recommend using the **connection pooler** instead of direct connections:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:6543/postgres
```

The pooler (`:6543`) supports up to **200 concurrent connections** and handles connection management for you. The direct port (`:5432`) only allows 60 connections and is better suited for `psql` or `pgAdmin`.

## Java Integration: Spring Boot

Let's wire this up with Spring Boot. Add the standard Postgres driver to your `pom.xml`:

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

Then configure your `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://db.xxxxxxxx.supabase.co:6543/postgres?sslmode=require
spring.datasource.username=postgres
spring.datasource.password=your-secure-password-here
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.idle-timeout=300000

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

A few important notes for Supabase specifically:

- **`sslmode=require`** — Supabase enforces TLS. Without this, your connection will be rejected
- **`maximum-pool-size=10`** — be conservative. The free tier pooler handles 200 connections total across all clients. If you're running multiple services, adjust accordingly
- **`ddl-auto=validate`** — I prefer explicit schema migrations (Flyway or Liquibase) over letting Hibernate create tables. Supabase's table editor is also great for quick schema prototyping

Here's a minimal entity and repository to get you started:

```java
@Entity
@Table(name = "experiments")
public class Experiment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // getters and setters omitted for brevity
}
```

```java
@Repository
public interface ExperimentRepository extends JpaRepository<Experiment, Long> {
    List<Experiment> findByNameContainingIgnoreCase(String name);
}
```

```java
@RestController
@RequestMapping("/api/experiments")
public class ExperimentController {

    private final ExperimentRepository repository;

    public ExperimentController(ExperimentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Experiment> list() {
        return repository.findAll();
    }

    @PostMapping
    public Experiment create(@RequestBody Experiment experiment) {
        return repository.save(experiment);
    }

    @GetMapping("/search")
    public List<Experiment> search(@RequestParam String q) {
        return repository.findByNameContainingIgnoreCase(q);
    }
}
```

With this setup, you have a fully functional REST API backed by real PostgreSQL in under 50 lines of Java. No Docker, no `initdb`, no `pg_hba.conf` headaches.

## Java Integration: Micronaut

If you prefer Micronaut (and I often do for its startup speed and low memory footprint), the setup is nearly identical. Add the dependencies:

```xml
<dependency>
    <groupId>io.micronaut.sql</groupId>
    <artifactId>micronaut-jdbc-hikari</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.micronaut.data</groupId>
    <artifactId>micronaut-data-jdbc</artifactId>
</dependency>
```

Your `application.yml`:

```yaml
datasources:
  default:
    url: jdbc:postgresql://db.xxxxxxxx.supabase.co:6543/postgres?sslmode=require
    username: postgres
    password: your-secure-password-here
    driver-class-name: org.postgresql.Driver
    maximum-pool-size: 10

flyway:
  datasources:
    default:
      enabled: true
```

Micronaut's startup time with Supabase is excellent — typically **under 2 seconds** for a simple API. That's perfect for rapid iteration during POC development.

## Maximizing the Free Tier for Development Velocity

After running several projects on Supabase free tier, here are my practical tips to stay within limits while moving fast:

### 1. Use Multiple Projects Strategically

You're allowed **2 active free projects**. I typically keep:

- One "stable" project for longer-running experiments
- One "scratch" project that I reset frequently for quick POCs

When a project pauses after 7 days, just resume it from the dashboard. Or delete and recreate if it was just a scratchpad.

### 2. Avoid Storing Large Objects in Postgres

That 500 MB fills up faster than you'd think. For images, PDFs, or large JSON files, use Supabase Storage (1 GB included) or an external CDN. Keep your database tables lean.

### 3. Monitor Your Connection Pool

If you're running multiple microservices locally against the same database, those connection pools add up. Use the pooler port (`:6543`) and keep `maximum-pool-size` modest (5-10 per service).

### 4. Disable Unnecessary Features

The free tier includes Auth, Storage, Realtime, and Edge Functions. If you're only using the database, you can ignore the rest — but they don't count against your limits anyway. Just be aware that enabling Realtime on large tables can generate message volume quickly.

### 5. Export Your Schema Regularly

Since free projects don't have automated backups, keep a local copy of your schema:

```bash
$ pg_dump --schema-only \
  postgresql://postgres:password@db.xxxxxxxx.supabase.co:5432/postgres \
  > schema_backup.sql
```

For data exports, Supabase's dashboard has a one-click CSV export per table.

## When to Upgrade (and When Not To)

The free tier starts feeling tight when:

- Your database grows beyond ~400 MB (leave headroom)
- You need automated backups for production data
- Your project can't tolerate the 7-day pause behavior
- You're handling >50,000 monthly active users (Auth)
- You need dedicated CPU for consistent query performance

The **Pro plan at $25/month** adds 8 GB disk, 100K MAUs, 250 GB bandwidth, daily backups, and never pauses. For a real side project with users, that's reasonable. For pure experimentation and learning, free is more than enough.

## Attention Points and Gotchas

Before you commit to Supabase for a POC, keep these in mind:

**Connection Limits**  
The 60 direct / 200 pooler connections are shared across all clients. If your Spring Boot app uses HikariCP with `maximum-pool-size=20` and you have 5 developers hitting the same project, you'll exhaust the pool. Coordinate or use separate projects.

**SSL Requirement**  
Supabase rejects non-TLS connections. Your JDBC URL must include `sslmode=require`. This is standard practice anyway, but worth noting if you're debugging connection failures.

**Schema Ownership**  
Supabase creates a `postgres` superuser and a `supabase_admin` role. Don't delete or modify system schemas (`auth`, `storage`, `realtime`). Stick to creating tables in the `public` schema or your own schemas.

**Row Level Security (RLS)**  
Supabase enables RLS by default on tables created via their UI. If you're connecting via JDBC and not using Supabase Auth, you'll need to either:

- Disable RLS for those tables, or
- Create policies that allow your service role to access data

This tripped me up early on — queries returning zero rows even though the table had data. Check RLS first.

**Egress Costs on Pro**  
If you do upgrade later, bandwidth is the sneaky cost. 250 GB is generous, but serving large result sets or files to many users can chew through it. Keep an eye on the usage dashboard.

## My Typical HomeLab Workflow

Here's how I actually use Supabase day-to-day for Java experiments:

1. **Monday evening**: New idea for a microservice pattern I want to try
2. **Create Supabase project** (2 minutes, free tier)
3. **Spin up Spring Boot / Micronaut** with starter.spring.io or Micronaut Launch
4. **Add Postgres driver + connection config** (5 minutes)
5. **Design schema** — sometimes in Supabase's UI, sometimes with Flyway migrations
6. **Build and iterate** for a few days
7. **If the POC dies**: delete the project, no cleanup needed
8. **If the POC lives**: export schema, evaluate whether it needs Pro or self-hosted Postgres

The entire setup from zero to running API with database is consistently under **15 minutes**. Compare that to installing Postgres, configuring users, setting up connection pools, and managing Docker volumes locally.

## Conclusion

Supabase's free tier is genuinely useful for Java developers who want to move fast without infrastructure friction. It's not a toy database — it's real PostgreSQL with real tooling, just with sensible limits that encourage you to upgrade when your project grows up.

For homeLabs, learning experiments, and quick POCs, the free plan removes the "setup tax" entirely. You focus on writing Java code and shipping features instead of `docker-compose.yml` maintenance.

My recommendation: create a free project today, wire it to a Spring Boot or Micronaut app, and see how much faster you iterate when the database just works. When you hit the limits, you'll know your project has legs — and that's a good problem to have.

## References

- [Supabase Database Documentation](https://supabase.com/database)
- [Supabase Pricing & Free Tier Limits](https://supabase.com/pricing)
- [PostgreSQL JDBC Driver](https://jdbc.postgresql.org/)
- [Supabase Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [HikariCP Configuration Best Practices](https://github.com/brettwooldridge/HikariCP)
