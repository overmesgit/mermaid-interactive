# ADR-019 Names show whether a thing is Mermaid's or ours

- Status: accepted, script list superseded by [ADR-023](023-export-script-list.md)
- Date: 2026-10-11
- Supersedes: the script list in [ADR-011](011-split-scripts.md)

## Context

Several names in the code meant more than one thing, so a reader could not tell whether a variable held Mermaid's drawing or this page's data. For example, `nodes` meant both the tooltip and panel data and the SVG groups Mermaid drew. `zoom` meant both opening an inner diagram and the camera zoom. `id` could be a chartId, a viewId, a DOM id, or a key this page made up.

## Decision

The names in [CONTEXT.md](../../CONTEXT.md) are the ones the code uses.

- A view stores `nodeInteractions` and `edgeInteractions`. `arrow()` builds an edge interaction. `opensView` is the viewId a double-click opens. `mermaidText` is the arrow label Mermaid rendered.
- A runtime interaction has `kind`. A node interaction has `chartId`. An edge interaction has `edgeId`, `from`, and `to`.
- `js/mermaid-svg.js` finds the Mermaid shape or arrow and returns elements. It does not attach listeners.
- `js/bind.js` wires those elements: `bindNodeInteractions`, `bindEdgeInteractions`, `wireShape`, `wireArrow`.
- `show(viewId, fromInteraction)` is the only way to change the diagram. `app.view` is the diagram on screen.

`index.html` and `APP_SCRIPTS` load `js/mermaid-svg.js` after `js/panel.js` and before `js/bind.js`.

The CSS classes `.is-node`, `.is-edge`, and `.edge-hit` stay. The matching rules from [ADR-018](018-box-by-chart-type.md) stay.

## Consequences

A reader can tell a Mermaid shape from a node interaction without reading the function body. The How tab and `docs/matcher.md` use these names. Export still inlines the scripts in the same order as `index.html`.
