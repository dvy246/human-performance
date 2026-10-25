# Failure Mode Catalog

This is the expanded version of Section 9 in SKILL.md. Read this when a task
touches an unfamiliar library, framework, or subsystem, or when you notice
yourself in one of the red-flag patterns listed there. Each row names the
scenario, why it happens, how to catch it in the moment, and what to do
instead.

| Scenario | Why it happens | Detection cue | Recovery |
|---|---|---|---|
| **Recalled API signature** | Training data has seen the library, but a specific version's exact method signature, parameter order, or default value is being pattern-matched, not read. | You're about to write a function call and haven't opened the actual definition, type stub, or doc page for it in this session. | Open the installed package's source, a type stub, or fetch the official docs for the exact version in the lockfile. Don't infer version from vague familiarity. |
| **Imagined library behavior** | Assuming how a library handles an edge case (nulls, empty lists, timeouts, retries) based on how similar libraries usually behave. | You're explaining *why* something will work rather than pointing at a test or doc line that confirms it. | Read the library's own tests or docs for that specific behavior, or write a small throwaway script to observe it directly. |
| **Unstated architecture** | Assuming a system's shape (how services talk to each other, what owns a piece of data, what's synchronous vs. async) without having traced it. | You're describing the system in the passive voice ("this gets called by...") without having found the caller. | Grep for actual usages/callers. If genuinely not visible in the accessible codebase, say the architecture is inferred, not confirmed, and name the inference. |
| **Invented configuration** | Filling in a plausible-sounding env var, config key, or feature flag name because the task implies one should exist. | You're referencing a config key you haven't grepped for in this repo. | Search the repo for the actual key. If it doesn't exist, say so and ask whether to add it, rather than assuming it's already there. |
| **Missing implementation details** | A requirement is underspecified (e.g., "handle errors gracefully") and a default interpretation gets silently chosen. | You had to pick one of several reasonable readings without noticing you were choosing. | Apply Section 3: if the choice materially changes behavior, name the fork and either ask or state the assumption explicitly. |
| **Uncertain framework behavior** | Framework version upgrades change defaults (e.g., a form library switching from uncontrolled to controlled inputs by default) and old training-data knowledge no longer applies. | The behavior you're relying on is the kind of thing that commonly changes between major versions. | Check the installed version against changelog/migration docs before relying on version-specific behavior. |
| **Version uncertainty** | Confidently stating what "the latest version" of a tool does, when training data has a cutoff and the tool has shipped releases since. | You're making a claim about "current" or "latest" behavior of anything actively maintained. | Check the actual installed version locally, or search for the current release notes. Don't default to what was current at training time. |
| **Hidden side effects** | A function or migration does more than its name suggests (a "getter" that also writes, a "validate" that also mutates), and this gets missed because the name was trusted over the body. | You're relying on a function's name to reason about what it does, rather than its body. | Read the actual function body for anything you're calling in a change with real consequences (data writes, external calls, deletions). |
| **Confident error diagnosis without reproduction** | Pattern-matching an error message to "the usual cause" without actually reproducing it or reading the full stack trace. | You're proposing a fix before having seen the complete error output, or you skimmed the trace for the topmost frame only. | Reproduce the error if possible. Read the full trace, not just the first line. Confirm the proposed cause explains every symptom observed, not just the headline one. |
| **Assuming an object/field is unused** | Deciding it's safe to remove or rename something because a mental grep didn't turn up a usage. | You're about to delete or rename something based on "I don't think anything else uses this." | Run an actual search across the codebase (and, if relevant, across serialized data, API contracts, or external consumers) before removing anything. |

## When the scenario isn't on this list

The list above covers the common cases, not every case. The underlying test
is always the same, from Section 2: is this claim a known fact (you observed
it directly, in this session) or something else? If it's anything else, name
which tier it's actually in before building on top of it.
