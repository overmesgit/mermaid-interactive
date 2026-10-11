# ADR-017 Fewer bars above the diagram, shortcuts behind ?, one font

- Status: accepted
- Date: 2026-10-11

## Context

Too much of the screen went to controls. Three bars sat above the diagram and a hint line below it. The keyboard shortcuts were not listed anywhere on the page. The page and Mermaid also used different fonts, so outside Windows the text looked inconsistent.

## Decision

`#tabs` sits in the header between the title and the tools. The header wraps whole groups when the window is narrow.

The hint line is gone. A ? button in the camera controls, or the ? key, opens `#help`, a native `popover` that lists the gestures and the keys. Escape on the open help closes only the help.

The page and Mermaid both use `system-ui, "Segoe UI", Roboto, sans-serif`.

## Consequences

The diagram gets the height of a row and the hint line. The help needs a browser with the Popover API. The exported file keeps the help, because it clones the body.
