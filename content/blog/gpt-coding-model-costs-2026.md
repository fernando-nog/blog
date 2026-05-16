---
title: "GPT Coding Model Costs (2025-2026): Codex vs GPT-5.2/5.4/5.5 Pricing and Context"
date: "2026-05-05"
description: "A May 5, 2026 snapshot of OpenAI's GPT coding-model pricing and context windows: Codex models and flagship GPT-5.2, GPT-5.4, and GPT-5.5, plus what changes on ChatGPT Plus."
tags:
  [
    "openai",
    "codex",
    "gpt",
    "ai",
    "pricing",
    "developer-productivity",
    "llm",
    "programming",
    "chatgpt",
  ]
---

When you run LLM-assisted coding in production, you stop asking "Which model is best?" and start asking "Which model is best _per dollar_ for my workload?" The tricky part is that coding agents burn tokens differently than chat: they ingest a lot of context, but they can also emit a lot of output (patches, tests, logs, explanations).

This post compares **capability milestones** and, more importantly, **token pricing** for OpenAI's coding-focused models through **May 5, 2026**:

- Codex models (`gpt-5-codex` ... `gpt-5.3-codex`)
- Flagship GPT models often used for coding (`gpt-5.2`, `gpt-5.4`, `gpt-5.5`)

Most of this article is about **API token cost** (input, cached input, output). At the end, there's a short section on **ChatGPT Plus**, because subscription access is a different pricing model and it's easy to mix them up.

## Token Pricing Basics (The Only 3 Numbers That Matter)

OpenAI bills Codex model usage by token category:

- **Input tokens**: everything you send (prompt, files, conversation history).
- **Cached input tokens**: eligible reused prompt segments are billed cheaper (when prompt caching hits).
- **Output tokens**: everything the model generates (code, prose, tool traces, etc.).

Two practical implications:

- Output is often the biggest driver for agentic runs that generate lots of code.
- Caching is the biggest lever for long, multi-turn sessions where the "static" part of your prompt stays unchanged.

## Pricing Snapshot (May 5, 2026)

All prices are **USD per 1M text tokens**.

### Codex Models (API)

| Model               | Standard input | Cached input | Standard output |
| ------------------- | -------------: | -----------: | --------------: |
| `gpt-5-codex`       |          $1.25 |       $0.125 |          $10.00 |
| `gpt-5.1-codex`     |          $1.25 |       $0.125 |          $10.00 |
| `gpt-5.1-codex-max` |          $1.25 |       $0.125 |          $10.00 |
| `gpt-5.2-codex`     |          $1.75 |       $0.175 |          $14.00 |
| `gpt-5.3-codex`     |          $1.75 |       $0.175 |          $14.00 |

OpenAI also lists **Priority** pricing for `gpt-5.3-codex` at **2x** standard (input $3.50, cached input $0.35, output $28.00 per 1M tokens).

### Flagship GPT Models Commonly Used for Coding (API)

| Model         | Standard input | Cached input | Standard output | Context window |
| ------------- | -------------: | -----------: | --------------: | -------------: |
| `gpt-5.2`     |          $1.75 |       $0.175 |          $14.00 |           400k |
| `gpt-5.4`     |          $2.50 |        $0.25 |          $15.00 |          1.05M |
| `gpt-5.5`     |          $5.00 |        $0.50 |          $30.00 |             1M |
| `gpt-5.5-pro` |         $30.00 |            - |         $180.00 |          1.05M |

Sources: the model cards for `gpt-5-codex`, `gpt-5.1-codex(-max)`, `gpt-5.2-codex`, and `gpt-5.3-codex`, plus the official API pricing table.

Note: `gpt-5.4` has special long-context pricing rules for very large prompts; check the model page before budgeting a multi-hundred-K token single request.

## Context Windows: Why the Numbers Don't Always Match

If you compare API docs to what you see inside ChatGPT or Codex, the context windows can look inconsistent. That's expected:

- **API** context windows are defined per model ID (what you can send in a single request).
- **ChatGPT** context windows depend on the **surface** and sometimes the **plan tier** (Instant vs Thinking, plus plan limits).
- **Codex** can expose a different context window than the API for the same family (for example, GPT-5.5 in Codex is listed with a 400K context window).

