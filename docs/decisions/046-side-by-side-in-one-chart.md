# ADR-046 Show a change side by side in one chart

- Status: accepted
- Date: 2026-10-16

## Context

The Go router example showed the router before the change and after it as two lesson steps. The reader had to keep the first in mind while looking at the second, so the change itself was hard to see.

A new kind of view with two diagrams would need the engine to draw, wire, and zoom two pictures at once.

## Decision

There is no new kind of view. A comparison is one Mermaid flowchart with two `subgraph`s, one per side, joined by an invisible link (`before ~~~ after`) so Mermaid puts them next to each other. Each side uses its own ids, such as `oldMux` and `newMux`, because one chart cannot have two shapes with the same id. The `status` field ([ADR-043](043-status-and-weight.md)) marks what is new, changed, or removed.

## Consequences

The page needs nothing new to draw a comparison, and every part on both sides is clickable as usual.

The same part has two ids, so its two notes are written separately. Hovering one side does not light the other.
