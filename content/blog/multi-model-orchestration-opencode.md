---
title: "Multi-Model Orchestration with OpenCode: Building Your AI Development Team"
date: "2026-07-29"
description: "A practical guide to configuring different AI models for different roles in OpenCode — planning, implementing, reviewing, and researching — all in a single session."
tags: ["AI", "OpenCode", "Agents", "LLM", "Coding", "DeveloperTools"]
---

You have probably noticed that not all AI models are equally good at everything. Claude is great at reasoning through architecture. GPT-5.6 Sol excels at generating code. A smaller model like Haiku is fast and cheap for quick reviews. Kimi K2.7 Code is purpose-built for coding at a fraction of the cost.

What if you could use all of them in the same session, each doing what it does best?

OpenCode's agent system lets you do exactly that. You can configure multiple specialized agents, each with its own model, its own system prompt, and its own permissions. One agent plans. Another implements. A third reviews. And a fourth researches external documentation. All orchestrated by a primary agent that delegates work intelligently.

## How OpenCode Agents Work

OpenCode has two types of agents: **primary agents** and **subagents**.

**Primary agents** are the ones you interact with directly. You switch between them with the **Tab** key. OpenCode ships with two built-in primary agents: **Build** (full tool access) and **Plan** (read-only, for analysis).

**Subagents** are specialized assistants that primary agents can invoke for specific tasks. OpenCode ships with three built-in subagents: **General** (full access, multi-step tasks), **Explore** (read-only, codebase search), and **Scout** (read-only, external docs research).

The key insight: every agent can have its own model. You are not stuck with one model for everything.

## The Multi-Model Team Setup

Here is a practical configuration that mirrors how a real development team works. We will create four custom agents, each optimized for a specific role.

### The Architect (Planner)

Uses a reasoning-heavy model to analyze requirements and design solutions. It should never modify code — only read and think.

```markdown
---
description: Analyzes requirements and creates implementation plans
mode: subagent
model: openai/gpt-5.6-sol
permission:
  edit: deny
  bash: deny
---

You are a software architect. When given a task:

1. Read the relevant code to understand the current state
2. Identify what needs to change and why
3. Propose a step-by-step implementation plan
4. Flag potential risks, edge cases, and affected areas

Do not write code. Focus on the plan. Be specific about which files need to change and in what order.
```

Save this as `.opencode/agents/architect.md`.

Tip: You can also create agents interactively with `opencode agent create` instead of writing the markdown files by hand.

### The Implementer (Builder)

Uses a coding-specialized model to write the actual code. This is where Kimi K2.7 Code shines — it is purpose-built for code generation at a fraction of the cost of frontier models.

If Moonshot/Kimi is not auto-detected as a provider, add it to your `opencode.json` first:

```json
{
  "provider": {
    "moonshot": {
      "models": {
        "kimi-k2.7-code": {}
      },
      "options": {
        "apiKey": "{env:MOONSHOT_API_KEY}"
      }
    }
  }
}
```

Then create the agent:

```markdown
---
description: Implements code changes based on an approved plan
mode: subagent
model: moonshot/kimi-k2.7-code
permission:
  edit: allow
  bash: allow
---

You are a senior software engineer. Your job is implementation:

1. Follow the plan provided by the architect
2. Write clean, well-structured code that follows existing patterns
3. Add tests for new functionality
4. Run the test suite and fix any failures
5. Report what you changed and why

Stay focused on the implementation. Do not redesign the architecture unless you find a critical flaw.
```

Save this as `.opencode/agents/implementer.md`.

### The Reviewer

Uses a fast, cheap model to review code changes. It should never modify code — only read and provide feedback.

```markdown
---
description: Reviews code changes for quality, security, and best practices
mode: subagent
model: anthropic/claude-haiku-4-20250514
permission:
  edit: deny
  bash:
    "git diff *": allow
    "git log *": allow
    "*": deny
---

You are a code reviewer. After implementation is complete:

1. Review the git diff to see what changed
2. Check for bugs, edge cases, and security issues
3. Verify the code follows project conventions
4. Suggest improvements without making changes

Be constructive. Point out what is good as well as what needs work.
```

Save this as `.opencode/agents/reviewer.md`.

### The Researcher

Uses a model with web access to look up documentation, APIs, and external references.

```markdown
---
description: Researches external documentation, APIs, and dependencies
mode: subagent
model: openai/gpt-5.6-terra
permission:
  edit: deny
  bash: deny
  webfetch: allow
---

You are a technical researcher. When asked to investigate something:

1. Search for official documentation and reliable sources
2. Summarize findings clearly with links
3. Note version-specific details and deprecation warnings
4. Flag conflicting information from different sources

Do not modify any files. Your job is to gather information, not to act on it.
```

