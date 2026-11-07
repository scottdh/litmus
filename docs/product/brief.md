# Product brief

**Pitch:** a tool that turns user story maps into a permanent, evidence-backed record of what users are trying to achieve and how well the product serves that, instead of a workshop artefact that dies after sprint planning.

**Working name:** the repo is `litmus`. Earlier documents call it StoryMap.

## The problem

Story mapping aligns teams around user goals, but it's usually built once, used to slice tickets, then abandoned. The team's shared understanding decays while the map goes stale.

## The idea

A long-lived map with three properties:

1. **Narrative-readable.** Anyone can read it left to right like a story, without training.
2. **Evidence-rich.** Task cards carry personas, thinking, information needs, quotes, clips and screenshots.
3. **Health-visible.** Every task carries a light showing how well the product supports it, backed by evidence. See `docs/product/rating-model.md`.

Each task can have a team: the people responsible for turning it green. Teams name the tasks they own, and order and nest them in the way that makes sense to them, all on one shared map. Agreeing that order is much of the point: it aligns teams on what users are trying to achieve, and in what order. The map changes a lot while teams work this out, and settles over time. See `docs/designs/teams-direction.md`.

Later mechanics:

- **AI-assisted building:** AI spots gaps in the map and puts them in a parking lot, for teams to place on the map themselves. It also summarises research on a task: what users are trying to achieve, their problems and pain points, and how-might-wes. Each summary links to the raw data, which stays in a research repository. It never commits on its own.
- **AI narration:** readable prose at task, activity and map level, from the structured data.
- **Delivery link-back:** delivery work links to the task it serves.
- **Dense view:** Story reads well but shows little at once, so a separate view will serve at-a-glance scanning. See `docs/designs/wall-direction.md`.
- **Scale:** a focus view with the backbone always visible and one activity expanded, rather than an infinite canvas.

## Not in v1

- A real-time multiplayer whiteboard. Workshops stay in Miro or FigJam; this is where understanding settles afterwards.
- A release-slicing or delivery tool. Jira keeps that job.
- A research repository. Evidence is linked, not stored.
- Deep third-party integration. Links and manual references only.

## Constraints

Built by one product designer with AI coding tools, part-time. This repo is a personal playground for refining the idea, and it isn't used for work. Any internal version at work is built separately. One editor, many readers, no real-time sync in v1. Design polish is a primary goal.

**Planned stack:** Next.js, Supabase (Postgres), Claude API, and the UI stack in `docs/adr/0002-ui-stack.md`.