When you're writing a budget, always anchor on the surface you're paying for: API token billing vs ChatGPT subscription usage.

## Capability Timeline (What You Were Paying For)

A simplified view of how the coding-focused lineup progressed:

- **Sep 15, 2025**: **GPT-5-Codex** introduced as a GPT-5 variant optimized for agentic coding in Codex.
- **Sep 23, 2025**: GPT-5-Codex became available via **API key** in the Responses API.
- **Nov 19, 2025**: **GPT-5.1-Codex-Max** released for longer, more detailed, long-running tasks (with compaction-style long-horizon work).
- **Dec 18, 2025**: **GPT-5.2-Codex** released with stronger long-horizon performance and significantly stronger defensive cybersecurity capabilities.
- **Feb 5, 2026**: **GPT-5.3-Codex** released as the most capable Codex model to date, with faster operation and improved frontier agentic performance.
- **Mar 5, 2026**: **GPT-5.4** released across ChatGPT, API, and Codex as a frontier model for coding and professional workflows.
- **Apr 23-24, 2026**: **GPT-5.5** introduced and rolled out broadly (ChatGPT, Codex), with API availability shortly after.

## Capabilities vs Price (A Practical Matrix)

All the models below can be used for coding, but they trade off capability, context, and cost differently.

| Model               | Surface | Context window | Max output | What you're buying                                                                      |
| ------------------- | ------- | -------------: | ---------: | --------------------------------------------------------------------------------------- |
| `gpt-5-codex`       | API     |           400k |       128k | Baseline Codex behavior at the lowest Codex pricing.                                    |
| `gpt-5.1-codex-max` | API     |           400k |       128k | Best value when you want long-running, detailed coding work at older Codex pricing.     |
| `gpt-5.3-codex`     | API     |           400k |       128k | Highest Codex capability at mid-tier token pricing.                                     |
| `gpt-5.2`           | API     |           400k |       128k | Previous frontier model pricing, often "good enough" for most coding tasks.             |
| `gpt-5.4`           | API     |          1.05M |       128k | Much larger context; better when your repo/tooling context is huge.                     |
| `gpt-5.5`           | API     |             1M |       128k | Higher cost, but aimed at better token-efficiency and fewer iterations on complex work. |

## The Cost Story: What Changed From Launch to Today

From GPT-5-Codex to GPT-5.3-Codex, the headline change is a **40% price increase** for standard token rates:

- Input: $1.25 -> $1.75 per 1M tokens
- Output: $10.00 -> $14.00 per 1M tokens

So your decision is less about pennies and more about whether the newer models let you:

- finish tasks in fewer iterations
- generate fewer wasted tokens (less thrash)
- avoid human time (review cycles, debugging time, incident risk)

OpenAI claims GPT-5.3-Codex uses fewer tokens than prior models on key agentic benchmarks, which matters because token efficiency can offset higher per-token prices.

For flagship GPT models, the jump is larger:

- `gpt-5.2` -> `gpt-5.5`: input goes from $1.75 -> $5.00 per 1M tokens, and output from $14.00 -> $30.00.

The bet you're making with `gpt-5.5` is that you get **fewer retries** and **less wasted output**, so the _effective_ cost per merged PR (or resolved ticket) drops even if per-token rates are higher.

## Practical Levers to Reduce Token Spend

If you're cost-sensitive, optimize the shape of the conversation, not just the model:

- **Constrain output**: ask for a `git diff` (or patch) first, and keep explanations short until after the patch is correct.
- **Avoid re-sending the world**: keep stable instructions and context fixed so prompt caching has a better chance to hit.
- **Split tasks**: run separate, smaller prompts for "analysis" and "implementation" instead of one massive all-in-one run that bloats output.
- **Measure output**: agentic workflows can accidentally print long logs; treat "verbosity" as a cost setting.

## Quick Cost Examples (Standard Pricing)

A simple estimate:

```text
cost = input_MTok * input_price
     + cached_input_MTok * cached_input_price
     + output_MTok * output_price
```

