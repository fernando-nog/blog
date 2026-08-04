---
title: "Bonsai Distillation Explained: From Qwen3.6-27B to a Phone-Friendly 3.9 GB Model"
date: "2026-08-04"
description: "A step-by-step look at how Prism ML distilled a 27B parameter model into a 3.9 GB phone-capable file while keeping 89.5% of full-precision reasoning."
tags:
  [
    "bonsai ai",
    "model distillation",
    "quantization",
    "qwen",
    "on-device ai",
    "distillation",
  ]
---

Most people look at Bonsai 27B and see the headline number: a 27B-class model in 3.9 GB. The part that matters more is how it got there. Shrinking a model by 14x is easy if you are willing to destroy it. Keeping 89.5% of full-precision reasoning after that shrink is the hard part.

This post walks through the full pipeline, from the base model to the final GGUF file, in the order the choices were made. It is the story I wanted to read before I downloaded the weights. For a hands-on view of what the 1-bit model can do, see [my practical test](./can-a-3-9-gb-model-really-code-testing-bonsai-27b-1-bit-on-a-laptop/); for the engineering overview, see [how Bonsai 27B packs 27B-class reasoning into 1-bit weights](./how-bonsai-27b-packs-27b-class-reasoning-into-1-bit-weights/).

## Starting point: Qwen3.6-27B

The base model is **Qwen3.6-27B**, a 27.3B parameter causal language model. It uses a hybrid-attention architecture: roughly **75% linear attention** and **25% full attention**, spread across 64 transformer blocks, plus embeddings, LM head, and a vision tower.

In full precision, the language model alone is about **54 GB**. The model card reports 85.07 average across 15 thinking-mode benchmarks. Coding is 88.74, math is 95.33. That is the teacher everything is measured against.

The first thing Prism ML did was keep the architecture unchanged. Distillation is easier when the student has the same shape as the teacher. If you also want the student to be tiny, the trick is to change how the weights are represented, not how they are connected.

## Step 1: choose the weight alphabet

A normal neural network weight is a 16-bit or 32-bit floating-point number. Quantization replaces that rich number line with a small alphabet of allowed values. The smaller the alphabet, the fewer bits you need per weight.

Bonsai explores two alphabets:

- **1-bit**: {-1, +1} — one sign bit per weight
- **Ternary (2-bit slot)**: {-1, 0, +1} — adds a zero state

The 1-bit alphabet is the most aggressive. It can encode direction but not magnitude. The ternary alphabet can also suppress weak connections. That suppression turns out to matter a lot for categories like instruction following and agentic behavior.

Both alphabets are paired with **group-wise scaling**. Every 128 weights share one FP16 scale factor, so the per-weight cost becomes:

```text
1-bit:  1 sign bit + 16 scale bits / 128  = ~1.125 bits/weight
2-bit:  2 ternary slots + 16 scale bits / 128 = ~1.71 bits/weight (theoretical)
```

The ternary variant is currently stored in 2-bit slots, so its deployed footprint is ~7.2 GB instead of the theoretical 5.9 GB. Native ternary kernels will close that gap later.

## Step 2: train the student to already be quantized

This is the step that separates Bonsai from conventional quantization. A typical post-training quantization flow looks like this:

```text
Train in FP16  ->  Round weights to low-bit  ->  Hope for the best
```

Bonsai does this instead:

```text
Train a model whose weights are constrained to {-1, +1} or {-1, 0, +1}
```

During training, the forward pass uses the quantized weights. The backward pass learns to adjust the sign pattern and the shared scales so that the model still produces useful outputs. The loss signal sees the rounding error from day one, so the model learns to live inside the compressed format.

That is why Bonsai does not fall apart below 4 bits the way conventional quantization does. A post-training "2-bit" Qwen3.6-27B build can score 88.93 on MMLU-Redux while dropping to 57.5 on AIME26 and 56.4 on LiveCodeBench. The headline looks fine; the reasoning has collapsed. Bonsai keeps AIME above 87 and LiveCodeBench above 76 in its 1-bit form, and much higher in ternary.

## Step 3: distill against the full-precision teacher

The training objective is not just next-token prediction on raw text. It is a distillation loss against the **FP16 teacher**. The student is trained to match the teacher's output distribution, its hidden-state structure, or both, depending on the layer.

The exact recipe is in the Bonsai whitepaper, but the practical effect is easy to verify: the low-bit model copies the reasoning patterns of the original, not just its token statistics. That is how math and coding survive compression that normally kills them.

Prism ML also adds layer-specific hidden-state taps for the DSpark drafter. Five evenly spaced layers of the target model feed into a small six-layer drafter transformer, trained with a block-denoising objective and survival-probability weighting. The drafter is optional at inference time, but it is part of the same distillation pipeline.

