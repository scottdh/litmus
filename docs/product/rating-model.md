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

## The yardstick

This goes on the face of the map, so nobody reads green as "ship it":

> Green means deployed to a real environment and completable end to end with realistic data. Mocks don't count.

## Evidence

Evidence is one of: a heuristic review, a quote, a clip or a metric.

**Record violations, not scores.** A heuristic review lists only the heuristics actually violated, each with a severity (cosmetic, minor or major). A review with no violations is valid evidence for green. Green can carry a cosmetic violation, but nothing above that.

## How it renders

- **Tasks stay in narrative order, always.** No sort by colour. Reordering turns a journey into a backlog.
- **The stacked bar under each activity is the executive read.** It shows the mix without averaging it.
- **Not applicable is distinct from not built,** so an empty band reads as honestly empty.

## Deliberately not

- **Percentages or scores.** They end up in a deck, and the nuance dies.
- **Auto-assigned colours.** Evidence can be generated. The colour stays human.
- **Parity scores against other products.** Fiction with a number on it.
