# ADR 0002: UI stack

**Status:** accepted, 2026-11-04

## Context

The product summary planned Ant Design v5, and Peregrine uses antd. Design polish is a primary goal of Litmus, and the work follows Emil's design skills.

## Decision

**Base UI** for behaviour and accessibility, **Tailwind v4** for tokens and styling, **Motion** where CSS transitions aren't enough, and **our own components** in `apps/web/src/ui`.

- **Over antd:** polish would mean overriding an opinionated system, and v1 doesn't need its strengths, such as data tables and date pickers. The map itself is custom either way.
- **Over shadcn/ui:** it starts from a widely recognised look that we'd then have to remove. It's still useful as reference code.
- **Over Radix:** a close call. Emil's forms skill names Base UI as its default, and his motion guidance covers both.

## Consequences

- We own every component, which is real time on a part-time build. We only build what a slice needs.
- There's no component reuse with Peregrine.
- Features can't import Base UI directly. They use `apps/web/src/ui`, and lint enforces that.
