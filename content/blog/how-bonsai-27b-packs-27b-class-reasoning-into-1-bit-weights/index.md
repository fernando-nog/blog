---
title: "How Bonsai 27B Packs 27B-Class Reasoning into 1-Bit Weights"
date: "2026-08-04"
description: "A technical walkthrough of how Prism ML distills Qwen3.6-27B into binary and ternary weights, keeps reasoning alive, and runs it on a phone."
tags:
  [
    "bonsai ai",
    "model distillation",
    "quantization",
    "llamacpp",
    "on-device ai",
    "distillation",
  ]
---

Quantization has always been a game of compromise. You shrink a model's weights to fit on cheaper hardware, and somewhere in the process, reasoning, coding, or long-context coherence quietly collapses. Most of us accept that 4-bit is "good enough," 3-bit is risky, and anything below 2-bit is basically a toy.

Bonsai 27B ignores that assumption. Its 1-bit variant stores the entire language model at roughly **1.125 bits per weight**, fits in **3.9 GB**, and still scores **89.5%** of the FP16 baseline on thinking-mode benchmarks. Coding stays at **81.88**, math at **91.66**. The ternary variant pushes even closer to full precision at **1.71 bits per weight**.

This post explains the engineering behind that compression. Not marketing claims — the actual choices Prism ML made in weight representation, architecture, distillation, and inference kernels to keep 27B-class reasoning alive at phone-scale size. If you want a hands-on view first, read [my practical test of the 1-bit model](./can-a-3-9-gb-model-really-code-testing-bonsai-27b-1-bit-on-a-laptop/); for the full training pipeline, see the [distillation walkthrough](./bonsai-distillation-explained-from-qwen36-27b-to-a-phone-friendly-39-gb-model/).

## The compression target is the whole model, not a shortcut

A common trick in low-bit quantization is to compress most of the model aggressively, then leave a few high-precision "escape hatches" for embeddings, the LM head, or attention layers. That looks fine in a spec sheet until you measure sustained reasoning, where those mixed-precision seams show.

Bonsai takes the harder route. In both the 1-bit and ternary variants, the **embeddings, attention projections, MLP projections, and LM head** are all stored in low-bit form. The only high-precision residue is a small tail of normalization and group-wise scale parameters. The vision tower, used only for multimodal input, is shipped separately in compact 4-bit HQQ so that text-only inference never pays for it.

The result is that the advertised bit-width matches the real bit-width. A conventional "2-bit" Qwen3.6-27B build can actually average **2.8 bits per weight** and occupy **9.4 GB**. Bonsai's 1-bit model really is **1.125 bits per weight** and **3.9 GB**.

## Weight representation: sign bits plus shared scales

The 1-bit variant uses **GGUF Q1_0_g128**. Each weight is a single sign bit: `0` maps to `-scale`, `1` maps to `+scale`. Every **128 weights share one FP16 scale factor**. That gives:

```text
1 sign bit + (16 scale bits / 128 weights) = ~1.125 bits per weight
```

The ternary variant uses **Q2_0_g128**. Each weight takes one of three values: **{-1, 0, +1}**, again with a shared FP16 scale per 128 weights. The information content of a ternary value is log2(3) ≈ 1.585 bits, but the deployed cost lands around **1.71 bits per weight** because the ternary codes are currently packed into 2-bit slots for compatibility with existing kernels.

| Format    | Weight alphabet | True bits/weight | Ideal size | Deployed size |
| --------- | --------------- | ---------------- | ---------- | ------------- |
| FP16      | 65,536 values   | 16.0             | ~54 GB     | ~54 GB        |
| Q1_0_g128 | {-1, +1}        | 1.125            | ~3.9 GB    | ~3.9 GB       |
| Q2_0_g128 | {-1, 0, +1}     | 1.71             | ~5.9 GB    | ~7.2 GB       |

The 1-bit format is the smallest operating point. The ternary format spends an extra bit per weight on the zero state, which turns out to be enough to recover most of the full-precision behavior.

## Why a zero state matters so much

Binary weights can only flip a sign. That is powerful for directions in weight space, but it struggles with magnitude and suppression: there is no way to say "this connection should be quiet." Ternary adds that ability. The extra `0` value lets the model learn sparser, more selective transformations.

That difference shows up in the benchmark gap. The ternary variant scores **80.49** on the 15-benchmark average versus **76.11** for the 1-bit variant. More importantly, the gap is concentrated in categories that demand sustained attention and fine-grained control: instruction following, agentic tool use, and vision.

Both variants, however, hold **math and coding** surprisingly close to the FP16 baseline. The reasoning backbone is encoded in the sign pattern of the weights, and sign information survives even extreme compression.

## Architecture: hybrid attention buys context length

The base model is **Qwen3.6-27B**, a 27B hybrid-attention causal language model. The architecture itself is unchanged, which is why the distillation does not require rebuilding the transformer from scratch.

The key feature is the attention mix: roughly **75% linear attention** and **25% full attention**, spread across 64 layers. Linear attention layers use a recurrent-style state update, so their KV cache grows slowly with context length. Full attention layers handle the heavy relationship modeling where needed.

This hybrid design is what lets a 27B model hold a **262K-token context** on-device. With the standard 4-bit KV cache, the full context window fits in about **9.4 GB of peak memory** for the 1-bit model and **12.8 GB** for the ternary model. Without hybrid attention, the KV cache alone would dominate the memory budget.

