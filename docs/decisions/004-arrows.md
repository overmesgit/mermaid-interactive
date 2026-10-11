# ADR-004 Arrows use the same notes and handlers as nodes

- Status: accepted
- Date: 2026-10-10

## Context

At first only shapes were clickable. Arrows often carry the most interesting part of a diagram, such as what is sent and why, so they needed the same tooltip, panel, highlight, and drill-down.

Arrows are harder to find than shapes, because each chart type draws and names its arrows differently.

## Decision

`current.edges` holds the same kind of notes as nodes, built with `link()`. `bindEdges` claims each arrow once, in this order:

1. Flowchart path id `L_from_to_n`, plus the nearest label within 160px.
2. Sequence message text, then the line. The note sets `match`.
3. C4 relationship text, in source order, so two arrows with the same label both bind.
4. State `path.transition`, by which node centers the line starts and ends at. Start and end dots use the id `*`.

The visible stroke is too thin to click. A transparent 18px hit stroke sits on top of it. The first stroke is the keyboard button.

## Consequences

An arrow can set `zoom` and open another diagram. Checkout's "New card" arrow and the login `POST /login` arrow do this. Arrow drill-down has no + badge. The tooltip says that a double-click opens the inner diagram.
