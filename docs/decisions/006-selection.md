# ADR-006 Double-click does not select the label

- Status: accepted
- Date: 2026-10-10

## Context

Double-click is the drill-down gesture. The browser also treats double-click as "select this word." The label highlight fought the drill-down. Text in the details panel still needs to be selectable.

## Decision

`#camera` and its contents use `user-select: none`. The viewport cancels `selectstart`. `onNodeDblClick` clears any selection that still happened. The panel is outside `#camera`, so its text stays selectable.

## Consequences

Dragging a selection across a diagram does nothing. Copying a note is done from the panel, or with Copy source for the Mermaid text.
