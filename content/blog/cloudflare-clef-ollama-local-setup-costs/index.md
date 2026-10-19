---
title: "Cloudflare Clef on Ollama: How to Run It Locally and What It Costs"
date: "2026-10-19"
description: "Learn what Cloudflare Clef does, where to get it, how to call its decision API in Ollama, and what local and hosted inference costs."
tags:
  ["AI", "Ollama", "Cloudflare", "AI Agents", "Open Weights", "DeveloperTools"]
---

Not every AI feature needs a model to write a paragraph. Sometimes your application only needs to decide whether a support ticket is urgent, which queue should receive it, or whether an agent's next tool call looks risky.

Cloudflare Clef is designed for those bounded decisions. It is available in Ollama's model library, where you can download the weights and run inference on your own machine. The important difference from a typical Ollama model is that Clef is not a chatbot: you send a state and typed questions to a decision API, then use the answers in your code.

## What Is Cloudflare Clef?

Clef is a 27-billion-parameter decision model created by Cloudflare and fine-tuned from Qwen3.8-27B. It reads text and images, evaluates questions with defined answer types, and returns structured decisions with probabilities rather than generating a free-form response.

You provide two things:

- **State:** the text or structured data to evaluate, such as a ticket, a receipt, or an agent's proposed tool call.
- **Questions:** the judgments to make about that state, each with a specific answer type.

The supported types are `choice` for selecting from options you define, `noul` for a yes-or-no question, and `score` for rating against an ordered scale. You can ask several independent questions about the same state in one request.

This makes Clef useful as a decision layer inside an application or an agent workflow. It does not replace the model that writes code, plans a task, or explains a result.

## Where to Find Clef