## Step 4: pack into GGUF and keep weights packed at runtime

After training, the model is stored in the custom **GGUF Q1_0_g128** and **Q2_0_g128** formats. The `g128` suffix means the scale is shared across 128 weights. The packed weights are loaded directly into memory; inference kernels multiply matrices without expanding them back to FP16.

That last point is easy to miss and important. If a "tiny" model had to be decompressed to FP16 for every layer, the memory savings would be fake at runtime. Bonsai's custom kernels in the Prism ML fork of llama.cpp operate on the packed signs directly on CUDA and Metal. Q1_0 has already been merged upstream into mainline llama.cpp for CPU, Metal, CUDA, and Vulkan. Q2_0 is on mainline for CPU and Metal, with Vulkan merged and CUDA in review.

## Step 5: add the inference helpers

The final model is not just weights. The released GGUF repositories include:

- The language model file
- An optional DSpark speculative-decoding drafter
- An optional vision tower pack (loaded only when images are used)

The DSpark drafter adds about 1.79 GB in its default Q4_1 pack and gives a **1.37x** decode speedup on CUDA. Because speculative decoding is lossless, it changes speed but not output quality. On Apple Silicon the verification overhead does not yet amortize, so it is off by default there.

The vision tower is HQQ 4-bit and is loaded on demand. Text-only inference never allocates memory for it. That is another example of the format being honest about what is actually resident.

## What comes out at the end

| Step                     | What changes                      | Size    |
| ------------------------ | --------------------------------- | ------- |
| Qwen3.6-27B FP16         | Baseline                          | ~54 GB  |
| Distilled 1-bit Bonsai   | {-1, +1} weights, group scales    | ~3.9 GB |
| Distilled ternary Bonsai | {-1, 0, +1} weights, group scales | ~7.2 GB |

The quality retention is what makes the pipeline interesting. On the 15-benchmark thinking average, the 1-bit model reaches 76.11 (89.5% of FP16) and the ternary model reaches 80.49 (94.6%).

More revealing is the category breakdown. Math and coding stay within a few points of the teacher. Instruction following, agentic tool use, and vision take the bigger hits. The compression selectively hurts the tasks that need the most fine-grained control, while the tasks that depend on broad reasoning patterns survive.

## Why this matters for deployment

The practical result is that a 27B model can be deployed on hardware that normally tops out at 7B or 13B models. A single 24 GB GPU can serve the ternary variant with context and batch headroom. A modern iPhone can run the 1-bit variant through MLX Swift. A laptop can run either, offline, without a cloud subscription.

That changes the economics of local AI. The model is not just smaller; it is small enough to live in places that were previously reserved for tiny specialized models. And it is Apache 2.0 licensed, which means you can bake it into products without licensing gymnastics.

## Limitations to keep in mind

Distillation is not magic. The 1-bit model retains 89.5% of the FP16 average, not 100%. The ternary model reaches 94.6%. For the highest-stakes reasoning tasks, full precision is still better.

The agentic-coding use case is explicitly listed as a future target. Long-horizon, multi-file, run-test-and-repair workflows are not what this release is optimized for. I noticed the same boundary in my own tests: single-file generation is excellent, but multi-step planning with unseen files is still fragile.

Finally, the ternary variant's deployed size is larger than its theoretical minimum until native ternary kernels land. The gap is real but temporary.

## Conclusion

Bonsai 27B is a useful reminder that model compression and model capability are not opposing forces by nature. They only look opposed when compression is done as an afterthought. When the training objective, the weight format, and the inference kernels are designed together, the trade-off curve shifts.

The pipeline is conceptually simple: keep the architecture, restrict the weight alphabet, train inside that restriction, and serve the weights in their native packed form. The execution is hard, but the idea is clean. That is why a 3.9 GB file can still reason about code, math, and long documents.

For developers, the takeaway is not to abandon cloud models. It is that local-first, privacy-preserving, and low-cost AI just got a lot more capable. The next wave of interesting applications will not be the ones that use the biggest model, but the ones that use a model small enough to run where the user actually is.

## References

- [Bonsai 27B 1-bit GGUF on Hugging Face](https://huggingface.co/prism-ml/Bonsai-27B-gguf)
- [Ternary Bonsai 27B GGUF on Hugging Face](https://huggingface.co/prism-ml/Ternary-Bonsai-27B-gguf)
- [Bonsai 27B Whitepaper PDF](https://github.com/PrismML-Eng/Bonsai-demo/blob/main/bonsai-27b-whitepaper.pdf)
- [Bonsai Demo repository](https://github.com/PrismML-Eng/Bonsai-demo)
- [Prism ML](https://prismml.com/)
- [Qwen/Qwen3.6-27B](https://huggingface.co/Qwen/Qwen3.6-27B)
