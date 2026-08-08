---
title: "How Ollama Cloud Pricing Works: Plans, Usage Levels, and What You Really Pay"
date: "2026-08-08"
description: "Ollama Cloud does not charge per token. Instead, it uses a plan-based system with usage levels. Here is how the pricing actually works, which plan to pick, and what each model really costs to run."
tags:
  [
    "ollama",
    "ollama cloud",
    "local llm",
    "ai pricing",
    "deepseek",
    "kimi",
    "glm",
  ]
---

Ollama Cloud does not charge per token for most models. There are no input/output price sheets, no reasoning surcharges, and no complex tiered pricing. Instead, Ollama uses a plan-based system with usage levels — simpler to understand, but different enough from traditional API pricing that it is worth explaining.

If you are trying to decide whether Ollama Cloud is worth it, or which plan to pick, here is how the pricing actually works.

## The plans

Ollama offers four tiers:

- **Free ($0):** light usage, 1 concurrent cloud model. Good for trying models and occasional use.
- **Pro ($20/month):** 50x more usage than Free, 3 concurrent models, full access to all cloud models.
- **Max ($100/month):** 5x more than Pro, 10 concurrent models. New sign-ups paused while Ollama adds capacity.
- **Team ($25/seat/month):** shared billing, US/EU hosting, 5-seat minimum.

The key difference between plans is not which models you can access — it is **how much you can use them**. Free users get light usage. Pro users get roughly 50x more. Max users get 5x more than Pro.

## Usage levels, not token counts

This is the part that is different from most API services. Ollama does not give you a fixed number of tokens per month. Instead, each model has a **usage level** that determines how fast it consumes your plan's included usage.

The levels are:

- **Light (level 1):** small models like GPT-OSS 20B, Nemotron-3-Nano 4B. You can use these heavily even on the free plan.
- **Medium (level 2):** efficient larger models like DeepSeek V4 Flash (284B total, 13B activated). Good balance of capability and cost.
- **High (level 3):** powerful models like GLM-5.2 (756B), Kimi K2.7 Code (1.04T), MiniMax M3. Burn through usage faster.
- **Extra high (level 4):** frontier models like DeepSeek V4 Pro (1.6T). Consume the most usage per request.

Think of it like fuel efficiency. A light model is a hybrid — you can drive all day on a tank. An extra high model is a sports car — fun, but you will be refueling often.

The actual usage consumed per request depends on the model, the number of input tokens, cached tokens, and output tokens. Ollama does not publish exact formulas, but the level gives you a practical sense of what to expect. You can check each model's usage level on its Ollama library page.

## What happens when you hit your limit

Usage limits reset on two cycles:

- **Session limits:** reset every 5 hours.
- **Weekly limits:** reset every 7 days.

At 90% of your limit, Ollama sends an email. You can check your current usage anytime in the settings page.

If you need more, Pro and Max users can add **extra usage credits**. Ollama draws from your plan's included usage first, then from the extra balance. Team plans share one balance across the organization.

## The Kimi K3 exception

Most cloud models are covered entirely by your plan's usage. Kimi K3 is different. It requires a Pro or Max subscription **and** consumes extra usage credits on top, with explicit per-token pricing:

- $3.00 per 1M input tokens
- $0.30 per 1M cached input tokens
- $15.00 per 1M output tokens

This is because K3 is a 2.8-trillion-parameter model — the largest open model ever released — and the compute cost is substantially higher than other cloud models. Ollama states they are "quickly working on adding capacity to expand access."

## How concurrency works

Each plan limits how many cloud models you can run at the same time:

- **Free:** 1 concurrent model
- **Pro:** 3 concurrent models
- **Max:** 10 concurrent models

Requests beyond your plan's concurrency limit are queued and processed as soon as a slot opens. If the queue is full, the request is rejected until a slot frees up.

This matters for agent workflows. If you are running an agent that spawns sub-agents or makes parallel tool calls, you need enough concurrency slots. A single agent session typically uses one slot, but complex multi-agent setups can consume more.

