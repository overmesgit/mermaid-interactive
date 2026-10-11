# ADR-018 Find shapes with one rule per chart type

- Status: accepted
- Date: 2026-10-11

## Context

Mermaid names a shape's SVG differently in each chart type, but one rule tried to find shapes in all of them. It accepted any element whose id ended in the chartId, and fell back to matching label text. So it sometimes picked a piece inside a shape instead of the whole shape.

Mermaid 11 also adds a render prefix, such as `diagram-2-`, to every id.

## Decision

The first line of the chart picks the pattern. The match is the shape group.

1. Flowchart: `g.node` ending in `flowchart-<note id>-<number>`.
2. C4: `g.node.c4-shape` ending in `-<alias>`.
3. Sequence: `name` on the top and bottom actor boxes. Lifelines are not boxes.
4. State: `g.node` ending in `state-<name>-<number>`.

There is no label-text fallback. [ADR-001](001-bind-the-svg.md) still holds: the page binds the SVG Mermaid already drew. Arrow matching is unchanged.

## Consequences

A note whose id is not in that pattern does not become a button. Two states with the same name would be two groups only if Mermaid gave both ids that ending. The How picture "Finding a box" teaches these four rules.
