---
title: "Ollama Cloud Models: Which One to Use for Coding, Agents, and Daily Work"
date: "2026-08-08"
description: "Ollama Cloud now hosts 16 open-weight models, from lightweight 4B to the 2.8T Kimi K3. Here is which one to pick for coding, agents, multimodal work, and tight budgets."
tags:
  [
    "ollama",
    "ollama cloud",
    "local llm",
    "coding assistant",
    "ai agents",
    "deepseek",
    "kimi",
  ]
---

Ollama started as a tool for running models locally. Over the last year, it added cloud-hosted models — the same open-weight models you can download, but running on Ollama's infrastructure so you do not need the hardware.

There are now 16 cloud models available, from lightweight 4B models to the 2.8-trillion-parameter Kimi K3. The question is not just which one is best — it is which one is best for what you are actually doing.

This guide breaks down the cloud models by use case, with concrete recommendations based on benchmarks, pricing, and practical trade-offs.

## How Ollama Cloud pricing works (the short version)

Before picking a model, understand the cost structure. Ollama uses a plan-based system with usage levels:

- **Free:** light usage, 1 concurrent cloud model.
- **Pro ($20/month):** 50x more usage than Free, 3 concurrent models.
- **Max ($100/month):** 5x more than Pro, 10 concurrent models (new sign-ups paused).
- **Team ($25/seat/month):** shared billing, US/EU hosting.

Each model has a **usage level** — light, medium, high, or extra high — that determines how fast it burns through your plan's included usage. A medium model like DeepSeek V4 Flash lets you do more before hitting limits. An extra high model like DeepSeek V4 Pro consumes usage faster.

Some models also have per-token pricing on top of the plan. Kimi K3, for example, costs $3.00 per million input tokens, $0.30 cached, and $15.00 per million output tokens — and requires a Pro or Max subscription plus extra usage credits.

## Best for daily coding

If you spend most of your day writing, reviewing, and debugging code, you want a model that is fast, reliable, and does not burn through your usage credits too quickly.

**Top pick: DeepSeek V4 Flash**

- 284B total parameters, 13B activated (MoE)
- 1M token context window
- Usage level: medium
- Three thinking modes: none, thinking, max thinking
- LiveCodeBench: 91.6 (max thinking), SWE-bench Verified: 79.0

This is the best balance of capability and cost for daily coding on Ollama Cloud. The medium usage level means you can use it heavily on a Pro plan without running out. The 1M context window handles large files and long conversations. And the three thinking modes let you choose between speed and depth depending on the task.

**Alternative: Kimi K2.7 Code**

- 1.04T parameters, 256K context
- Usage level: high
- Built specifically for coding, with 30% fewer thinking tokens than K2.6
- Multimodal (images and video via MoonViT)

K2.7 Code is stronger than V4 Flash on pure coding benchmarks, but the high usage level and smaller context window make it less practical for all-day use. Use it when you need the extra coding quality and are willing to spend more credits.

**Also consider: GLM-5.2**

- 756B parameters, 976K context
- Usage level: high
- MIT license, strongest open-source model on coding benchmarks available on Ollama
- Terminal-Bench 2.1: 81.0, SWE-bench Pro: 62.1

GLM-5.2 is the best open-source coding model on standard benchmarks. The high usage level is the main drawback for heavy daily use.

## Best for agents and long-running tasks

Agent workflows are different from chat. They involve long sessions, many tool calls, and sustained reasoning. You need a model that does not degrade over long contexts and handles multi-step tool use reliably.

**Top pick: DeepSeek V4 Pro**

- 1.6T total parameters, 49B activated (MoE)
- 1M token context window
- Usage level: extra high
- Three thinking modes
- SWE-bench Pro: 55.4, BrowseComp: 83.4, MCPAtlas: 74.2

V4 Pro is the most capable cloud model on Ollama for sustained agent work. The 49B activated parameters give it enough reasoning depth for complex multi-step tasks, and the 1M context handles long agent trajectories. The extra high usage level means you will want a Max plan or careful credit management.

**Alternative: MiniMax M3**

- 512K guaranteed context, up to 1M
- Usage level: high
- Native multimodal, strong on BrowseComp (83.5)
- Officially licensed for commercial use, US-based hosting on Ollama Cloud

M3 is a strong agent model with the advantage of being officially licensed for commercial work. If you are building a product on top of Ollama Cloud, the licensing clarity matters.

