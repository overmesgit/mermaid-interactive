# ADR-057 A tooltip is optional, and a lesson step's New is measured against every step before it

- Status: accepted
- Date: 2026-10-17
- Supersedes: in [ADR-043](043-status-and-weight.md) and [ADR-052](052-one-color-per-type.md), comparing a lesson step with only the step before it

## Context

The OAuth PKCE example was rebuilt after a reader's review, and two things in the page got in its way.

1. **Every part had to have a tooltip.** The reader found the tooltips noise: most repeated the shape's own label or the arrow's text, and each was one more layer to read. But a part with no tooltip showed an empty box on hover, and an arrow written as `[from, to]` got a made-up one, such as "App to API". So an author could not leave them out.
2. **New was measured against the step before only.** The lesson is now a normal login, then a theft, then the login with PKCE. The theft step leaves out most of the login, so on the PKCE step every message the login already showed, such as the API call, was marked New in green. Only the two PKCE messages were new to the reader.

## Decision

- `tooltip` is optional. A part without one lights up on hover and shows no box. Its card in the story and its note show no lead line. An arrow gets no tooltip unless the author writes one.
- A lesson step marks a part New only when no earlier step of the lesson showed it. The same goes for the check that the story links each part: a part any earlier step showed counts as introduced.

## Consequences

An author writes a tooltip only where it adds a fact the label cannot hold. The OAuth PKCE example has none.

Lessons whose steps each build on the one before mark the same parts as before. A lesson that steps aside, as a theft does, and comes back marks only what is really new.

The other examples keep their tooltips. Their `[from, to]` arrows no longer show "From to To" on hover, which only repeated the picture.
