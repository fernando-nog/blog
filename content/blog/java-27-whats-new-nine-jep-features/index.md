---
title: "Java 27 Is Here: The 9 JEPs Developers Should Actually Know"
date: "2026-10-20"
description: "Explore Java 27's nine JEPs, what is final versus preview, its performance and security changes, and whether this non-LTS release is worth adopting."
tags: ["Java", "JDK", "Java 27", "JEP", "Performance", "Security"]
---

Java 27 is no longer an upcoming release. It reached general availability on **September 15, 2026**, and it brings nine JDK Enhancement Proposals (JEPs) covering language features, runtime behavior, security, and APIs.

The number nine can be a little misleading, though. Four JEPs deliver final features, four are still previews, and one is an incubator API. That distinction matters if you are deciding what to try in a project and what to rely on in production.

## Java 27 at a Glance

JDK 27 is a feature release in Java's six-month release cadence, not a Long-Term Support (LTS) release. As of October 2026, Java 25 is the latest LTS version, and Oracle's published schedule lists Java 29 as the next planned LTS release for September 2027.

That does not make Java 27 unimportant. It is a production-ready JDK with changes worth evaluating, but teams that prioritize a longer-lived baseline may prefer an LTS release. For more background on the release cadence and LTS trade-offs, see [Java 8 vs. Java 21: Key Differences and Why You Should Upgrade](/java-8-vs-java-21-why-you-should-upgrade/).

## The Nine JEPs: Final, Preview, and Incubator