The simplest route is the official [Ollama Clef library page](https://ollama.com/library/clef). The model page currently lists a Q4_K_M download of about 18 GB and says Clef requires Ollama **0.35.1 or later**. Check your installed version before downloading:

After installing or updating Ollama, download the model:

```bash
$ ollama --version
$ ollama pull clef
```

Cloudflare also publishes Clef weights under the Apache 2.0 license. The Cloudflare announcement links to the model weights and explains how the model was trained. Check the license and distribution terms for the exact artifact you choose before shipping it in a product.

## Make a Decision Request Through Ollama

Ollama serves decision models through its `/v1/systemone` endpoint. A local request does not need an API key. For example, this request routes a support ticket, checks whether a refund was requested, and scores urgency:

```bash
$ curl http://localhost:11434/v1/systemone \
  -H "Content-Type: application/json" \
  -d '{
    "model": "clef",
    "state": {
      "ticket": "I was charged twice. Please refund the extra payment."
    },
    "questions": {
      "team": {
        "type": "choice",
        "instructions": "Which team should handle this ticket?",
        "criteria": {
          "billing": "Payments and refunds",
          "technical": "Bugs and integrations",
          "other": "None of the above"
        }
      },
      "refund": {
        "type": "noul",
        "instructions": "Does the customer explicitly ask for a refund?"
      },
      "urgency": {
        "type": "score",
        "instructions": "How urgent is this ticket?",
        "criteria": ["Routine", "Soon", "Urgent"]
      }
    }
  }'
```

The response contains one answer for each question. A `choice` answer includes the chosen option and probabilities for the available options. A `noul` answer gives a probability that the statement is true. A `score` answer returns a probability-weighted score and a distribution across the levels.

Ollama's current documentation says the decision endpoint is not exposed through the standard Ollama CLI or its Python and JavaScript libraries yet. Use the HTTP API directly, or configure TypeSafe's Python SDK to point at the local Ollama server. For the SDK, install the package and set its base URL and model:

```bash
$ pip install typesafe-sdk
$ export TYPESAFE_BASE_URL="http://localhost:11434"
$ export TYPESAFE_API_KEY="ollama"
$ export TYPESAFE_DEFAULT_MODEL="clef"
```

The SDK requires an API key value, but local Ollama ignores it. Do not treat `ollama run clef` as the documented way to submit typed decision questions.

Clef also accepts images through the decision request. Ollama's model instructions expect image data as base64-encoded PNG, JPEG, or WebP; image URLs and data URLs are not supported. Images are evaluated together with the text state, which makes receipt and document triage possible without first converting the image into a text-only prompt.

Local requests do not require an API key, so keep the Ollama API bound to a trusted local interface. Do not expose the server port to an untrusted network without adding appropriate access controls.

## What Does Clef Cost?

The answer depends on where you run it.

| Deployment                      | Published model cost           | What to budget for                                                       |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| **Ollama on your own hardware** | No per-token inference fee     | Hardware, electricity, disk space, setup, and maintenance                |
| **Cloudflare Workers AI**       | $0.24 per million input tokens | Usage-based inference; image inputs are also converted into input tokens |

Prices were checked on **October 19, 2026**; confirm the provider's current pricing before estimating a production workload.

For local use, the 18 GB download is not the total memory requirement. Inference also needs room for runtime data and the context cache, and larger contexts increase memory use. The 18 GB number is useful for planning disk space, but it is not a promise that an 18 GB GPU or computer will run every configuration comfortably.

There is also a context-setting detail worth checking before you follow a large-context tutorial. The Ollama library overview advertises a 256K context window, while the `clef:27b-q4_K_M` tag lists `num_ctx` as 16,384 in its parameters. Treat these as the advertised context window and the tag's configured default, respectively—not as a promise that your local service will use 256K automatically. Verify the active context setting and memory use on your own machine before sending long inputs.

Cloudflare's hosted price is a useful reference if you do not want to manage a local server. At the listed rate, 10 million input tokens cost $2.40. That is a simple token calculation, not a full cost comparison with self-hosting: a local model may avoid usage fees, but its hardware and operating costs still matter.

## When Does Local Clef Make Sense?

Running Clef locally is a good fit when you want to keep inference on hardware you control, already have a machine with enough memory, or expect steady decision traffic that makes managing a local service worthwhile. It can also be useful when you want to try an open-weight decision model without paying a hosted per-token rate.

Hosted inference is simpler when you do not want to install a model or allocate hardware. In that case, Cloudflare Workers AI charges for input-token usage. Do not confuse that hosted price with the cost of pulling the Ollama model: the Ollama library distributes the model for local use, while Workers AI is a separate hosted service.

## What Clef Is Not

Clef is not a replacement for a coding model such as the model inside your coding agent. It cannot write a feature, generate a useful explanation, or carry out a multi-step programming task. Instead, it can make a constrained decision that your application uses to route work, assess an action, or ask for human review.

Its probabilities are not guarantees. A valid answer can still be wrong, so keep deterministic permissions and safety checks in your application. For high-impact decisions, measure errors on your own examples and provide an escalation path rather than blindly executing the model's preferred option.

For a direct comparison with TypeSafe's Jev decision model—including hosted prices and benchmark caveats—see [Cloudflare Clef vs Jev: Open-Weight Local Decisions or a Managed API](/cloudflare-clef-vs-jev-open-weight-decision-model-comparison/). For an introduction to the decision-model category, see [What Is Jev?](/what-is-jev-typesafe-system-one-model-ai-decisions/).

## References

- [Ollama model library: Clef](https://ollama.com/library/clef)
- [Ollama model tag: Clef Q4_K_M details](https://ollama.com/library/clef:27b-q4_k_m)
- [Ollama documentation: Decision API](https://docs.ollama.com/capabilities/decision)
- [Ollama FAQ: setting the context window](https://docs.ollama.com/faq#how-can-i-specify-the-context-window-size)
- [Cloudflare: Introducing Clef and Clef-flash](https://blog.cloudflare.com/clef-decision-models)
- [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing)
