# ADR-040 The skill teaches the tool first. How to explain comes later

- Status: accepted
- Date: 2026-10-15
- Postpones: the how-to-explain part of `SKILL.md` in [ADR-025](025-explainer-skill.md)

## Context

`SKILL.md` had grown into two things: a manual for the tool, and advice on how to explain well, drawn from `explain-difficult-things/`. The advice is not settled yet. Mixed into the manual, it also made the skill harder to read, so an agent or a person looking for how to use the tool had to read past teaching advice to find it.

## Decision

`SKILL.md` only teaches the tool: what the reader gets, what to write, a short content file that works, how to build and check `explanation.html`, the mistakes that are easy to make, and how to show code from the repo.

The explanation advice moves to `explain-difficult-things/skill-draft.md`, unchanged, until it is ready to go back into the skill.

## Consequences

The skill is shorter, and every line in it is about the tool. An agent using it gets no advice on how to structure an explanation. The example in `references/format.md` still shows one good structure.

The short content file in `SKILL.md` was checked in the page. It draws with no problems, so it can be copied as a start.
