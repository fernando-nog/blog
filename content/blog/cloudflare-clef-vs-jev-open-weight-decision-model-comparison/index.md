---
title: "Cloudflare Clef vs Jev: Open-Weight Local Decisions or a Managed API?"
date: "2026-10-19"
description: "Compare Cloudflare Clef and TypeSafe Jev on deployment, pricing, images, context, and published benchmarks—with caveats for choosing fairly."
tags: ["AI", "Ollama", "Cloudflare", "Jev", "AI Agents", "Model Comparison"]
---

Cloudflare Clef and TypeSafe Jev are not general-purpose chatbots. They belong to a newer category of **decision models**: give the model a state and a set of typed questions, and it returns constrained answers and probabilities that software can use directly.

The comparison is especially practical because Clef follows the Jev/System One request format. But that does not make the two deployments identical. Clef can run locally through Ollama or as a hosted Cloudflare service; Jev is offered through TypeSafe's API. The best choice depends on where you want inference to run, what data you need to send, and how much you are willing to operate yourself.

## The Short Version

- Choose **Clef with Ollama** if you want open weights, local inference, and image input, and you have hardware that can run the model.
- Choose **Clef on Workers AI** if you want the Clef model without managing local hardware and are comfortable with Cloudflare's usage-based pricing.
- Choose **Jev** if you want TypeSafe's managed decision API and its current per-token price is a better fit for your workload.
- Benchmark both on your own labeled examples before putting either model in charge of high-impact decisions.

Neither model writes code or replaces the main LLM in a coding agent. They are candidates for a decision or guardrail layer around an application.

## Clef and Jev at a Glance

|                        | Cloudflare Clef                                                                                        | TypeSafe Jev                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **What it does**       | Makes typed decisions from text, structured state, and images                                          | Makes typed decisions from text and structured state                                                                 |
| **Where it runs**      | Locally through Ollama, or hosted on Cloudflare Workers AI                                             | Hosted through TypeSafe's API                                                                                        |
| **Hosted input price** | $0.24 per million input tokens on Workers AI                                                           | $0.042 per million input tokens; output tokens are free                                                              |
| **Local price**        | No per-token fee when self-hosted; hardware and operations still cost money                            | Official TypeSafe docs describe API access, not a local Jev package                                                  |
| **Context**            | 64K on Workers AI; Ollama's library advertises 256K, but a Q4_K_M tag lists a 16,384 default `num_ctx` | Jev 1.14 documents 64K per request and 32K per question by default; optional long context raises both limits to 262K |
| **API shape**          | Compatible with Jev/System One-style requests                                                          | The original TypeSafe System One API                                                                                 |

Prices and model documentation were checked on **October 19, 2026**. Providers can change prices, model versions, and limits, so verify the linked pages before using these figures in a purchasing decision.

## A Practical Difference: Self-Hosting Changes the Cost Equation

At the published hosted rates, Jev's input tokens cost less. For 10 million input tokens, the simple calculation is **$0.42 for Jev** and **$2.40 for Clef on Workers AI**. That comparison does not include differences in tokenization, image processing, or other account terms, but it does show that open weights do not automatically mean the hosted option is cheaper.

Clef's open weights create another option: download the model through Ollama and run inference on hardware you control. That avoids a per-token model fee, but it is not free computing. You need to account for the machine, electricity, disk, memory, utilization, and time spent maintaining the service. The Ollama Q4_K_M artifact is listed at about 18 GB; that is the download size, not a universal minimum-memory guarantee.

Jev is simpler if you want a managed API and do not want to provision inference hardware. Clef local may be attractive when you already own suitable hardware, need local inference, or have a workload where the total cost of operating the model works out better. Compare total cost per accepted decision, not just the price of one million tokens.

## Images and Context: Clef Has a Local Multimodal Option

The Ollama version of Clef accepts images in addition to text. This can help with workflows such as reading a receipt or making a decision about a screenshot. The request uses base64-encoded image data; Ollama's model documentation says remote image URLs and data URLs are not accepted. Cloudflare's Workers AI description for Clef mentions video, but its documented request parameters list embedded images; a video field is explicitly documented for the separate Clef-omni model. This comparison sticks to the image support documented for Clef rather than mixing model variants.

The current Jev model documentation lists text input. If a workflow depends on image evidence, that is a practical distinction: Clef has a documented image path, while Jev would need the image converted into text or structured fields by another component first.

