---
title: "Liquibase with Spring Boot: A Practical Tutorial for Schema and Data Migrations"
date: "2026-07-31"
description: "A step-by-step guide to using Liquibase with Spring Boot 3, PostgreSQL, and YAML changelogs. Covers schema migrations, seed data, rollback, contexts, and integration tests with Testcontainers."
tags:
  [
    "java",
    "spring-boot",
    "liquibase",
    "database",
    "migration",
    "postgresql",
    "testcontainers",
    "devops",
  ]
---

You have a working Spring Boot application and a schema that keeps changing. Maybe you added a new column locally, your teammate added a table on a branch, and production is on yet another version. Hibernate `ddl-auto` used to feel fine in a demo, but it is a liability once real data exists.

Liquibase solves this by turning schema changes into version-controlled, repeatable scripts. In this post, I will walk through a complete Spring Boot 3 + PostgreSQL project using Liquibase YAML changelogs. We'll cover schema migrations, seed data with `loadData`, rollback, contexts, and a Testcontainers-based integration test.

If you are still deciding between tools, I also wrote a broader comparison in [Flyway vs Liquibase](./flyway-vs-liquibase-database-migrations-java-comparison/).

## What You Need

- Java 17 or later
- Spring Boot 3.3+
- PostgreSQL (local or Docker)
- Maven or Gradle

## Project Setup

Create a Spring Boot project with:

- Spring Web
- Spring Data JPA
- PostgreSQL Driver
- Validation

Then add Liquibase:

```xml
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
</dependency>
```

Or with Gradle:

```gradle
dependencies {
    implementation("org.liquibase:liquibase-core")
}
```

No explicit plugin is required for the application to apply migrations on startup, but we will add the Maven/Gradle plugin later for CLI usage.

## Configure Spring Boot

Set the changelog path in `application.yaml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/taskmanager
    username: taskuser
    password: taskpass
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  liquibase:
    change-log: classpath:/db/changelog/db.changelog-master.yaml
    contexts: dev
```

The key line is `ddl-auto: validate`. Hibernate checks that the database matches the entities but never modifies the schema. Liquibase owns schema evolution.

## The Domain

We will build a tiny task manager with projects and tasks.

```java
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;

@Entity
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // getters and setters
}
```

```java
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;

@Entity
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    // getters and setters
}
```

## Changelog Structure

Create `src/main/resources/db/changelog/db.changelog-master.yaml`:

```yaml
databaseChangeLog:
  - include:
      file: classpath:/db/changelog/001-create-projects.yaml
  - include:
      file: classpath:/db/changelog/002-create-tasks.yaml
  - include:
      file: classpath:/db/changelog/003-seed-projects.yaml
```

I prefer one file per changeset group. It keeps diffs small and reviews focused.

## Changeset 1: Create the Projects Table

```yaml
# src/main/resources/db/changelog/001-create-projects.yaml
databaseChangeLog:
  - changeSet:
      id: 001-create-projects
      author: fernando.nogueira
      changes:
        - createTable:
            tableName: project
            columns:
              - column:
                  name: id
                  type: BIGSERIAL
                  autoIncrement: true
                  constraints:
                    primaryKey: true
                    nullable: false
              - column:
                  name: name
                  type: VARCHAR(255)
                  constraints:
                    nullable: false
                    unique: true
```

## Changeset 2: Create the Tasks Table

```yaml
# src/main/resources/db/changelog/002-create-tasks.yaml
databaseChangeLog:
  - changeSet:
      id: 002-create-tasks
      author: fernando.nogueira
      changes:
        - createTable:
            tableName: task
            columns:
              - column:
                  name: id
                  type: BIGSERIAL
                  autoIncrement: true
                  constraints:
                    primaryKey: true
                    nullable: false
              - column:
                  name: title
                  type: VARCHAR(500)
                  constraints:
                    nullable: false
              - column:
                  name: project_id
                  type: BIGINT
                  constraints:
                    nullable: false
                    foreignKeyName: fk_task_project
                    references: project(id)
        - createIndex:
            indexName: idx_task_project_id
            tableName: task
            columns:
              - column:
                  name: project_id
```

## Changeset 3: Seed Data

Create `src/main/resources/db/changelog/seed/projects.csv`:

```csv
name
Personal Blog
Homelab Dashboard
Invoice Parser
```

Then the changeset:

```yaml
# src/main/resources/db/changelog/003-seed-projects.yaml
databaseChangeLog:
  - changeSet:
      id: 003-seed-projects
      author: fernando.nogueira
      context: dev
      changes:
        - loadData:
            tableName: project
            file: classpath:/db/changelog/seed/projects.csv
            separator: ","
            encoding: UTF-8
            columns:
              - column:
                  name: name
                  type: STRING
```

The `context: dev` ensures this seed data runs only in development. In production, you would omit `dev` from `spring.liquibase.contexts`.

## Run the Application

Start PostgreSQL. I use Docker Compose:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: taskmanager
      POSTGRES_USER: taskuser
      POSTGRES_PASSWORD: taskpass
    ports:
      - "5432:5432"
```

Then:

```bash
$ docker compose up -d
$ ./mvnw spring-boot:run
```

On startup, Liquibase checks the `databasechangelog` table and runs any missing changesets. The application will fail fast if a migration cannot be applied, which is the behavior you want in production.

## Verify the Applied Migrations

Connect to PostgreSQL and check:

```sql
SELECT id, author, filename, orderexecuted
FROM databasechangelog
ORDER BY orderexecuted;
```

You should see three rows, one per changeset. Liquibase also created `databasechangeloglock` to prevent concurrent migration runs.

## Rolling Back

Liquibase can reverse changes if you declare a rollback. Add one to the tasks changeset:

```yaml
# src/main/resources/db/changelog/002-create-tasks.yaml
databaseChangeLog:
  - changeSet:
      id: 002-create-tasks
      author: fernando.nogueira
      changes:
        - createTable:
            tableName: task
            # ... columns and index as before
      rollback:
        - dropTable:
            tableName: task
