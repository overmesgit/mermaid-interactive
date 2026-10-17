# ADR-042 A lit arrow flows from its start to its end

- Status: accepted, partly superseded by [ADR-043](043-status-and-weight.md): a step marks what it adds only when it shares a part with the step before, and in green. Nothing lights by search since [ADR-055](055-fewer-features.md)
- Date: 2026-10-15

## Context

A static arrow shows its direction only by a small head at one end. On a busy diagram, a reader often cannot tell which way data goes without following the line to its end. On a lesson step, the arrows the step adds look the same as the old ones until a reader opens the story's list.

Mermaid can animate an arrow itself, but only an arrow written with an id, as in `a e1@--> b`. Mermaid then names the drawn arrow after the id instead of its two ends, and ends are how this page finds an arrow's note ([ADR-004](004-arrows.md)). So that arrow would stop being clickable.

## Decision

The page animates arrows itself. A lit arrow is drawn dashed, and the dashes move from its start to its end. Mermaid draws every arrow in that direction, in all four chart types. An arrow is lit when:

- it is selected, because its note is open,
- a hovered shape, arrow, or part card lights it,
- it matches the search,
- or nothing is selected, and it is new on this lesson step. These arrows also turn the accent color, so a step shows what it adds before anything is clicked.

A reader whose system asks for less motion sees the color without the moving dashes.

The page lists an arrow id in a flowchart as a problem, and says why.

## Consequences

A writer gets moving arrows without writing anything. A lesson step's new arrows are marked by the step order the writer already gives.

A dotted Mermaid arrow, such as `-.->`, shows the page's dashes while it is lit, and its own pattern again after.