## How much does each model actually cost to run?

Since Ollama does not publish per-token rates for most models, the best way to estimate cost is by usage level and plan.

**On the Free plan:**

- Light models (GPT-OSS 20B, Nemotron-3-Nano 4B): you can use these regularly without hitting limits.
- Medium models (DeepSeek V4 Flash): occasional use works, but sustained daily coding will hit the session limit.
- High and extra high models: not practical on Free.

**On the Pro plan ($20/month):**

- Light models: effectively unlimited for a single user.
- Medium models (DeepSeek V4 Flash): enough for daily coding work — several hours per day of active use.
- High models (GLM-5.2, K2.7 Code, MiniMax M3): moderate daily use, but heavy sustained sessions may need extra credits.
- Extra high models (DeepSeek V4 Pro): occasional use for complex tasks; not practical as a daily driver without extra credits.

**On the Max plan ($100/month):**

- Medium models: effectively unlimited.
- High models: enough for heavy daily use.
- Extra high models: enough for regular agent work and sustained coding sessions.

**Kimi K3:** always consumes extra credits regardless of plan. Budget accordingly — at $3.00/$15.00 per 1M input/output tokens, a heavy coding session can add up quickly.

## When each plan makes sense

**Free plan:** you are trying Ollama Cloud for the first time, testing which models work for your workflow, or only need occasional access to a cloud model. Start here.

**Pro plan:** you use Ollama Cloud daily for coding, switch between a few models depending on the task, and want the flexibility of 3 concurrent models. This is the sweet spot for most individual developers.

**Max plan:** you run agents, do sustained multi-hour coding sessions, or need 10 concurrent models for complex workflows. The higher limits mean you are not watching the usage meter.

**Team plan:** you are part of a group that wants shared billing, centralized administration, and US/EU hosting. Each seat gets its own usage allocation, and extra usage draws from a shared team balance.

## Extra usage credits: when and how

Pro and Max users can add extra usage balance to their account. Ollama always uses your plan's included usage first, then draws from the extra balance.

This is useful when:

- You have an unusually heavy week and do not want to hit the weekly limit.
- You want to try a high-usage model like DeepSeek V4 Pro without upgrading to Max.
- You need to run Kimi K3, which always requires extra credits.

Extra credits are pay-as-you-go and do not expire. You can add them in settings and turn off automatic refills if you prefer.

## Privacy and data handling

Ollama Cloud hosts models primarily in the United States, with additional capacity in Europe and Singapore. Prompt and response data is never logged or trained on. When Ollama partners with hosting providers, they require zero data retention policies.

This is different from some API services that log prompts for abuse monitoring or use data for model improvement. If data privacy is a concern, Ollama Cloud's zero-retention policy is a meaningful differentiator.

## The bottom line

Ollama Cloud pricing is designed around simplicity: pick a plan, pick a model, and the usage level tells you how much you can do. There is no per-token math to optimize, no reasoning effort surcharges to track, and no separate bills for different models.

For most individual developers, the Pro plan at $20/month with a medium-usage model like DeepSeek V4 Flash is the practical sweet spot. You get enough usage for daily coding work, the flexibility to switch between models, and the option to add extra credits when you need more.

For heavy users, the Max plan removes the friction of watching limits. And for teams, the shared billing and administration make it easy to bring Ollama Cloud into an organization.

## References

- [Ollama Pricing](https://ollama.com/pricing)
- [Ollama Cloud models](https://ollama.com/search?c=cloud&o=newest)
- [Kimi K3 on Ollama](https://ollama.com/library/kimi-k3)
- [DeepSeek V4 Flash on Ollama](https://ollama.com/library/deepseek-v4-flash)
- [DeepSeek V4 Pro on Ollama](https://ollama.com/library/deepseek-v4-pro)
- [GLM-5.2 on Ollama](https://ollama.com/library/glm-5.2)
- [Kimi K2.7 Code on Ollama](https://ollama.com/library/kimi-k2.7-code)
- [MiniMax M3 on Ollama](https://ollama.com/library/minimax-m3)