**Budget pick: DeepSeek V4 Flash**

For lighter agent tasks, V4 Flash at medium usage is hard to beat. It scores 69.0 on MCPAtlas and 56.9 on Terminal-Bench 2.0 at max thinking — not as strong as V4 Pro, but far cheaper to run.

## Best for multimodal work

If you need the model to understand images, screenshots, or video alongside text, only a few Ollama Cloud models support this natively.

**Top pick: Kimi K3**

- 2.81T parameters, 1M context
- Native multimodal (text, images, video)
- Usage: requires Pro/Max + extra credits
- $3.00/$0.30/$15.00 per 1M tokens

K3 is the most capable multimodal model on Ollama Cloud. It understands text, images, and video within the same model — no separate vision encoder bolted on. The cost is high, but for tasks like visual debugging, UI generation from screenshots, or video analysis, there is no equivalent on the platform.

**Alternative: Qwen 3.5**

- Multiple sizes from 0.8B to 122B
- Vision support on larger variants
- 17M+ pulls, huge community on Ollama

Qwen 3.5 is the practical choice for lighter multimodal work. The smaller variants are cheap to run, and the ecosystem is mature.

## Best for tight budgets

If you want capable models without spending much, the free plan covers more than you might expect.

**Top pick: DeepSeek V4 Flash on the free plan**

At medium usage, V4 Flash is the most capable model available on the free tier. You will hit limits faster than on Pro, but for occasional coding sessions it is enough.

**Also consider: GPT-OSS 20B**

OpenAI's open-weight 20B model runs at light usage — the lowest consumption tier on Ollama Cloud. It is not frontier quality, but for autocomplete, simple refactors, and quick questions, it works well on the free plan without hitting limits quickly.

**Also consider: Nemotron-3-Nano 4B**

NVIDIA's 4B agentic model is the smallest cloud model available on Ollama. Light usage level. Useful for quick tasks where latency matters more than depth. Also runs locally if you prefer.

## Quick reference

- **Daily coding:** DeepSeek V4 Flash (medium usage, 1M context) — best cost/capability balance on Ollama Cloud.
- **Heavy coding:** GLM-5.2 (high usage, 976K context) — best open-source coding benchmarks on Ollama.
- **Coding specialist:** Kimi K2.7 Code (high usage, 256K context) — purpose-built for code, multimodal.
- **Agents:** DeepSeek V4 Pro (extra high usage, 1M context) — 49B activated, strong multi-step reasoning.
- **Agents (commercial):** MiniMax M3 (high usage, 512K-1M context) — officially licensed, US-hosted on Ollama.
- **Multimodal:** Kimi K3 (extra usage, 1M context) — native text, image, and video understanding.
- **Budget:** DeepSeek V4 Flash (medium usage, 1M context) — most capable model at the lowest usage cost.
- **Lightweight:** GPT-OSS 20B or Nemotron-3-Nano 4B (light usage) — free-plan friendly, also run locally.

## How to get started

All cloud models work the same way on Ollama:

```
ollama run deepseek-v4-flash:cloud
```

Or launch directly into your coding tool:

```
ollama launch claude --model deepseek-v4-flash:cloud
ollama launch opencode --model glm-5.2:cloud
```

The `:cloud` tag is what tells Ollama to use their hosted infrastructure instead of your local GPU.

## References

- [Ollama Cloud models](https://ollama.com/search?c=cloud&o=newest)
- [Ollama Pricing](https://ollama.com/pricing)
- [DeepSeek V4 Flash on Ollama](https://ollama.com/library/deepseek-v4-flash)
- [DeepSeek V4 Pro on Ollama](https://ollama.com/library/deepseek-v4-pro)
- [Kimi K3 on Ollama](https://ollama.com/library/kimi-k3)
- [Kimi K2.7 Code on Ollama](https://ollama.com/library/kimi-k2.7-code)
- [GLM-5.2 on Ollama](https://ollama.com/library/glm-5.2)
- [MiniMax M3 on Ollama](https://ollama.com/library/minimax-m3)
- [Qwen 3.5 on Ollama](https://ollama.com/library/qwen3.5)
- [GPT-OSS on Ollama](https://ollama.com/library/gpt-oss)
- [Nemotron-3-Nano on Ollama](https://ollama.com/library/nemotron-3-nano)