```

To roll back the last changeset from the command line, use the Liquibase plugin or CLI:

```bash
$ liquibase rollbackCount 1 \
    --url=jdbc:postgresql://localhost:5432/taskmanager \
    --username=taskuser \
    --password=taskpass \
    --changeLogFile=src/main/resources/db/changelog/db.changelog-master.yaml
```

Spring Boot does not auto-rollback on startup, which is correct. Rollbacks are a deliberate operation, not a startup routine.

## Using the Liquibase Maven Plugin

Add the plugin to `pom.xml`:

```xml
<plugin>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-maven-plugin</artifactId>
    <version>4.31.0</version>
    <configuration>
        <changeLogFile>src/main/resources/db/changelog/db.changelog-master.yaml</changeLogFile>
        <url>jdbc:postgresql://localhost:5432/taskmanager</url>
        <username>taskuser</username>
        <password>taskpass</password>
    </configuration>
</plugin>
```

Now you can run:

```bash
$ ./mvnw liquibase:status
$ ./mvnw liquibase:update
$ ./mvnw liquibase:rollback -Dliquibase.rollbackCount=1
```

This is especially useful in CI before deploying the application.

## Contexts and Environments

Contexts let you run different changesets in different environments. We already used `dev` for seed data. You can combine them:

```yaml
spring:
  liquibase:
    contexts: dev,metrics
```

Or define environment-specific profiles:

```yaml
---
spring:
  config:
    activate:
      on-profile: prod
  liquibase:
    contexts: prod
```

Then tag production-only changesets with `context: prod`. This keeps seed scripts and reporting tables out of production.

## Integration Test with Testcontainers

Use Testcontainers to verify migrations against a real PostgreSQL instance during tests.

Add the dependency:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
```

Then a test configuration:

```java
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;

@TestConfiguration
public class TestcontainersConfig {

    @Bean
    @ServiceConnection
    public PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>("postgres:16-alpine");
    }
}
```

And the integration test:

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfig.class)
class LiquibaseMigrationIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void migrationsShouldCreateProjectAndTaskTables() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);

        Integer projectCount = jdbc.queryForObject(
            "SELECT COUNT(*) FROM project", Integer.class);
        Integer taskCount = jdbc.queryForObject(
            "SELECT COUNT(*) FROM task", Integer.class);

        assertThat(projectCount).isNotNegative();
        assertThat(taskCount).isNotNegative();
    }

    @Test
    void seedDataShouldBeApplied() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);

        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM project WHERE name IN (?, ?, ?)",
            Integer.class,
            "Personal Blog", "Homelab Dashboard", "Invoice Parser");

        assertThat(count).isEqualTo(3);
    }
}
```

This gives you confidence that your changelogs actually produce the schema your JPA entities expect.

## Common Pitfalls

### 1. Editing an Already Applied Changeset

Liquibase checksums every changeset. If you modify `002-create-tasks.yaml` after it ran, startup fails with a checksum mismatch. The fix is always to add a new changeset, never to edit the old one.

### 2. `classpath:` in Include Paths

The `include` tag supports both relative paths and `classpath:`. When you use `classpath:`, make sure the file exists under `src/main/resources`. Relative paths are resolved from the changelog file location.

### 3. Forgetting `context` Filtering

If seed data runs in production because you forgot to set contexts, you will learn about it the hard way. Always tag non-production data changesets and configure `spring.liquibase.contexts` per environment.

### 4. Lock Table Stuck

If a migration is interrupted, the `databasechangeloglock` row may remain locked. Clear it only after confirming no other process is running migrations:

```bash
$ liquibase releaseLocks --url=...
```

### 5. Hibernate `ddl-auto: update`

Never combine Liquibase with `ddl-auto: update`. Either Liquibase owns the schema, or Hibernate does. Running both leads to drift and silent conflicts.

## A Minimal Production Checklist

Before deploying Liquibase in production:

- [ ] Set `spring.jpa.hibernate.ddl-auto` to `validate` or `none`
- [ ] Pin Liquibase dependency versions in `pom.xml` or `build.gradle`
- [ ] Run migrations in CI before the application starts, or rely on application startup with a lock timeout
- [ ] Tag seed and environment-specific changesets with `context`
- [ ] Add rollback blocks to risky changesets
- [ ] Keep a backup before deploying schema migrations
- [ ] Add an integration test with Testcontainers

## Conclusion

Liquibase and Spring Boot work well together once you let Liquibase own the schema and Hibernate own the object mapping. The combination of YAML changelogs, contexts, and Testcontainers integration tests gives you a migration workflow that is reviewable, repeatable, and safe to run in production.

If you are evaluating Flyway instead, I compared both tools in detail in [Flyway vs Liquibase](./flyway-vs-liquibase-database-migrations-java-comparison/). Pick the tool that fits your team, but pick one. Running database changes manually is the only option that is guaranteed to fail.

## References

- [Liquibase Documentation](https://docs.liquibase.com/)
- [Liquibase YAML Changelog Format](https://docs.liquibase.com/concepts/changelogs/yaml-format.html)
- [Liquibase loadData Change Type](https://docs.liquibase.com/change-types/load-data.html)
- [Spring Boot Reference: Data Migration](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#howto.data-initialization.migration-tool.liquibase)
- [Testcontainers PostgreSQL Module](https://java.testcontainers.org/modules/databases/postgres/)
- [Flyway vs Liquibase on This Blog](./flyway-vs-liquibase-database-migrations-java-comparison/)
