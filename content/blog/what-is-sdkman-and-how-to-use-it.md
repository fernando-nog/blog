---
title: "What is SDKMAN and How to Use It for Managing Development Tools"
date: "2025-09-18"
description: "Learn how SDKMAN simplifies managing multiple versions of Java, Maven, Gradle, and other development tools on Unix-based systems with practical examples."
tags: ["java", "development-tools", "version-management", "sdkman", "devops"]
---

Picture this: you're working on multiple projects, each requiring different versions of Java, Maven, or Gradle. You're constantly switching between versions, manually updating environment variables, and dealing with PATH conflicts. Sound familiar? If you've ever struggled with managing multiple SDK versions on your development machine, SDKMAN is about to become your new best friend.

SDKMAN (Software Development Kit Manager) is a powerful command-line tool that simplifies the installation, management, and switching between multiple versions of software development kits on Unix-based systems (macOS, Linux, WSL). It's like having a personal assistant for all your development tools.

## Why SDKMAN Matters

Before SDKMAN, managing multiple versions of development tools was a nightmare. You'd have to:

- Manually download and install different versions
- Manually update environment variables
- Deal with PATH conflicts
- Remember where you installed each version
- Manually switch between versions for different projects

SDKMAN eliminates all this complexity with a simple, unified interface. It supports over 30 different SDKs including Java, Groovy, Scala, Kotlin, Gradle, Maven, Spring Boot, and many more.

## Installing SDKMAN

Getting started with SDKMAN is incredibly simple, but the process varies slightly between macOS and Linux. Let's walk through both:

### macOS Installation

On macOS, SDKMAN works perfectly with both Intel and Apple Silicon Macs. Open Terminal and run:

```bash
curl -s "https://get.sdkman.io" | bash
```

After installation completes, initialize SDKMAN in your current shell session:

```bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
```

Since macOS uses Zsh by default (macOS Catalina and later), add SDKMAN to your Zsh profile:

```bash
echo 'export SDKMAN_DIR="$HOME/.sdkman"' >> ~/.zshrc
echo '[[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]] && source "$HOME/.sdkman/bin/sdkman-init.sh"' >> ~/.zshrc
```

If you're using Bash on macOS, use `.bash_profile` instead:

```bash
echo 'export SDKMAN_DIR="$HOME/.sdkman"' >> ~/.bash_profile
echo '[[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]] && source "$HOME/.sdkman/bin/sdkman-init.sh"' >> ~/.bash_profile
```

### Linux Installation

On Linux distributions (Ubuntu, Debian, CentOS, Fedora, etc.), the installation is similar but you'll typically use Bash:

```bash
curl -s "https://get.sdkman.io" | bash
```

Initialize SDKMAN in your current session:

```bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
```

Add SDKMAN to your Bash profile:

```bash
echo 'export SDKMAN_DIR="$HOME/.sdkman"' >> ~/.bashrc
echo '[[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]] && source "$HOME/.sdkman/bin/sdkman-init.sh"' >> ~/.bashrc
```

If you're using Zsh on Linux, use `.zshrc`:

```bash
echo 'export SDKMAN_DIR="$HOME/.sdkman"' >> ~/.zshrc
echo '[[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]] && source "$HOME/.sdkman/bin/sdkman-init.sh"' >> ~/.zshrc
```

### Verifying Installation

Regardless of your operating system, verify your installation:

```bash
sdk version
```

You should see output showing the installed SDKMAN version. If you get a "command not found" error, restart your terminal or run `source ~/.zshrc` (or `source ~/.bashrc` on Linux).

## Managing Java Versions

Java version management is where SDKMAN really shines. Let's walk through the most common scenarios:

### Listing Available Java Versions

See all available Java versions from various vendors:

```bash
sdk list java
```

This shows versions from OpenJDK, Oracle, Amazon, Eclipse Temurin, and others. The output includes version numbers, vendor information, and installation status.

### Installing Java

Install a specific Java version:

```bash
sdk install java 17.0.8-tem
```

The `-tem` suffix indicates Eclipse Temurin (formerly AdoptOpenJDK). You can also install the latest version:

```bash
sdk install java 17.0.8-tem
```

### Switching Between Java Versions

**Temporarily** (for current session only):
```bash
sdk use java 17.0.8-tem
```

**Permanently** (set as default):
```bash
sdk default java 17.0.8-tem
```

Check your current Java version:
```bash
java -version
```

## Managing Other Development Tools

SDKMAN isn't just for Java. Here's how to manage other popular tools:

### Maven

```bash
# List available Maven versions
sdk list maven

# Install latest Maven
sdk install maven

# Install specific version
sdk install maven 3.9.5

# Switch to specific version
sdk use maven 3.9.5
```

### Gradle

