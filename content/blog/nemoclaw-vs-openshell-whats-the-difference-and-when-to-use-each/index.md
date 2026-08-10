---
title: "NemoClaw vs OpenShell: What's the Difference and When to Use Each"
date: "2026-08-10"
description: "NVIDIA has two open-source tools for running AI agents securely: OpenShell and NemoClaw. Here is what each does, how they relate, and which one to pick."
tags:
  [
    "nvidia",
    "openshell",
    "nemoclaw",
    "ai agents",
    "sandbox",
    "security",
    "devtools",
  ]
---

NVIDIA has two open-source projects for running AI coding agents securely, and the naming does not make the relationship obvious. OpenShell is a sandbox runtime. NemoClaw is a management layer that runs on top of it. If you are trying to decide which one to install, the answer depends on what you are trying to do.

This post explains what each tool does, how they fit together, and when you should reach for one versus the other.

## What is OpenShell?

[OpenShell](https://github.com/NVIDIA/OpenShell) is a safe, private runtime for autonomous AI agents. It creates isolated sandbox environments where agents like Claude Code, OpenCode, Codex, and Copilot can run without access to your files, credentials, or network unless you explicitly allow it.

It works by running each agent inside its own container. A lightweight gateway coordinates sandbox lifecycle, and every outbound connection goes through a policy engine that decides whether to allow, route, or deny it. Policies are declarative YAML files — you write what the agent can access, and OpenShell enforces it at the filesystem, network, process, and inference layers.

OpenShell is built in Rust, has 8.1k stars on GitHub, and is licensed under Apache 2.0. It is currently alpha software, meaning it is functional but still rough around the edges. The project explicitly describes itself as "single-player mode" — one developer, one environment, one gateway.

Key facts:

- **Language:** Rust
- **License:** Apache 2.0
- **Stars:** 8.1k
- **Status:** Alpha
- **Installs via:** shell script (`install.sh`) or PyPI (`uv tool install openshell`)
- **Supported agents:** Claude Code, OpenCode, Codex, Copilot, Ollama, Pi
- **Runtimes:** Docker, Podman, MicroVM, Kubernetes (experimental)

## What is NemoClaw?

[NemoClaw](https://github.com/NVIDIA/NemoClaw) is a reference stack for running AI agents more securely inside OpenShell sandboxes. It is not a separate runtime — it is a layer on top of OpenShell that adds guided onboarding, managed inference, network policy presets, snapshots, and lifecycle operations through its own CLI.

Think of OpenShell as the engine and NemoClaw as the dashboard. OpenShell gives you the sandbox primitives. NemoClaw gives you a curated experience: it picks sensible defaults, configures inference providers, sets up network policies, and provides agent-specific aliases so you do not have to wire everything together yourself.

NemoClaw supports three agents out of the box: OpenClaw (default), Hermes, and LangChain Deep Agents Code. It is built in TypeScript, has 22.1k stars, and is also Apache 2.0 licensed. Like OpenShell, it is alpha software.

Key facts:

- **Language:** TypeScript
- **License:** Apache 2.0
- **Stars:** 22.1k
- **Status:** Alpha
- **Installs via:** shell script (`install.sh`)
- **Supported agents:** OpenClaw, Hermes, LangChain Deep Agents Code
- **Requires:** OpenShell running underneath

## How they relate

The relationship is a stack:

```
NemoClaw (management layer)
    ↓
OpenShell (sandbox runtime)
    ↓
Docker / Podman / MicroVM (container runtime)
```

You can use OpenShell without NemoClaw. You cannot use NemoClaw without OpenShell. NemoClaw's installer sets up OpenShell for you if it is not already installed.

This is the most important thing to understand: **NemoClaw is not a replacement for OpenShell. It is a convenience layer on top of it.**

## Feature comparison

| Feature                         | OpenShell                                         | NemoClaw                                 |
| ------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Sandbox isolation               | Yes (filesystem, network, process, inference)     | Yes (inherits from OpenShell)            |
| Declarative YAML policies       | Yes                                               | Yes (adds presets and managed policies)  |
| Managed inference               | Manual setup                                      | Built-in, with provider selection        |
| Agent onboarding                | Manual (you configure everything)                 | Guided installer with presets            |
| CLI                             | `openshell`                                       | `nemoclaw` (with agent-specific aliases) |
| Supported agents                | Claude Code, OpenCode, Codex, Copilot, Ollama, Pi | OpenClaw, Hermes, LangChain Deep Agents  |
| GPU support                     | Experimental                                      | Via OpenShell                            |
| Terminal UI                     | Yes (`openshell term`)                            | No                                       |
| Snapshots                       | No                                                | Yes                                      |
| Network policy hot-reload       | Yes                                               | Yes (via OpenShell)                      |
| BYOC (bring your own container) | Yes                                               | No (uses managed sandbox images)         |

## When to use OpenShell alone

Use OpenShell by itself when:

- **You want full control.** You are comfortable writing YAML policies, configuring providers manually, and managing sandbox lifecycle yourself.
- **You use Claude Code, OpenCode, Codex, or Copilot.** These agents are supported directly by OpenShell without needing NemoClaw.
- **You want the terminal UI.** `openshell term` gives you a real-time dashboard inspired by k9s for monitoring gateways and sandboxes.
- **You need GPU passthrough.** OpenShell supports passing host GPUs into sandboxes for local inference or fine-tuning.
- **You want to bring your own container image.** OpenShell's `--from` flag lets you use community sandboxes or custom Docker images.
- **You are running on Kubernetes.** OpenShell has an experimental Helm chart for cluster deployment.

The trade-off is that you do more work. You write the policies, configure the providers, and manage the sandboxes yourself. For a single developer who knows what they are doing, this is fine. For a team or someone who wants a guided experience, it is friction.

## When to use NemoClaw

Use NemoClaw when:

- **You use OpenClaw, Hermes, or LangChain Deep Agents.** These agents are only supported through NemoClaw, not OpenShell directly.
- **You want a guided setup.** NemoClaw's installer asks you questions, picks sensible defaults, and gets you running faster than configuring OpenShell from scratch.
- **You want managed inference.** NemoClaw handles provider selection, credential injection, and inference routing so you do not have to configure it manually.
- **You need snapshots.** NemoClaw can snapshot sandbox state, which is useful for debugging or reproducing issues.
- **You want network policy presets.** NemoClaw ships with pre-built policies for common scenarios, reducing the amount of YAML you need to write.
- **You are new to AI agent sandboxing.** The guided onboarding lowers the barrier to entry significantly.

The trade-off is that you give up some flexibility. NemoClaw works with a specific set of agents and a specific set of sandbox images. If you need something custom, you may need to drop down to OpenShell.

## Can you use both?

Yes. This is the intended design. You can use OpenShell directly for some workflows (Claude Code in a sandbox) and NemoClaw for others (OpenClaw with managed inference). They share the same underlying OpenShell gateway, so there is no conflict.

A practical setup might look like:

- **OpenShell** for quick, ad-hoc sandboxes with Claude Code or OpenCode.
- **NemoClaw** for your primary coding agent (OpenClaw) with managed inference, snapshots, and preset policies.

## Which one should you start with?

If you are evaluating both tools for the first time:

1. **Start with OpenShell.** Install it, create a sandbox with your existing coding agent, and apply a basic network policy. This teaches you the fundamentals: how sandboxes work, how policies are enforced, and what the gateway does.

2. **Add NemoClaw if you need it.** If you find yourself wanting managed inference, snapshots, or support for OpenClaw/Hermes, install NemoClaw on top. It will use your existing OpenShell installation.

3. **Skip NemoClaw if you do not need it.** If you are happy with Claude Code or OpenCode in a sandbox and do not mind writing your own policies, OpenShell alone is enough.

The bottom line: OpenShell is the foundation. NemoClaw is the convenience. You need the foundation either way. The convenience is optional.

## References

- [OpenShell on GitHub](https://github.com/NVIDIA/OpenShell)
- [NemoClaw on GitHub](https://github.com/NVIDIA/NemoClaw)
- [OpenShell Documentation](https://docs.nvidia.com/openshell/latest/)
- [NemoClaw Documentation](https://docs.nvidia.com/nemoclaw/latest/)
- [OpenShell Community Sandboxes](https://github.com/NVIDIA/OpenShell-Community)
- [NemoClaw Community Examples](https://github.com/NVIDIA/nemoclaw-community)
