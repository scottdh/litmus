# ADR 0001: Adapting the Peregrine blueprint

**Status:** accepted, 2026-11-04

## Context

The Peregrine blueprint describes a repo built for dozens of parallel agents across 24 Lambda services. Litmus has one part-time builder on Next.js and Supabase. The blueprint's own conclusion is that the conventions matter more than the stack, and that rules hold up under agents only when tools enforce them.

## Decision

Copy the guardrails and leave out the fleet.

**Kept:** `AGENTS.md` with reasoned rules, the board and ticket template, pinned versions, strict TypeScript, shared lint rules, layer rules in dependency-cruiser, tests-first commits, one CI gate, a `pr` command with gitleaks, and design docs with build splits.

**Improved on the original, from its own pushback:**

- commitlint actually exists.
- A doc-path check fails when a doc cites a missing path.
- A "Sample data" banner stops in-memory screens passing as finished.

## Left out, and what brings each back

| Left out                                            | Bring back when                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Turbo                                               | CI passes 5 minutes, or there are several apps                                                |
| Two TypeScript compilers                            | typecheck is slow enough to notice. typescript-eslint needs TypeScript below 6.1, so we pin 6 |
| Separate kernel, persistence and contracts packages | A second app needs only part of `packages/core`                                               |
| Service generator                                   | There's a second service to generate                                                          |
| Events, outbox, contract checks                     | A second service consumes our events                                                          |
| Merge queue                                         | The repo moves to an org and PRs collide often                                                |
| Dispatcher, lanes, budgets                          | More than two agents regularly run at once                                                    |
| Per-person and per-PR stages, affected-only deploys | There's more than one deployable, or real users to protect                                    |
| Red-main workflow                                   | `main` goes red without anyone noticing                                                       |
| i18n and its lint rule                              | A non-English audience is real                                                                |
| Persona runs, character layer                       | Persona runs: once there are real flows to walk. Character layer: not planned                 |
| Cost field on the board                             | Agent spend per ticket becomes a question                                                     |

## Consequences

There's less to maintain and a shorter path to product code, but no enforced protection against collisions between many agents. If that's ever needed, this table is the place to start.