| JEP                                                                                            | Status in Java 27 | What it changes                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [523: Make G1 the Default Garbage Collector in All Environments](https://openjdk.org/jeps/523) | Delivered         | Selects G1 by default across environments, rather than only in server configurations.                                               |
| [527: Post-Quantum Hybrid Key Exchange for TLS 1.3](https://openjdk.org/jeps/527)              | Delivered         | Adds hybrid key-exchange groups to TLS 1.3, with `X25519MLKEM768` preferred by default.                                             |
| [531: Lazy Constants](https://openjdk.org/jeps/531)                                            | Third preview     | Adds a way to defer initialization of immutable values while allowing the JVM to optimize them like constants after initialization. |
| [532: Primitive Types in Patterns, `instanceof`, and `switch`](https://openjdk.org/jeps/532)   | Fifth preview     | Extends pattern matching and `switch` to work more uniformly with primitive types.                                                  |
| [533: Structured Concurrency](https://openjdk.org/jeps/533)                                    | Seventh preview   | Provides an API for treating related tasks running in different threads as one unit of work.                                        |
| [534: Compact Object Headers by Default](https://openjdk.org/jeps/534)                         | Delivered         | Makes compact object headers the default in HotSpot on 64-bit architectures.                                                        |
| [536: JFR In-Process Data Redaction](https://openjdk.org/jeps/536)                             | Delivered         | Redacts selected sensitive values from Java Flight Recorder data before they leave the process.                                     |
| [537: Vector API](https://openjdk.org/jeps/537)                                                | Twelfth incubator | Continues an API for expressing vector computations that can map to CPU vector instructions.                                        |
| [538: PEM Encodings of Cryptographic Objects](https://openjdk.org/jeps/538)                    | Third preview     | Adds a preview API for reading and writing PEM-encoded keys, certificates, and certificate revocation lists.                        |

“Delivered” means the JEP is included as a regular feature in JDK 27. Preview features and incubator APIs are different: both require explicit opt-in and may change in later releases, but they use different enablement mechanisms. Preview features use `--enable-preview`; incubator APIs are exposed as incubator modules. The Vector API remains incubating, so this release does not make it a stable Java SE API.

## Performance and Runtime Changes

Two delivered JEPs change runtime defaults. **G1 is now the default garbage collector in all environments**, not just server environments. You can still select a different collector explicitly, so constrained workloads should continue to be measured rather than assumed to benefit from the default.

**Compact object headers are also enabled by default** in HotSpot. On 64-bit architectures, the header is reduced from 96 bits to 64 bits. The goal is to reduce heap usage and improve object density and locality, but the benefit depends on the application; validate memory, garbage collection, and latency on your own workload.

If an application needs to compare behavior with the previous object-header layout, JEP 534 documents this opt-out:

```bash
$ java -XX:-UseCompactObjectHeaders -jar app.jar
```

JDK 27 also contains numerous runtime and platform fixes beyond the nine JEPs. The official [JDK 27 release notes](https://www.oracle.com/java/technologies/javase/27-relnote-issues.html) are the place to look for the longer list of changes.

## Security: Hybrid TLS and Safer Flight Recordings

JEP 527 adds **post-quantum hybrid key exchange for TLS 1.3**. The JDK's TLS implementation prefers the `X25519MLKEM768` group by default, which combines a traditional key-exchange mechanism with ML-KEM. A connection can use it only when the peer supports the group, and applications that explicitly set their named groups should check that configuration.

This is a change to key exchange, not a claim that every part of a TLS connection or application is now post-quantum secure. It is still important to test interoperability with the actual clients, servers, TLS providers, and network infrastructure you deploy.

JEP 536 makes Java Flight Recorder (JFR) recordings safer to share by allowing command-line arguments and initial environment-variable and system-property values to be redacted inside the process. That is useful for diagnostics where secrets might otherwise appear in recordings; teams should still review their recording configuration and handling practices.

Java 27 also includes a third preview of the **PEM encoding API**. It is intended to make it easier to read and write common cryptographic objects in PEM format, but it is not a final API yet. Do not treat it as a stable replacement for existing PEM libraries until it graduates from preview and you have evaluated the final API.

## Language and Library Previews

The preview of **primitive types in patterns, `instanceof`, and `switch`** continues Java's effort to make pattern matching more uniform. It can reduce awkward cases when code needs to inspect primitive values, but it is the fifth preview, not a feature that has reached final status.

**Structured Concurrency** is in its seventh preview. Its goal is to make related concurrent tasks easier to coordinate, cancel, and observe as a single unit. If you are exploring that area, see the existing [Java 21 concurrency overview](/java-21-concurrency-virtual-threads-revolution/) for background on the evolution of Java concurrency APIs.

**Lazy Constants** are also a preview. They defer the initialization of immutable values until needed while allowing the JVM to treat initialized values like constants for optimization. This can be interesting for expensive or data-driven initialization, but it is not a dedicated AI API—despite some release commentary connecting the idea to AI workloads.

Finally, the **Vector API** remains in its twelfth incubation. It gives Java developers a way to express data-parallel operations that can map to vector instructions on supported hardware. Its long incubation is a reason to experiment carefully, not to assume the API is finalized.

To compile and run preview code with JDK 27, use the preview flag for both steps:

```bash
$ javac --release 27 --enable-preview Main.java
$ java --enable-preview Main
```

Keep preview and incubator experiments isolated from code that depends on stable API contracts. The API or its behavior may evolve between releases.

## Is Java 27 Worth Adopting?

Java 27 is worth evaluating if you want its runtime and security improvements, or if your team already follows the six-month feature-release cadence. Start by running your test suite on JDK 27, checking your TLS peers, and measuring heap and garbage-collection behavior before changing production defaults.

If your organization prefers an LTS baseline, Java 25 remains the latest LTS release. Oracle's current JDK 27 download information says its binaries receive updates under Oracle's terms through March 2027, when JDK 28 supersedes them; support and licensing timelines vary by JDK vendor, so check the policy for the distribution you use.

The simplest takeaway is this: **Java 27 has four delivered JEPs worth evaluating now, four preview features to explore with opt-in, and one incubating API that is still evolving.** Read the release notes for the changes that are not covered by JEPs, then choose the release based on your support requirements and test results—not just the version number.

## References

- [OpenJDK: JDK 27 release status, features, and schedule](https://openjdk.org/projects/jdk/27)
- [Oracle: The Arrival of Java 27](https://blogs.oracle.com/java/the-arrival-of-java-27)
- [Oracle: JDK 27 Release Notes](https://www.oracle.com/java/technologies/javase/27-relnote-issues.html)
- [Oracle: JDK release list and LTS schedule](https://www.oracle.com/java/technologies/update-release-numbers-change.html)
- [Oracle: Java downloads and JDK 27 update information](https://www.oracle.com/java/technologies/downloads/)
- [JEP 523: Make G1 the Default Garbage Collector in All Environments](https://openjdk.org/jeps/523)
- [JEP 527: Post-Quantum Hybrid Key Exchange for TLS 1.3](https://openjdk.org/jeps/527)
- [JEP 531: Lazy Constants (Third Preview)](https://openjdk.org/jeps/531)
- [JEP 532: Primitive Types in Patterns, `instanceof`, and `switch` (Fifth Preview)](https://openjdk.org/jeps/532)
- [JEP 533: Structured Concurrency (Seventh Preview)](https://openjdk.org/jeps/533)
- [JEP 534: Compact Object Headers by Default](https://openjdk.org/jeps/534)
- [JEP 536: JFR In-Process Data Redaction](https://openjdk.org/jeps/536)
- [JEP 537: Vector API (Twelfth Incubator)](https://openjdk.org/jeps/537)
- [JEP 538: PEM Encodings of Cryptographic Objects (Third Preview)](https://openjdk.org/jeps/538)
