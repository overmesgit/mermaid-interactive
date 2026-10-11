# ADR-014 Clicking a shape keeps the zoom and the position

- Status: accepted
- Date: 2026-10-11
- Supersedes: the `fit()` and 220ms parts of [ADR-003](003-two-zooms.md), and `fit()` after a drag in [ADR-009](009-panel-resize.md)

## Context

Clicking a shape to read about it reset the zoom and the position, so the reader lost the place they had zoomed into. Nothing in the picture showed which shape the panel was describing. And a shape with an inner diagram waited 220ms before its panel opened, which felt slow.

## Decision

A click opens the panel at once. A double-click that drills in still works, because `show()` closes the panel.

`markSelected` puts `is-selected` on the shape or arrow the panel describes. Hover and search do not touch that class. Closing the panel clears it.

Opening the panel, closing it, and ending a resize do not call `fit()`. `reveal()` pans the least distance that brings the selected shape back inside the viewport. The scale does not change. `fit()` still runs when a view opens and from the Fit button.

## Consequences

Zoom survives reading the notes. The panel flashes open for the first click of a double-click before the next view replaces it.
