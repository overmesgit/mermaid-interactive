# ADR-017 One header row, help behind ?, system font

- Status: accepted
- Date: 2026-10-11

## Context

The header, the tab bar, and the stage bar stacked three rows above the diagram, and a hint line sat under it. The keyboard shortcuts were not written anywhere on the page. The page font was Aptos and Mermaid's was Segoe UI, so off Windows the two fell back to different faces.

## Decision

`#tabs` sits in the header between the title and the tools. The header wraps whole groups when the window is narrow.

The hint line is gone. A ? button in the camera controls, or the ? key, opens `#help`, a native `popover` that lists the gestures and the keys. Escape on the open help closes only the help.

The page and Mermaid both use `system-ui, "Segoe UI", Roboto, sans-serif`.

## Consequences

The diagram gets the height of a row and the hint line. The help needs a browser with the Popover API. The exported file keeps the help, because it clones the body.