```bash
# List available Gradle versions
sdk list gradle

# Install latest Gradle
sdk install gradle

# Install specific version
sdk use gradle 8.5
```

### Spring Boot CLI

```bash
# Install Spring Boot CLI
sdk install springboot

# Use specific version
sdk use springboot 3.2.0
```

## Project-Specific Environment Management

One of SDKMAN's most powerful features is automatic environment switching based on project requirements. This is perfect for teams working on multiple projects with different tool versions.

### Setting Up Project-Specific SDKs

Navigate to your project directory and initialize SDKMAN environment:

```bash
cd /path/to/your/project
sdk env init
```

This creates a `.sdkmanrc` file where you can specify the required SDK versions:

```bash
# .sdkmanrc
java=17.0.8-tem
maven=3.9.5
gradle=8.5
```

### Enabling Auto-Environment Switching

To automatically switch to the specified versions when entering the project directory, enable auto-env:

```bash
sdk config
```

Set `sdkman_auto_env=true` in the configuration file, or run:

```bash
sdk env install
```

Now, whenever you `cd` into a directory with a `.sdkmanrc` file, SDKMAN automatically switches to the specified versions.

## Essential SDKMAN Commands

Here are the most useful commands you'll use daily:

### General Commands

```bash
# List all available SDKs
sdk list

# List installed SDKs
sdk current

# Update SDKMAN itself
sdk selfupdate

# Check for SDK updates
sdk upgrade

# Upgrade specific SDK
sdk upgrade java
```

### Installation and Removal

```bash
# Install latest version
sdk install java

# Install specific version
sdk install java 11.0.20-tem

# Remove specific version
sdk uninstall java 11.0.20-tem

# Remove all versions of an SDK
sdk uninstall java
```

### Version Management

```bash
# Use version temporarily
sdk use java 17.0.8-tem

# Set as default
sdk default java 17.0.8-tem

# Show current version
sdk current java
```

## Real-World Example: Multi-Project Setup

Let's say you're working on three different projects:

**Project A** (Legacy): Java 8, Maven 3.6.3
**Project B** (Current): Java 17, Maven 3.9.5, Gradle 8.5
**Project C** (Experimental): Java 21, Gradle 8.6

Here's how you'd set this up:

```bash
# Install all required versions
sdk install java 8.0.392-tem
sdk install java 17.0.8-tem
sdk install java 21.0.1-tem
sdk install maven 3.6.3
sdk install maven 3.9.5
sdk install gradle 8.5
sdk install gradle 8.6

# Set up project environments
cd /path/to/project-a
sdk env init
echo "java=8.0.392-tem" > .sdkmanrc
echo "maven=3.6.3" >> .sdkmanrc

cd /path/to/project-b
sdk env init
echo "java=17.0.8-tem" > .sdkmanrc
echo "maven=3.9.5" >> .sdkmanrc
echo "gradle=8.5" >> .sdkmanrc

cd /path/to/project-c
sdk env init
echo "java=21.0.1-tem" > .sdkmanrc
echo "gradle=8.6" >> .sdkmanrc
```

Now, when you switch between projects, SDKMAN automatically handles the version switching.

## Troubleshooting Common Issues

### SDKMAN Not Found After Installation

If you get "command not found" after installation:

```bash
# Reload your shell profile
source ~/.zshrc  # or ~/.bashrc

# Or restart your terminal
```

### Permission Issues

If you encounter permission errors:

```bash
# Make sure SDKMAN directory is owned by your user
sudo chown -R $(whoami) ~/.sdkman
```

### Corrupted Installation

If SDKMAN gets corrupted:

```bash
# Remove and reinstall
rm -rf ~/.sdkman
curl -s "https://get.sdkman.io" | bash
```

## Best Practices

1. **Use `.sdkmanrc` files** for project-specific versions
2. **Enable auto-env** for seamless project switching
3. **Regularly update** SDKMAN and your SDKs
4. **Document versions** in your project README
5. **Use specific versions** in production environments
6. **Clean up unused versions** periodically

## Conclusion

SDKMAN transforms the often painful process of managing multiple development tool versions into a smooth, automated experience. Whether you're a Java developer juggling different projects or a DevOps engineer managing multiple environments, SDKMAN will save you countless hours and headaches.

The key benefits are clear:
- **Simplified installation** of development tools
- **Easy version switching** between projects
- **Automatic environment management** with `.sdkmanrc` files
- **Consistent tooling** across team members
- **Reduced configuration overhead**

Start with installing SDKMAN and managing your Java versions. Once you see how effortless it is, you'll wonder how you ever managed without it. Your future self (and your teammates) will thank you for the consistency and reliability it brings to your development workflow.

## References

- [SDKMAN Official Website](https://sdkman.io/)
- [SDKMAN Installation Guide](https://sdkman.io/install)
- [SDKMAN Usage Guide](https://sdkman.io/usage)

