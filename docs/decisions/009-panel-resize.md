# ADR-009 Drag the panel border to set its width

- Status: accepted
- Date: 2026-10-10

## Context

The details panel was a fixed 340px column. Reading the code samples in the How tab needed more or less width depending on the note.

## Decision

The left border of the panel is a drag handle. The width is `--panel-width` on the workspace grid. It stays between 240px and the width that leaves the stage 280px. Closing the panel and opening it again keeps the width. `fit()` runs when the drag ends.

When the window is narrow enough that the panel stacks under the diagram, the handle is hidden. There is nothing to drag sideways.

## Consequences

The stage and the panel share one row. A drag that is still in progress does not refit the camera on every move.
