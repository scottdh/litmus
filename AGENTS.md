# AGENTS.md

The briefing for anyone working here. Read all of it; it's short on purpose.

**Decision-maker:** Scott Herrington decides product and design. When you need a decision, move the issue to Human needed with the exact question and options, your recommendation first.

**Precedence:** this file wins on tooling and process. `docs/product/` wins on product behaviour. If they really conflict, or the sources disagree, work under the interim assumption in `docs/agents/open-conflicts.md`. Don't invent a third answer.

## The rules

1. **Check for overlap, then claim on the board before writing code.** Assign the issue to Scott and set it to In progress. If it overlaps an older issue, don't start. _Why:_ the board is the only shared record of what's happening.
2. **Scope paths are where you start, not a fence.** Make the small outside change a ticket needs, and say what and why in the PR. _Why:_ stopping to ask costs more than a clearly explained small change.
3. **Layers only point inward.** `kernel` ← `domain` ← `application` ← `adapters` ← composition. Only `apps/web/src/composition` picks adapters. _Why:_ domain rules stay testable with no I/O, and a screen can't quietly depend on a database. `pnpm arch` enforces this.
4. **Run only the tests your change touches.** `pnpm test:related <files>`. CI runs the rest. _Why:_ full local runs are slow, and red can't merge anyway.
5. **Work in your own worktree and branch, land with `pnpm pr`, then stop.** Name the branch `<type>/<slug>-<issue>` so the PR closes the issue. Don't wait on CI. _Why:_ shared checkouts mix changes, and waiting costs money.
6. **Red, green, refactor, as separate commits.** `test(x): specify …`, `feat(x): …`, `refactor(x): …`. Refactor never changes behaviour. _Why:_ history shows the tests came first.
7. **No real data in this repo.** No transcripts, clinician or customer quotes, or findings from any employer's product, including in seeds, fixtures and tests. Sample data is invented. _Why:_ this is a personal repo, and ownership of work data hasn't been cleared (`docs/agents/open-conflicts.md`). Git history is hard to clean.
8. **Hold the product invariants.** A human sets every colour. AI suggestions never commit themselves. No percentages or scores on the map. Tasks stay in narrative order, with no sort by colour. _Why:_ these are what stop the map gaining authority it hasn't earned, or turning into a backlog (`docs/product/rating-model.md`).
9. **UI work gets a design pass before it lands.** Follow `DESIGN.md`, then run `emil-ui-review` and `emil-unslop-design` on the diff. Fix findings, or list them on the issue for Scott. _Why:_ design polish is a primary goal of this product, and lint can't judge craft.

If a rule matters, a tool should enforce it. When you find one that's only written here and could be checked, add the check.

## What to read, and when

Don't read everything. Read the one you need.

| When you're                                  | Read                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| Working out what the product is and isn't    | `docs/product/brief.md`                                                          |
| Touching lights, evidence or ratings         | `docs/product/rating-model.md`                                                   |
| Building any UI                              | `DESIGN.md` and `docs/agents/skills.md`                                          |
| Writing a design before a build              | `docs/designs/_template.md`                                                      |
| Wondering why the repo is shaped this way    | `docs/adr/0001-adapting-the-peregrine-blueprint.md`, `docs/adr/0002-ui-stack.md` |
| Hitting a contradiction between sources      | `docs/agents/open-conflicts.md`                                                  |
| Finding a plain error in a doc you don't own | `docs/agents/doc-defects.md`                                                     |

## Standards

- **Simple over clever.** Comments only when a human needs them.
- **Time comes from the injected Clock** in `kernel`, `domain` and `application`. Lint enforces this.
- **Errors use the closed set in the kernel,** with stable SCREAMING_SNAKE codes. Never render a raw `error.message`.
- **Commits are conventional:** `type(scope): sentence`. commitlint enforces this.
- **Versions are pinned exactly.** Renovate moves them.
- **Answer from the code.** Cite file and line, separate what you read from what you inferred, and say what you didn't check.
- **Write down what you learn.** Gotchas and rejected approaches go in `docs/` or an ADR, and hand-offs go in issue comments. A chat isn't a record.
- **Batch small work.** A doc tweak or a change under about 30 lines goes in a PR you're already making, or onto an open ticket.

## Commands

| Command                                   | Does                                                           |
| ----------------------------------------- | -------------------------------------------------------------- |
| `pnpm dev`                                | Runs the web app                                               |
| `pnpm check`                              | Typecheck, lint, architecture rules, doc paths                 |
| `pnpm test` / `pnpm test:related <files>` | All tests / only those your change touches                     |
| `pnpm build`                              | Production build                                               |
| `pnpm pr`                                 | Rebase, scan for secrets, push, open the PR, enable auto-merge |

## Tickets

Every issue uses `.github/ISSUE_TEMPLATE/ticket.yml`: Why, Goal, Acceptance criteria, Design goals (design tickets), Scope paths, Out of scope. Statuses: In discovery, Planned, In progress, In review, Human needed, Blocked, Done. Priorities: P0 (this week) to P3 (someday). The design doc is the spec, and the ticket points at it.