## Distillation: not just quantization, but target-aware training

The word "distillation" is used loosely in the AI world. Sometimes it means a smaller model trained on outputs from a larger one. Sometimes it just means quantization. Bonsai is closer to the first meaning, but with quantization baked into the training target.

Prism ML trains the low-bit model against the full-precision teacher while the low-bit weights are already constrained to {-1, +1} or {-1, 0, +1}. The loss function sees the quantization error during training, so the model learns weight patterns that remain useful after the extreme rounding. That is different from taking a trained FP16 model and rounding its weights afterward, which is what conventional post-training quantization does.

This target-aware training is why Bonsai avoids the "sub-4-bit collapse" that conventional quantization hits. A post-training "2-bit" build can look fine on MMLU but drop to 57.5 on AIME26 and 56.4 on LiveCodeBench. Bonsai holds those same reasoning-heavy benchmarks much higher.

## Speculative decoding with DSpark

Low-bit models are memory-bandwidth efficient, but raw decode speed still matters. Bonsai ships with an optional **DSpark** drafter layer. It is a small six-layer transformer trained against the low-bit target, with a semi-autoregressive, block-denoising objective and confidence-scheduled verification.

Because speculative decoding is lossless, the drafter only affects throughput, never output quality. The 1-bit Bonsai variant with DSpark reaches **143.8 tok/s** on an H100, a **1.37x** speedup over the base 104.8 tok/s. On Apple Silicon the verification pass does not yet amortize at batch size 1, so the drafter is not enabled by default there.

## Kernels: packed weights stay packed

A subtle but critical detail: the GGUF packs are consumed **directly**, not expanded back to FP16 during inference. The custom llama.cpp kernels in the Prism ML fork handle matrix multiplication with {-1, +1} or {-1, 0, +1} weights natively on CUDA and Metal. That keeps the memory-bandwidth savings real.

The Q1_0 format is already merged upstream in mainline llama.cpp for CPU, Metal, CUDA, and Vulkan. Ternary Q2_0 is partially upstream: CPU, Metal, and Vulkan work on mainline, while the CUDA path and the native 1.71-bit packing are still stabilizing. For now, the Bonsai demo repository ships pre-built fork binaries so everything works out of the box.

## Intelligence density as a design metric

Prism ML defines **intelligence density** as:

```text
D = -log2(1 - score/100) / size_GB
```

It is essentially how much capability you squeeze out of each stored gigabyte. By this measure, 1-bit Bonsai 27B scores **0.530**, the ternary variant scores **0.400**, and the densest conventional low-bit build (Qwen3.6-27B IQ2_XXS) scores **0.199**. FP16 sits at **0.051**.

That is the real thesis: instead of racing to more parameters, make each parameter carry more useful intelligence. The result is not just smaller models, but models that can run in places a 54 GB file never could.

## What this enables

The engineering choices add up to a few concrete use cases:

- **Laptop-local 27B coding agents** with a 262K context window
- **Privacy-sensitive or fully offline deployments**, because nothing leaves the device
- **Single-GPU serving** on a 24 GB consumer card with room for context and batches
- **Phone deployment** of a 27B-class model via MLX Swift on Apple Silicon

None of these were practical with a 54 GB FP16 model. The conventional "4-bit" build at 17.6 GB still excludes phones, many laptops, and tight cloud instances.

## Limitations and honest trade-offs

Bonsai does not repeal the laws of compression. The 1-bit variant retains **89.5%** of the FP16 average, not 100%. The ternary variant reaches **94.6%**. If quality is the only thing that matters and memory is unlimited, full precision is still better.

Agentic coding — multi-file edits, run-test-and-repair loops, tool orchestration — is also explicitly listed as not the strong target of this release. Prism ML says a Bonsai variant tuned for agentic coding is next on the roadmap.

Finally, native ternary kernels are not fully deployed. The ternary model currently stores its values in 2-bit slots, so the deployed footprint is ~7.2 GB instead of the theoretical 5.9 GB. That gap will close as the kernel ecosystem matures.

## Conclusion

Bonsai 27B is not just a quantized model. It is a re-argued case for what extreme quantization can do when training, architecture, and inference are co-designed. The binary and ternary formats are not afterthoughts; they are the target representation the model was trained to be good at.

For developers, the practical lesson is that the boundary between "cloud-only" and "local-first" models is moving faster than many of us expected. A 3.9 GB file can carry 27B-class reasoning. A 7.2 GB file can get within a few points of full precision. Both can run on hardware that is already on your desk or in your pocket.

The next questions are not whether these models work, but where to deploy them and what workflows they unlock. I will be watching the agentic-coding variant closely, because that is the line where local models could finally compete with cloud coding agents on real engineering tasks.

## References

- [Bonsai 27B 1-bit GGUF on Hugging Face](https://huggingface.co/prism-ml/Bonsai-27B-gguf)
- [Ternary Bonsai 27B GGUF on Hugging Face](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-gguf)
- [Bonsai Demo repository](https://github.com/PrismML-Eng/Bonsai-demo)
- [Prism ML](https://prismml.com/)
- [Qwen/Qwen3.6-27B](https://huggingface.co/Qwen/Qwen3.6-27B)