Be careful when comparing context-window claims. Cloudflare documents a 64K context window for its hosted Clef service. The Ollama library overview advertises 256K for the local model, but the `clef:27b-q4_K_M` tag lists `num_ctx: 16384` in its parameters. The effective local context depends on the selected tag and runtime configuration, and larger contexts require more memory. Jev 1.14's default documentation lists 64K per request and 32K per question, with an optional long-context header that raises both to 262K.

## What Do the Published Benchmarks Say?

Cloudflare published Clef results on four workflows from TypeSafe's evaluation suite. The results show why a single overall winner would be too simple:

| Workflow (reported score, %) | Clef |  Jev |
| ---------------------------- | ---: | ---: |
| Invoice processing           | 64.7 | 61.8 |
| Customer service             | 76.3 | 76.0 |
| Security incidents           | 62.9 | 61.7 |
| Agent trace observability    | 68.5 | 71.6 |

Clef is ahead in three rows; Jev leads in agent trace observability. Cloudflare reports these Clef results on TypeSafe's workflow suite; the comparison is not an independent third-party replication. TypeSafe says its reference labels for the suite are generated by averaging responses from GPT-6 Astra and Claude Fable 5.1 at high reasoning. That provides a consistent reference procedure, but it is not independent human ground truth.

The broader benchmark table is mixed too. For example, the Ollama Clef page reports Clef ahead of Jev on BANKING77 macro-F1, while Jev is ahead on ANLI macro-F1. Different benchmarks test different capabilities; avoid taking a few selected rows as proof that one model is universally more accurate.

Cloudflare also reported median latency of 209.3 ms for Clef and 524.1 ms for Jev across its benchmark runs. Treat that as **Cloudflare's reported measurement**, not a controlled promise that local Clef will always respond faster. Hosted providers, network paths, hardware, request sizes, and serving stacks affect latency. In particular, testing Clef locally against Jev over the internet would measure two different deployment paths as well as two models.

One more version caveat: TypeSafe's documentation says Jev 1.14 became available on October 14, 2026, while Cloudflare's Clef announcement and its benchmark table were published earlier in October. Unless the benchmark is rerun with Jev 1.14, do not present those Jev results as a test of the newest release.

## How to Run a Fair Comparison

Before choosing a model for production, build a small evaluation from examples that reflect your actual workflow:

1. Use the same state, questions, criteria, and labeled examples for both models.
2. Compare the selected decisions and per-option probabilities, not only whether the response parses.
3. Measure accuracy by class, false positives and negatives, calibration, and the cost of errors.
4. Record p50 and p95 latency with the same request size and enough repetitions. For local Clef, report the hardware and context configuration; for hosted APIs, report the region and network path.
5. Calculate cost per accepted decision. Include hosted input tokens or amortized local hardware, electricity, and operational effort.

If image input matters, include a separate set of image examples and count image-token costs for hosted Clef. If your application serves users in Portuguese or another language, include representative examples in that language rather than assuming English results transfer.

## Which One Should You Use?

**Use local Clef** when keeping inference on hardware you control is a priority, you need image decisions, and you have the memory and operational capacity to run a 27B model. Start with the Ollama [Clef setup guide](/cloudflare-clef-ollama-local-setup-costs/) for installation and request examples.

**Use hosted Clef** if you want Cloudflare to run the model and prefer Clef's behavior or image support, while accepting its published input-token price.

**Use Jev** if a managed API is a better fit than self-hosting and its current price and behavior meet your needs. Evaluate Jev 1.14 itself rather than assuming launch-era benchmarks cover the latest version.

All three options are for bounded decisions—not for generating code or performing open-ended reasoning. In an agent architecture, a coding model can plan and act while Clef or Jev handles a narrow classification or policy check. For a beginner-friendly explanation of these decision primitives, see [What Is Jev?](/what-is-jev-typesafe-system-one-model-ai-decisions/).

## References

- [Ollama model library: Clef](https://ollama.com/library/clef)
- [Ollama Clef Q4_K_M model details](https://ollama.com/library/clef:27b-q4_k_m)
- [Ollama documentation: Decision API](https://docs.ollama.com/capabilities/decision)
- [Cloudflare: Introducing Clef and Clef-flash](https://blog.cloudflare.com/clef-decision-models)
- [Cloudflare Workers AI: Clef model details](https://developers.cloudflare.com/workers-ai/models/clef)
- [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing)
- [TypeSafe documentation: current Jev models and pricing](https://docs.typesafe.ai/models)
- [TypeSafe workflow evaluation and methodology](https://evals.typesafe.ai/)
