# ADR-018 A box is matched by chart type

- Status: accepted
- Date: 2026-10-11

## Context

`mermaidShapesFor` treated every diagram the same. It accepted any element whose id ended in the note id, unioned that with a `name` attribute, and fell back to label text. An inner element could win over the shape group.

Mermaid 11 draws a different id for each chart type, and prefixes it with the render id.

## Decision

The first line of the chart picks the pattern. The match is the shape group.

1. Flowchart: `g.node` ending in `flowchart-<note id>-<number>`.
2. C4: `g.node.c4-shape` ending in `-<alias>`.
3. Sequence: `name` on the top and bottom actor boxes. Lifelines are not boxes.
4. State: `g.node` ending in `state-<name>-<number>`.

There is no label-text fallback. [ADR-001](001-bind-the-svg.md) still holds: the page binds the SVG Mermaid already drew. Arrow matching is unchanged.

## Consequences

A note whose id is not in that pattern does not become a button. Two states with the same name would be two groups only if Mermaid gave both ids that ending. The How picture "Finding a box" teaches these four rules.
