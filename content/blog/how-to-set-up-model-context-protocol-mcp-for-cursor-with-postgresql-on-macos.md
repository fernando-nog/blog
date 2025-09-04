---
title: "How to Set Up Model Context Protocol (MCP) for Cursor with PostgreSQL on macOS"
date: "2025-09-04"
description: "Learn how to configure Model Context Protocol (MCP) for Cursor to seamlessly interact with PostgreSQL databases using Docker. Complete guide with automated setup and best practices."
tags: ["cursor", "mcp", "postgresql", "docker", "ai", "development"]
---

## Summary

This guide walks you through setting up Model Context Protocol (MCP) for Cursor IDE with PostgreSQL using Docker. You'll learn what MCP is, how to configure it for database interactions, and implement both basic and advanced setups with automated scripts. By the end, you'll have a fully functional MCP configuration that enables Cursor's AI to directly query and analyze your PostgreSQL databases.

## What is Model Context Protocol (MCP)?

**Model Context Protocol (MCP) is an open standard developed by Anthropic** that enables seamless integration between large language models (LLMs) and external data sources or tools. It standardizes how applications provide context to AI models, creating a bridge between your development environment and various data sources.

### Key Benefits of MCP:

- **Standardization**: Unified protocol for connecting AI models with databases, APIs, and tools
- **Real-time Context**: AI can access live data rather than relying on outdated training information  
- **Security**: Secure, bidirectional connections with proper authentication and access controls
- **Flexibility**: Custom integrations while maintaining ecosystem compatibility
- **Enhanced Productivity**: Direct database queries and analysis within your IDE

In Cursor, MCP enables the AI assistant to directly interact with your databases, analyze schemas, write optimized queries, and provide data-driven insights without leaving your development environment.

## Setting Up MCP with Basic Configuration

The simplest way to configure MCP for PostgreSQL is through Cursor's settings configuration. This approach provides immediate access to your database from within the IDE.

### Prerequisites

**First, ensure you have Docker installed on your macOS system:**

```bash
# Install Docker Desktop for macOS
# Download from: https://www.docker.com/products/docker-desktop/

# Verify Docker installation
$ docker --version
$ docker-compose --version
```

**Set up PostgreSQL using Docker Compose:**

Create a `docker-compose.yml` file in your project directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: postgres-cursor
    restart: unless-stopped
    environment:
      POSTGRES_DB: cursor_dev
      POSTGRES_USER: cursor_user
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_MULTIPLE_DATABASES: cursor_dev,cursor_test,cursor_prod
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    networks:
      - cursor-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cursor_user -d cursor_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local

networks:
  cursor-network:
    driver: bridge
```

**Create an initialization script** `init-db.sh` to set up multiple databases:

```bash
#!/bin/bash
set -e

# Create additional databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE cursor_test;
    CREATE DATABASE cursor_prod;
    
    GRANT ALL PRIVILEGES ON DATABASE cursor_test TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE cursor_prod TO $POSTGRES_USER;
    
    -- Create some example schemas
    \c cursor_dev;
    CREATE SCHEMA IF NOT EXISTS app_schema;
    GRANT ALL ON SCHEMA app_schema TO $POSTGRES_USER;
    
    \c cursor_test;
    CREATE SCHEMA IF NOT EXISTS app_schema;
    GRANT ALL ON SCHEMA app_schema TO $POSTGRES_USER;
    
    \c cursor_prod;
    CREATE SCHEMA IF NOT EXISTS app_schema;
    GRANT ALL ON SCHEMA app_schema TO $POSTGRES_USER;
EOSQL
```

**Start the PostgreSQL service:**

```bash
# Make the init script executable
$ chmod +x init-db.sh

# Start PostgreSQL with Docker Compose
$ docker-compose up -d

# Verify the service is running
$ docker-compose ps

# Check the logs
$ docker-compose logs postgres