Example A: "PR review + patch" sized run

- Input: 200k tokens (0.20 MTok)
- Output: 20k tokens (0.02 MTok)
- No caching

Estimated cost:

- `gpt-5-codex`: 0.20*1.25 + 0.02*10.00 = $0.45
- `gpt-5.3-codex`: 0.20*1.75 + 0.02*14.00 = $0.63

Example B: long multi-turn session with caching

- Input (cached): 800k tokens (0.80 MTok) reused across turns
- Input (new): 200k tokens (0.20 MTok)
- Output: 50k tokens (0.05 MTok)

Estimated cost:

- `gpt-5-codex`: 0.20*1.25 + 0.80*0.125 + 0.05\*10.00 = $0.85
- `gpt-5.3-codex`: 0.20*1.75 + 0.80*0.175 + 0.05\*14.00 = $1.19

Caching keeps these sessions sane. Without caching, Example B would be materially more expensive.

## Which Codex Model Should You Choose (Cost-First)?

As of May 5, 2026:

- Default to **`gpt-5.3-codex`** when task success probability matters (large refactors, tricky bug hunts, security-sensitive changes).
- Use **`gpt-5-codex` / `gpt-5.1-codex`** when you want Codex behavior at lower cost and can tolerate more iterations.
- Reserve **Priority** for interactive workflows where latency is worth the 2x token rates.

If you track one metric, track **cost per merged PR** (or cost per resolved ticket), not cost per request.

## ChatGPT Plus Comparison (May 2026)

Token pricing applies to the **API**. ChatGPT Plus is a **subscription** with usage limits that can change over time, but it matters because many teams do "explore in ChatGPT" and "ship via API".

What Plus is typically used for:

- Interactive debugging, brainstorming, and quick code generation
- Short agentic workflows where you don't need per-request cost accounting

What to keep in mind:

- Plus includes access to newer frontier models in ChatGPT (for example, GPT-5.4 Thinking and GPT-5.5 Thinking rollout notes mention Plus availability).
- ChatGPT context windows and limits differ by mode (Instant vs Thinking) and tier; don't assume they're the same as the API context windows.

A practical comparison for **ChatGPT Plus** (subject to ongoing product changes):

| Mode in ChatGPT  | Typical Plus context window | Notes                                                                                       |
| ---------------- | --------------------------: | ------------------------------------------------------------------------------------------- |
| GPT-5.3 Instant  |                         32K | Fast, general chat/coding help.                                                             |
| GPT-5.5 Thinking |                        256K | Larger context; Thinking mode has its own limits and is different from API context windows. |

If you need strict cost control and repeatability, prefer the API. If you need convenience and don't want to meter usage per request, Plus can be a good default for day-to-day coding assistance.

## References

- OpenAI Codex pricing: https://developers.openai.com/codex/pricing
- OpenAI API pricing: https://platform.openai.com/docs/pricing
- Model cards:
  - https://developers.openai.com/api/docs/models/gpt-5-codex
  - https://developers.openai.com/api/docs/models/gpt-5.1-codex
  - https://developers.openai.com/api/docs/models/gpt-5.1-codex-max
  - https://developers.openai.com/api/docs/models/gpt-5.2-codex
  - https://developers.openai.com/api/docs/models/gpt-5.3-codex
  - https://developers.openai.com/api/docs/models/gpt-5.2
  - https://developers.openai.com/api/docs/models/gpt-5.4
  - https://developers.openai.com/api/docs/models
  - https://developers.openai.com/api/docs/models/gpt-5.5-pro
- Release posts:
  - https://openai.com/index/introducing-upgrades-to-codex/
  - https://openai.com/index/gpt-5-1-codex-max/
  - https://openai.com/index/introducing-gpt-5-2-codex/
  - https://openai.com/index/introducing-gpt-5-3-codex/
  - https://openai.com/index/introducing-gpt-5-4/
  - https://openai.com/index/introducing-gpt-5-5/
- ChatGPT plan/context docs:
  - https://openai.com/chatgpt/pricing/
  - https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus
  - https://help.openai.com/en/articles/11909943-gpt-53-and-gpt-55-in-chatgpt
