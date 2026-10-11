# ADR-016 The panel links to the connected shapes and arrows

- Status: accepted
- Date: 2026-10-11

## Context

The panel described one shape or arrow. To read the next hop, the reader had to find it in the picture.

## Decision

`renderLinks` fills `#panel-links` from the current view's `edges`. An arrow lists From and To. A shape lists each arrow as In or Out, named by the node at the other end, plus the arrow label when it is not an `A → B` default. State start and end dots show as start and end. A link calls `openPanel` with that note, so selection and `reveal()` apply as for a click.

## Consequences

The links come from the notes, not from the SVG. An edge that the matcher could not bind still has a link, and its panel opens without a highlight.
