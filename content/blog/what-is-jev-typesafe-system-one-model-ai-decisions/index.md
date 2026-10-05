---
title: "What Is Jev? A Practical Introduction to TypeSafe's System One Model"
date: "2026-10-05"
description: "Learn what Jev is, how TypeSafe's System One model returns typed decisions, and when AI agents can use Choice, Score, and Noul instead of an LLM call."
tags: ["AI", "LLM", "AI Agents", "Jev", "TypeSafe", "Coding", "DeveloperTools"]
---

Imagine a coding agent is about to run a command. Your application wants to know whether that action matches the task, could damage data, or should be reviewed by a person. A general-purpose LLM can answer those questions and can even return schema-constrained output, but it is still a generative model. For simple decisions made frequently, generating an answer may add more latency and token cost than the workflow needs.

Jev takes a different approach. It does not write code or explain its reasoning in prose. You send it a state and a set of questions with defined answer types; it returns structured decisions and probabilities your application can use directly.

That makes Jev interesting as a decision layer inside an AI workflow. It does **not** make it a replacement for the coding agent or LLM that writes the code.

## What Is Jev?

Jev is a model from TypeSafe AI. The company calls its model category **System One**: models designed to make fast, structured judgments that software can consume. The name references the fast, intuitive thinking in Daniel Kahneman's _Thinking, Fast and Slow_; here, it is TypeSafe's product terminology, not a claim that the model literally reasons like a person.

The API has two main parts:

- **State:** the text or structured data the model should evaluate, such as a support ticket, an agent's plan, or a proposed tool call.
- **Questions:** the specific judgments you want Jev to make about that state.

Each question has a type that defines the shape of the answer. Jev evaluates independent questions about the same state in parallel, so you can send several in one request. Your application decides what to do with the returned values.

## The Three Question Types: Choice, Score, and Noul

Jev exposes three primitives. Choosing the right one makes the result easier for your code to use.

| Type       | Use it for                                                                      | What comes back                                                            |
| ---------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Choice** | Selecting one item from a known set, such as `billing`, `technical`, or `sales` | The selected option, probabilities for all options, and a confidence value |
| **Score**  | Placing something on an ordered rubric, such as low, medium, and high risk      | A score, its probability distribution, and a confidence value              |
| **Noul**   | Evaluating a yes/no statement, such as whether a message requests a refund      | A probability from 0 to 1 that the statement is true                       |

A `Noul` value near 1 is a strong “yes,” a value near 0 is a strong “no,” and a value around 0.5 means the model is uncertain between yes and no. It does not return a separate confidence field. For `Choice` and `Score`, confidence summarizes the answer distribution; it is useful as a signal for routing uncertain cases, not a guarantee that the answer is correct.

The options and rubric are defined by your application. Jev does not invent a new category or return free-form text when your code expects one of the choices you specified.

## A Practical Example: Add a Decision Check to a Coding Agent

Suppose an agent has a task, a plan, and a pending tool call. Jev can assess whether the call fits the task and whether it could irreversibly affect data. The application still owns the policy and decides whether to continue, pause, or ask for human review.

Install the Python SDK and set your API key:

```bash
$ pip install typesafe-sdk
$ export TYPESAFE_API_KEY="your-api-key"
```

Then define the state and ask a few bounded questions:

```python
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

state = {
    "task": "Add retry logic to the payment worker.",
    "agent_plan": "Update the worker and run its payment tests.",
    "proposed_action": {
        "tool": "bash",
        "command": "pytest tests/payments -q",
    },
}

with TypeSafeClient(model="jev-1.13.0") as client:
    response = client.system_one(
        state=state,
        questions={
            "task_fit": Choice(
                instructions=(
                    "How does `proposed_action` relate to `task` and `agent_plan`?"
                ),
                criteria={
                    "aligned": "Directly supports the task and plan.",
                    "possibly_related": "Could be useful, but the connection is unclear.",
                    "unrelated": "Does not support the task or plan.",
                },
            ),
            "risk": Score(
                instructions=(
                    "How much risk of irreversible impact does `proposed_action` carry?"
                ),
                criteria=[
                    "Read-only or routine local check.",
                    "May change local project files or state.",
                    "May delete data or affect a shared or production system.",
                ],
            ),
            "irreversible": Noul(
                instructions=(
                    "Could `proposed_action` irreversibly delete or overwrite data?"
                ),
            ),
        },
    )

task_fit = response.answers["task_fit"]
risk = response.answers["risk"]
irreversible = response.answers["irreversible"].noul

if (
    task_fit.choice != "aligned"
    or task_fit.confidence < 0.65
    or risk.score >= 1.5
    or irreversible >= 0.5
):
    next_step = "pause for review"
else:
    next_step = "continue through the application's normal policy checks"

print(next_step)
```

The thresholds are examples, not safe defaults. Set them using representative tasks and measure the cost of false positives and false negatives. Jev evaluates the proposed action; it does not execute it, grant permissions, or replace deterministic controls in your application.

This is also not a drop-in model setting for Claude Code, Codex, Cursor, or another coding agent. Jev is a separate API call made by your tool or orchestration code. The existing coding agent remains responsible for planning, editing files, running tests, and explaining the result.

## What the Speed and Accuracy Claims Mean

At the time of writing, TypeSafe lists Jev at **$0.042 per million input tokens**, with output tokens free. The company reports typical end-to-end latency in the 70–500 ms range. Actual latency depends on network conditions, request size, and service load; TypeSafe also notes that rate limits can change.

