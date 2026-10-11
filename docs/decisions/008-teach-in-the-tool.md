# ADR-008 How teaches in steps, with code in the panel

- Status: superseded by [ADR-012](012-markdown-notes.md)
- Date: 2026-10-10
- Supersedes: [ADR-007](007-file-map.md)

## Context

A file map and a short chat reply both failed as explanations. The request was to use the teach approach inside this diagram tool, in detail, with code.

Teach here means a series of pictures. Each picture repeats the last one and adds one piece. A list of functions is a reference, not the lesson.

## Decision

The How tab is seven pictures:

1. Mermaid draws the chart string.
2. The notes sit beside the chart.
3. `app.js` matches notes to shapes.
4. Hover lights the neighbors.
5. Click opens the panel.
6. Double-click draws another chart.
7. The wheel only scales.

The code lives in the panel, in `#panel-code`. Further pictures walk `show()`, finding a box, and finding an arrow. Each step is opened with the + on the newest shape. Older + badges open the code walks.

## Consequences

A behavior change that one of these pictures describes should update that view in `diagrams.js` in the same change. The chat reply is not the manual.
