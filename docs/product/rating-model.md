# Rating model

The backbone describes users' work and is product-agnostic. **Lights hang off a task × product pair**: the same task can have a different light per product.

## The lights

| Light            | Means                                                                                                  | Evidence |
| ---------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| **Grey**         | No path. The product doesn't attempt it.                                                               | None     |
| **Red**          | A path exists, but a competent user can't reliably finish it, or it costs so much they work around it. | Required |
| **Yellow**       | Finishable, with known heuristic violations or missing nice-to-haves.                                  | Required |
| **Green**        | Finishable, and a heuristic pass finds nothing material.                                               | Required |
| **Out of scope** | We _won't_, as opposed to we _haven't_.                                                                | None     |

- Half-built and unfinishable is **red, not grey**. Grey stays reserved for genuine absence.
- If a task wants two colours, it's two tasks. Splitting beats averaging.

## Tasks with subtasks

A task with subtasks doesn't get its own rating. Its light follows from its subtasks, so the two can never conflict, and nothing is averaged. A human still sets every subtask's light.

| Subtasks                                                         | Parent |
| ---------------------------------------------------------------- | ------ |
| All green                                                        | Green  |
| All grey                                                         | Grey   |
| Red, or red and grey                                             | Red    |
| Any other mix, including any yellow or red with something better | Yellow |

Out-of-scope subtasks are left out of the rule, because we've chosen not to do them. If every subtask is out of scope, so is the parent.

The parent also shows the mix of its subtasks, so a yellow task still shows what's inside it.

When a task becomes a parent, any review it had stays in its drawer, marked as no longer driving the colour. When a parent loses its last child, it becomes a plain task showing grey, and any earlier rating goes with it.

## Steps

A subtask can hold steps, which break it down further. Steps take no light and aren't rated. They change nothing about a subtask's light, a parent's light or a mix, so a person still rates the subtask as a whole. A step's note isn't evidence. See `docs/designs/steps-direction.md`.

## The yardstick

This goes on the face of the map, so nobody reads green as "ship it":

> Green means deployed to a real environment and completable end to end with realistic data. Mocks don't count.

## Evidence

Evidence is one of: a review note, a heuristic review, a quote, a clip or a metric.

**A review note is what people write today.** It's a line or two saying why the task has its light, typed when the light is set, and it's enough to pass the evidence rule. The structured kinds aren't entered in the product yet. They're a later iteration, most likely added by AI from research such as interview transcripts, and a human still sets the colour. See `docs/designs/rating-direction.md`.

**Record violations, not scores.** A heuristic review lists only the heuristics actually violated, each with a severity (cosmetic, minor or major). A review with no violations is valid evidence for green. Green can carry a cosmetic violation, but nothing above that.

## How it renders

- **Tasks stay in narrative order, always.** No sort by colour. Reordering turns a journey into a backlog.
- **The stacked bar under each activity is the executive read.** It shows the mix without averaging it.
- **Not applicable is distinct from not built,** so an empty band reads as honestly empty.

## Deliberately not

- **Percentages or scores.** They end up in a deck, and the nuance dies.
- **Auto-assigned colours.** Evidence can be generated. The colour stays human.
- **Parity scores against other products.** Fiction with a number on it.