TypeSafe's public four-workflow evaluation reports 67.8% average agreement with its reference answers for Jev, with an average cost of $0.0004 and latency of 0.4 seconds per case. Read that as **provider-reported evaluation evidence**, not a universal accuracy guarantee. TypeSafe says its reference labels are generated by averaging the responses of GPT-6 Astra and Claude Fable 5.1, both at high reasoning, and that the workflows were built by its own model capabilities team. The labels are therefore model-derived references, not independent human ground truth.

There is a small outside test worth keeping in perspective. Every's head of evaluations ran Jev on 777 judgments over 37 documents in under 0.7 seconds. In a separate test, Every's CEO gave Jev and Fable 5.1 four checks across 12 synthetic passages containing seven deliberately planted writing issues. Jev caught six of seven; Fable caught all seven. That is an informative early experiment, but not a broad benchmark proving either model's general accuracy.

The practical takeaway is narrower than “Jev is faster than GPT.” It is designed to make repeated, bounded decisions quickly and cheaply. Whether it is accurate enough for your workflow is something you have to test on your own examples.

## Why “It Can't Hallucinate” Needs a Footnote

TypeSafe says Jev cannot hallucinate or produce type errors. The useful, precise interpretation is that Jev's answer is constrained to the schema and answer space you supplied. A `Choice` cannot return a department name that was not one of your options.

That is **not** the same as always choosing the right department. Jev can return a valid but incorrect answer, just as a schema-constrained LLM can return valid JSON containing incorrect information. Structured Outputs in the OpenAI API can also enforce a JSON Schema; Jev's distinction is its decision-focused interface, the `Choice` / `Score` / `Noul` primitives, and its provider's approach to returning probabilities—not a unique guarantee of semantic truth.

Treat probabilities as inputs to your application's policy. For a low-impact routing decision, your threshold may allow automatic handling. For destructive or production actions, combine the model's judgment with hard rules, permissions, and an escalation path.

## Where Jev Fits—and Where It Does Not

Jev is a good candidate when a workflow repeatedly asks a question whose answer space is known in advance:

- **Ticket routing:** choose a team from a fixed list.
- **Task triage:** score urgency or impact against a rubric.
- **Agent guardrails:** classify whether a proposed action is off-task or potentially destructive before the tool runs.
- **Model routing:** decide whether a request is routine enough for a smaller model or should go to a more capable one.
- **Quality checks:** evaluate whether a generated answer meets a small set of criteria before returning it.

It is the wrong tool when you need code generation, a written explanation, open-ended conversation, or extended multi-step reasoning. It does not accept images, audio, or video directly; convert non-text data into text or structured fields before sending it as state.

Jev's current documented context budget is 64K tokens for the state plus all questions, with a 32K limit for the state plus the longest question. English is the primary training language and the language where TypeSafe says accuracy is best. Other languages, including Portuguese, are supported less consistently, so test with real examples in the language your application will use.

## Limitations to Test Before Production

TypeSafe publishes a “jaggedness” guide for Jev 1.13. These limitations should shape the workflow around the model:

1. **Make each question one clear judgment.** You can batch several independent questions about the same state in one request. Break a broad, multi-part judgment into smaller questions, then combine the results in ordinary code.
2. **Keep arithmetic, counting, and date comparisons in code.** Jev is intended for semantic judgments, not exact calculations.
3. **Send only relevant state.** The model's accuracy can fall when unrelated context distracts from the decision.
4. **Test adversarial inputs.** Text inside the state can influence the result; treat retrieved pages and user-controlled content as untrusted.
5. **Check option order and edge cases.** TypeSafe notes that Choice option ordering can sometimes affect an answer.
6. **Pin a version when thresholds matter.** The `jev-latest` alias can move when TypeSafe releases a new version. Log the returned model ID or pin a version such as `jev-1.13.0` while validating a deployment.

Build a small labeled test set from actual production-like inputs. Track per-class precision and recall for `Choice`, false positives and false negatives for `Noul`, score agreement for `Score`, calibration at the thresholds you plan to use, latency, and cost per accepted decision. Include the cases where getting it wrong is most expensive.

## The Bottom Line

Jev is best understood as a specialized decision component for software, not as a coding assistant. It takes a state, answers bounded questions using typed values and probabilities, and lets your code own the next step. That can make high-volume decisions cheaper and faster, especially when you already know the answer categories you need.

The trade-off is that you must define those categories and policies yourself, and Jev can still make the wrong decision. Start with one narrow workflow, evaluate it against your own data, and keep your application's permissions and review rules in control. For a broader look at assigning different models different jobs, see [Multi-Model Orchestration with OpenCode](/multi-model-orchestration-opencode/).

## References

- [TypeSafe Quick Start and Python SDK](https://docs.typesafe.ai/introduction/quickstart)
- [TypeSafe System One overview](https://docs.typesafe.ai/concepts/system-one)
- [TypeSafe question primitives: Choice, Score, and Noul](https://docs.typesafe.ai/primitives)
- [Jev models, pricing, context, and language support](https://docs.typesafe.ai/models)
- [Jev 1.13 known limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
- [Jev with coding agents: what it is and is not](https://docs.typesafe.ai/introduction/coding-agents)
- [TypeSafe's System One and Jev announcement](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- [TypeSafe workflow evaluation and methodology](https://evals.typesafe.ai/)
- [Every's independent Jev experiment](https://every.to/vibe-check/mini-vibe-check-typesafe-s-jev-judged-everything-i-ve-written-in-0-7-seconds)
- [OpenAI Structured Outputs documentation](https://developers.openai.com/api/docs/guides/structured-outputs)