# Wait for PostgreSQL to be ready
$ docker-compose exec postgres pg_isready -U cursor_user -d cursor_dev
```


### Basic MCP Configuration

**To configure MCP for PostgreSQL, you need to modify Cursor's settings file** located at `~/Library/Application Support/Cursor/User/settings.json`:

```json
{
  "mcp": {
    "mcpServers": {
      "postgres": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_secure_password@localhost:5432/cursor_dev"
        ]
      }
    }
  }
}
```

This configuration establishes a direct connection to your local PostgreSQL instance.

You can also set up multiple database connections by adding additional server configurations:

```json
{
  "mcp": {
    "mcpServers": {
      "postgres_dev": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_secure_password@localhost:5432/cursor_dev"
        ]
      },
      "postgres_test": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_secure_password@localhost:5432/cursor_test"
        ]
      },
      "postgres_prod": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_secure_password@localhost:5432/cursor_prod"
        ]
      }
    }
  }
}
```


### Advanced Connection Options

**For production environments, you may need additional connection parameters:**

```json
{
  "mcp": {
    "mcpServers": {
      "postgres": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_secure_password@localhost:5432/cursor_dev?sslmode=require&connect_timeout=30"
        ],
        "env": {
          "PGPASSWORD": "your_secure_password",
          "PGSSLMODE": "require"
        }
      }
    }
  }
}
```

**Another useful configuration is setting up connection pooling and timeout options:**

```json
{
  "mcp": {
    "mcpServers": {
      "postgres": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_secure_password@localhost:5432/cursor_dev"
        ],
        "env": {
          "PGCONNECT_TIMEOUT": "30",
          "PGCOMMAND_TIMEOUT": "60",
          "PGOPTIONS": "--search_path=public,app_schema"
        }
      }
    }
  }
}
```

In this case, the connection will timeout after 30 seconds, commands after 60 seconds, and the search path includes both public and app_schema.

### Security Configuration

**Avoid hardcoding credentials in Cursor settings.** Instead, use PostgreSQL's built-in credential management:

Create a `.pgpass` file in your home directory:

```bash
# ~/.pgpass
localhost:5432:cursor_dev:cursor_user:your_secure_password
```

Set proper permissions:
```bash
chmod 600 ~/.pgpass
```

**Update your Cursor MCP configuration to use the password file:**

```json
{
  "mcp": {
    "mcpServers": {
      "postgres": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres", 
          "postgresql://cursor_user@localhost:5432/cursor_dev"
        ]
      }
    }
  }
}
```

The MCP server will automatically use `.pgpass` for authentication, keeping credentials secure.

## Automated Setup with Scripts

For team environments and consistent deployments, automated setup scripts provide better organization and reproducibility.

**Create a setup script for MCP configuration:**

```bash
#!/bin/bash
# setup_mcp.sh

# Install MCP PostgreSQL server
echo "Installing MCP PostgreSQL server..."
npm install -g @modelcontextprotocol/server-postgres

# Create Cursor settings directory if it doesn't exist
CURSOR_SETTINGS_DIR="$HOME/Library/Application Support/Cursor/User"
mkdir -p "$CURSOR_SETTINGS_DIR"

# Backup existing settings
if [ -f "$CURSOR_SETTINGS_DIR/settings.json" ]; then
    cp "$CURSOR_SETTINGS_DIR/settings.json" "$CURSOR_SETTINGS_DIR/settings.json.backup"
fi

# Start PostgreSQL with Docker Compose if not running
if ! docker-compose ps | grep -q "postgres.*Up"; then
    echo "Starting PostgreSQL with Docker Compose..."
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    until docker-compose exec postgres pg_isready -U cursor_user -d cursor_dev; do
        sleep 2
    done
fi

# Create MCP configuration
cat > "$CURSOR_SETTINGS_DIR/mcp-config.json" << 'EOF'
{
  "mcp": {
    "mcpServers": {
      "postgres_dev": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_secure_password@localhost:5432/cursor_dev"
        ],
        "env": {
          "PGCONNECT_TIMEOUT": "30",
          "PGCOMMAND_TIMEOUT": "120"
        }
      },
      "postgres_test": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_secure_password@localhost:5432/cursor_test"
        ]
      },
      "postgres_prod": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_secure_password@localhost:5432/cursor_prod"
        ]
      }
    }
  }
}
EOF

echo "MCP configuration created at $CURSOR_SETTINGS_DIR/mcp-config.json"
echo "Please merge this configuration with your existing settings.json"
```

In this configuration, two database connections are established with different timeout settings. The local development database has extended timeouts for complex queries, while the test database uses default settings.

**Complete Docker Compose setup automation:**

```bash
#!/bin/bash
# setup_complete.sh

# Create project directory structure
mkdir -p cursor-mcp-project
cd cursor-mcp-project

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: postgres-cursor
    restart: unless-stopped
    environment:
      POSTGRES_DB: cursor_dev
      POSTGRES_USER: cursor_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-your_secure_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    networks:
      - cursor-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cursor_user -d cursor_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local

networks:
  cursor-network:
    driver: bridge
EOF

