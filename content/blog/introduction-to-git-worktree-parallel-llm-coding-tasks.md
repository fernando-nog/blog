---
title: "Introduction to Git Worktree: Run Parallel LLM Coding Tasks in the Same Repository"
date: "2026-03-15"
description: "Learn how Git worktree lets you run multiple LLM-assisted coding tasks in parallel in a single repository, with a practical Codex workflow and cleanup best practices."
tags:
  [
    "git",
    "worktree",
    "llm",
    "codex",
    "developer-productivity",
    "ai",
    "workflow",
  ]
---

Picture this: you are in the middle of implementing a feature, production just reported a hotfix, and you also want your LLM coding agent to start a refactor in parallel. In a normal single-checkout workflow, you keep switching branches, stashing changes, and losing momentum. `git worktree` solves this cleanly by giving each task its own working directory while still pointing to the same repository history.

As of March 2026, this pattern is not just useful for humans. It is also a practical way to run parallel AI-assisted tasks (Codex or other coding agents) without branch collisions and context mixing.

## What Is `git worktree`?

`git worktree` is Git's native way to attach extra checkouts to the same repository. Instead of cloning the repo multiple times, you keep one object database and add multiple working directories that each point to their own branch or commit.

The key mental model is:

- shared Git history and objects (`.git` common data)
- isolated working directory per task (its own files, `HEAD`, and index)
- branch safety by default (Git prevents the same branch from being checked out in two worktrees at once)

Why this matters: a normal extra clone duplicates setup effort and can drift in remotes/hooks/config. A worktree gives you isolation without duplication, so switching context becomes changing directories, not stashing and re-checking out.

If you want to see this separation explicitly:

```bash
git rev-parse --git-dir
git rev-parse --git-common-dir
```

In a linked worktree, `--git-dir` points to the worktree-specific metadata, while `--git-common-dir` points back to the shared repository data.

## Why It Helps with LLM-Assisted Development

LLM coding workflows are naturally parallel:

- one task explores code paths
- one task implements a feature
- one task writes tests or docs

If you run all of that in one checkout, each task can step on the others (branch switches, uncommitted changes, mixed diffs). With worktrees, each agent session gets isolated files but still works against the same repository.

The result is:

- less stash-and-switch overhead
- cleaner diffs per task
- simpler reviews and safer merges

## Quick Start: Your First Worktree

Create a second checkout for a new branch:

```bash
git fetch origin
git worktree add -b feature/worktree-intro ../blog-worktree-intro origin/main
```

Open and work there:

```bash
cd ../blog-worktree-intro
git status
```

List all worktrees:

```bash
git worktree list
```

Remove when done:

```bash
git worktree remove ../blog-worktree-intro
# optional metadata cleanup
git worktree prune
```

## Practical Parallel Pattern for LLM Tasks

A simple layout:

| Task              | Branch                    | Directory          |
| ----------------- | ------------------------- | ------------------ |
| Main ongoing work | `main` or current feature | `./blog`           |
| Hotfix task       | `hotfix/login-timeout`    | `../blog-hotfix`   |
| Refactor with LLM | `refactor/content-seo`    | `../blog-refactor` |

Command setup:

```bash
# From main checkout

git fetch origin

git worktree add -b hotfix/login-timeout ../blog-hotfix origin/main
git worktree add -b refactor/content-seo ../blog-refactor origin/main
```

Now each terminal can run an independent workflow without context conflicts.

## Sample: Codex + `git worktree`

If you already use Codex in your daily workflow, run one session per worktree:

```bash
# Terminal 1
cd ../blog-hotfix
codex
# Prompt: "Fix the login timeout bug and add regression tests."

# Terminal 2
cd ../blog-refactor
codex
# Prompt: "Improve blog SEO metadata handling without changing behavior."
```

This keeps each Codex session focused on one branch and one diff.

If you use the Codex app, OpenAI also documents worktree-based parallel threads. Codex-managed worktrees are created under `$CODEX_HOME/worktrees`, and threads can be handed off between Local and Worktree modes.

## Important Gotchas

### 1. Same branch cannot be checked out in two worktrees

Git enforces one checked-out worktree per branch. If you try to check out the same branch twice, you will hit an error like:

```text
fatal: 'feature/a' is already used by worktree at '<WORKTREE_PATH>'
```

Use a different branch name per worktree, or work in detached HEAD mode for throwaway experiments.

### 2. Clean up stale worktrees

If a worktree directory is deleted manually, metadata can remain. Use:

```bash
git worktree prune
```

### 3. Submodule caveat

The Git manual still notes multiple checkout support has submodule limitations. If your repo relies heavily on submodules, test this workflow before adopting it broadly.

## Team Conventions That Make This Work

Adopt a few rules:

- one branch per task per worktree
- commit early, push often
- short-lived worktrees for short tasks
- delete worktree after merge
- keep branch names task-specific (`feature/*`, `fix/*`, `chore/*`)

Optional helper alias:

```bash
git config --global alias.wt "worktree"
```

Then:

```bash
git wt list
git wt add -b fix/header ../blog-fix-header origin/main
```

## When to Use This Pattern

Use `git worktree` when:

- you need to run multiple coding tasks in parallel
- AI agents are working on independent scopes
- context switching is slowing you down

Skip it when:

- task is tiny and quick
- team workflow is branch-light and sequential
- tooling assumes a single checkout path only

## Conclusion

`git worktree` is one of the highest-leverage Git features for modern AI-assisted development. It gives you parallelism without chaos: isolated task directories, cleaner diffs, and less branch thrashing.

If you use LLM coding agents like Codex, pairing one task per worktree is a practical default. You keep velocity high while preserving review quality and merge safety.

## References

- [Git documentation: `git-worktree`](https://git-scm.com/docs/git-worktree)
- [OpenAI Codex CLI documentation](https://developers.openai.com/codex/cli)
- [OpenAI Codex Worktrees documentation](https://developers.openai.com/codex/app/worktrees)
- [OpenAI Codex Multi-agents documentation](https://developers.openai.com/codex/multi-agent)
