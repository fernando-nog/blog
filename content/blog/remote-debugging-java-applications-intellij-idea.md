---
title: "Remote Debugging Java Applications with IntelliJ IDEA"
date: "2025-10-24"
description: "Learn how to debug Java applications running on remote servers using IntelliJ IDEA's remote debugging capabilities."
tags: ["java", "intellij", "debugging", "devops"]
---

Picture this: your application works perfectly on your local machine but breaks in production. The logs aren't helpful enough, and you need to inspect the actual execution flow. Welcome to the world of remote debugging.

Remote debugging lets you attach IntelliJ IDEA's debugger to a Java application running on another machine (or even locally) and debug it as if it were running right on your IDE. Let's learn how to set this up.

## Why Remote Debugging?

Sometimes you need to debug an application that:

- Runs in a specific environment (staging, testing servers)
- Requires special network configurations
- Has issues that only occur on remote machines
- Needs to interact with other services in a particular infrastructure

Remote debugging saves you from deploying endless logging statements and rebuilding your application repeatedly.

## How Remote Debugging Works

The process is straightforward:

1. **Start your Java application with special JVM debug parameters** that enable the debug agent
2. **Configure IntelliJ IDEA to attach** to the running application
3. **Debug normally** with breakpoints, stepping, and variable inspection

## Setting Up Remote Debugging

### Step 1: Configure Your Java Application

First, you need to start your Java application with the debug agent enabled. Add these JVM options when launching your app:

```bash
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005
```

**What do these parameters mean?**

- `transport=dt_socket` - Uses socket transport for the debugger connection
- `server=y` - The JVM will listen for incoming debugger connections
- `suspend=n` - The application starts immediately (use `suspend=y` to wait for debugger)
- `address=*:5005` - Listens on all interfaces at port 5005

**Example with a JAR file:**

```bash
$ java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar myapp.jar
```

**Example with Spring Boot Maven:**

```bash
$ mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
```

When the application starts, you should see:

```
Listening for transport dt_socket at address: 5005
```

### Step 2: Configure IntelliJ IDEA

Now let's set up the debugger in IntelliJ IDEA:

1. **Open Run/Debug Configurations** (`Run > Edit Configurations` or `Alt+Shift+F10` then `0`)

2. **Click the `+` button** and select **Remote JVM Debug**

3. **Configure the connection:**
   - **Name:** Choose a descriptive name like "Remote Debug Production"
   - **Host:** The IP address or hostname of the remote machine (use `localhost` for local debugging)
   - **Port:** Must match the port in your JVM options (default: `5005`)
   - **Use module classpath:** Select your project module

4. **Click Apply and OK**

### Step 3: Start Debugging

1. **Set breakpoints** in your code where you want to pause execution

2. **Start the debug configuration** (`Alt+Shift+F9` or click the debug icon and select your remote debug configuration)

3. **IntelliJ will connect** to your running application

4. **Debug normally** - use stepping, evaluate expressions, inspect variables, just like local debugging

## Important Security Considerations

**Never leave debug ports open in production!** The debug agent allows full control over your application's execution and can expose sensitive data.

**Best practices:**

- Only enable debugging in development and staging environments
- Use `suspend=y` when you need to debug startup issues
- Restrict debug port access using firewalls
- Use SSH tunneling for remote debugging over untrusted networks:

```bash
$ ssh -L 5005:localhost:5005 user@remote-server
```

Then connect IntelliJ to `localhost:5005` - the connection will be securely tunneled to the remote server.

## Troubleshooting Common Issues

**Connection refused?**
- Check if the application is running with debug parameters
- Verify the port isn't blocked by a firewall
- Ensure the address binding allows external connections (`*:5005` vs `localhost:5005`)

**Breakpoints not working?**
- Verify you have the exact same source code as the running application
- Ensure the application was compiled with debug information enabled
- Check that the classpath in your debug configuration matches your project

**Connection drops randomly?**
- Check network stability
- Verify no timeout settings on intermediate firewalls/proxies
- Consider using SSH tunneling for more stable connections

## Closing the Debug Session

When you're done debugging:

- **Disconnect:** Stops the debug session but keeps the application running
- **Terminate:** Stops both the debugger and the application

Choose **Disconnect** if you want the application to continue running normally after debugging.

## My Recommendations

Remote debugging is incredibly powerful, but use it wisely:

1. **Prefer local reproduction** when possible - it's faster and doesn't affect running systems
2. **Use meaningful breakpoint conditions** to avoid pausing on every iteration in busy applications
3. **Keep debug sessions short** to minimize impact on running systems
4. **Document your debug configuration** in your project's README for team members

Remote debugging has saved me countless hours hunting down environment-specific bugs. Once you get comfortable with it, you'll wonder how you ever debugged production issues without it.

## References

- [IntelliJ IDEA Remote Debug Tutorial](https://www.jetbrains.com/help/idea/tutorial-remote-debug.html)
- [Java Debug Wire Protocol (JDWP)](https://docs.oracle.com/javase/8/docs/technotes/guides/jpda/jdwp-spec.html)