Save this as `.opencode/agents/researcher.md`.

## The Orchestrator: Tying It All Together

Now we need a primary agent that knows how to delegate to these specialists. We will configure the Build agent to use a strong reasoning model and give it permission to invoke our subagents.

Add this to your `opencode.json` (merge with your existing config, do not replace it):

```json
{
  "agent": {
    "build": {
      "model": "anthropic/claude-sonnet-4-5",
      "permission": {
        "task": {
          "*": "deny",
          "architect": "allow",
          "implementer": "allow",
          "reviewer": "allow",
          "researcher": "allow"
        }
      }
    }
  }
}
```

This configuration does three things:

1. Sets the Build agent to use Claude Sonnet 4.5 as the orchestrator model
2. Denies access to all subagents by default (`"*": "deny"`)
3. Explicitly allows only our four custom subagents

The orchestrator will now automatically delegate to the right specialist based on the task. When you ask it to implement a feature, it will invoke the architect first, then the implementer, then the reviewer — each using the model you configured for that role.

## How to Use It in Practice

Here is a typical workflow:

1. **Start a session** with OpenCode in your project:

```bash
$ opencode
```

2. **Describe the task** to the Build agent. It will automatically plan the work:

```
Add a rate-limiting middleware to the API. It should use Redis for tracking
and support configurable limits per route. Follow the existing middleware
pattern in @src/middleware/auth.ts.
```

3. **The orchestrator delegates**. You will see it invoke the architect subagent to read the codebase and create a plan. Then the implementer writes the code. Then the reviewer checks the diff.

4. **Navigate between sessions**. Use these keybinds to move between the parent session and child subagent sessions:

   - `<Leader>+Down` — enter the first child session
   - **Right** — cycle to the next child session
   - **Left** — cycle to the previous child session
   - **Up** — return to the parent session

5. **Review and iterate**. You can read the reviewer's feedback in its child session, then ask the implementer to address specific issues.

## Manual Invocation with @ Mentions

You can also invoke subagents manually by typing `@` followed by the agent name:

```
@researcher what is the latest Redis rate-limiting pattern for Node.js?
@architect review the authentication flow in @src/middleware/auth.ts
@reviewer check the last commit for security issues
```

This is useful when you want to use a specific specialist without going through the orchestrator.

## Why This Matters

Using a single model for everything is like having one developer do architecture, implementation, code review, and research. It works, but it is not optimal.

A multi-model setup gives you:

- **Better planning**: A reasoning-heavy model like GPT-5.6 Sol or Claude Sonnet thinks deeper about architecture
- **Cheaper implementation**: A coding-specialized model like Kimi K2.7 Code costs 3-5x less per token than frontier models
- **Faster reviews**: A small model like Haiku reviews code in seconds at near-zero cost
- **Focused research**: A model with web access can look up documentation without cluttering the main session

And because each agent has its own permissions, you get safety for free. The architect and reviewer cannot modify files. The researcher cannot run commands. Only the implementer has full write access.

## Taking It Further

Here are a few ways to extend this setup:

**Add an image analyst** for UI work:

```markdown
---
description: Analyzes screenshots and UI mockups
mode: subagent
model: openai/gpt-5.6-sol
permission:
  edit: deny
  bash: deny
---

You analyze UI screenshots and mockups. Describe the layout, components,
styling patterns, and interactions you see. Suggest how to implement the
design using the project's existing component library.
```

**Add a test writer** that only writes test files:

```json
{
  "agent": {
    "test-writer": {
      "description": "Writes tests for existing code",
      "mode": "subagent",
      "model": "moonshot/kimi-k2.7-code",
      "permission": {
        "edit": {
          "*.test.*": "allow",
          "*.spec.*": "allow",
          "*": "deny"
        },
        "bash": {
          "npm test *": "allow",
          "*": "deny"
        }
      }
    }
  }
}
```

**Control nesting depth** to prevent infinite delegation chains:

```json
{
  "subagent_depth": 2
}
```

This allows primary agents to launch subagents, and those subagents can launch one more level, but no deeper.

## The Bottom Line

OpenCode's agent system turns your terminal into a development team. You are not just talking to one AI — you are orchestrating a group of specialists, each using the best model for its role.

The configuration takes 10 minutes to set up. The productivity gain lasts as long as you write code.

### References

- [OpenCode Agents Documentation](https://opencode.ai/docs/agents/)
- [OpenCode Models Configuration](https://opencode.ai/docs/models/)
- [OpenCode Config Reference](https://opencode.ai/docs/config/)
- [OpenCode Agent Skills](https://opencode.ai/docs/skills/)