# Create initialization script
cat > init-db.sh << 'EOF'
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE cursor_test;
    CREATE DATABASE cursor_prod;
    
    GRANT ALL PRIVILEGES ON DATABASE cursor_test TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE cursor_prod TO $POSTGRES_USER;
    
    \c cursor_dev;
    CREATE SCHEMA IF NOT EXISTS app_schema;
    GRANT ALL ON SCHEMA app_schema TO $POSTGRES_USER;
    
    \c cursor_test;
    CREATE SCHEMA IF NOT EXISTS app_schema;
    GRANT ALL ON SCHEMA app_schema TO $POSTGRES_USER;
    
    \c cursor_prod;
    CREATE SCHEMA IF NOT EXISTS app_schema;
    GRANT ALL ON SCHEMA app_schema TO $POSTGRES_USER;
EOSQL
EOF

# Make init script executable
chmod +x init-db.sh

# Create .env file
cat > .env << 'EOF'
POSTGRES_PASSWORD=your_secure_password
COMPOSE_PROJECT_NAME=cursor-mcp
EOF

echo "Docker Compose setup completed!"
echo "To start PostgreSQL: docker-compose up -d"
echo "To check status: docker-compose ps"
echo "To view logs: docker-compose logs postgres"
```

**To execute the automated setup:**

```bash
$ chmod +x setup_complete.sh setup_mcp.sh
$ ./setup_complete.sh
$ cd cursor-mcp-project
$ docker-compose up -d
$ cd .. && ./setup_mcp.sh
```


## Verification and Testing

After configuring MCP, you can verify the setup using several methods within Cursor.

**Use Cursor's built-in MCP testing features:**

1. Open Cursor
2. Press `Cmd+Shift+P` to open the command palette
3. Type "MCP: Test Connection" and select your PostgreSQL server
4. Verify the connection status in the output panel

You can also test database queries directly in Cursor's chat interface:

```
@postgres_local Can you show me the tables in this database?

@postgres_local What's the schema for the users table?

@postgres_local Run this query: SELECT COUNT(*) FROM users WHERE created_at > '2024-01-01';
```

For connection verification with detailed logging:

```json
{
  "mcp": {
    "mcpServers": {
      "postgres": {
        "command": "npx",
        "args": [
          "@modelcontextprotocol/server-postgres",
          "postgresql://cursor_user:your_password@localhost:5432/cursor_dev"
        ],
        "env": {
          "DEBUG": "mcp:*",
          "PGDEBUG": "1"
        }
      }
    }
  }
}
```

## Best Practices

When implementing MCP for PostgreSQL, consider these best practices:

**Analyze database requirements**: Understand your application's data access patterns before configuring connections **Use connection pooling**: Configure appropriate connection limits to prevent database overload **Implement proper security**: Never store passwords in plain text; use environment variables or credential files **Set up multiple environments**: Configure separate connections for development, testing, and production **Monitor performance**: Regularly check query performance and connection health **Use schema-specific access**: Grant only necessary permissions to the MCP user **Configure appropriate timeouts**: Set reasonable connection and query timeout values

## Conclusion

In this article, we explored comprehensive ways to set up Model Context Protocol for Cursor with PostgreSQL on macOS, including basic configuration, security considerations, and automated deployment scripts. We covered both manual setup through Cursor's settings and automated configuration using shell scripts, and demonstrated how to verify and monitor your MCP connections.

Effective MCP configuration is essential for maintaining productive, secure database interactions within your development workflow, especially when working with complex database schemas and multiple environments. These techniques will help you leverage Cursor's AI capabilities while maintaining robust database connectivity in your projects.

**Having trouble with Docker Compose PostgreSQL?** If you're encountering connection issues or permission errors, make sure your services are running with `docker-compose ps` and check the container logs with `docker-compose logs postgres` for detailed error information. You can also restart the service with `docker-compose restart postgres`.

## Official References and Resources

- **[Model Context Protocol Documentation](https://modelcontextprotocol.io/docs/concepts)** - Official MCP documentation with architecture and implementation details
- **[Anthropic's MCP Introduction](https://docs.anthropic.com/en/docs/mcp)** - Comprehensive overview from the protocol's creators
- **[MCP GitHub Repository](https://github.com/modelcontextprotocol)** - Source code, SDKs, and community discussions
- **[Cursor Documentation](https://docs.cursor.com/)** - Official Cursor IDE documentation
- **[PostgreSQL MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)** - Official PostgreSQL MCP server implementation
- **[Docker PostgreSQL Official Image](https://hub.docker.com/_/postgres)** - Official PostgreSQL Docker image documentation

