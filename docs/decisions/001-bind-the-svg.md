# ADR-001 Bind the SVG Mermaid already drew

- Status: accepted
- Date: 2026-10-10

## Context

Mermaid draws good diagrams, but it has no side panel and no way to open one diagram from a shape in another. Its own click handlers work only in some chart types, and only with a looser security setting. The page needed all of this on four chart types: flowchart, C4, sequence, and state.

Extending Mermaid with a new diagram type would mean writing a new parser and a new renderer. Even then, the four chart types would not share one panel.

## Decision

Call `mermaid.render`, then bind the SVG this page already has. `securityLevel` is `strict`, so Mermaid's click syntax stays off. `app.js` attaches the tooltip, the panel, and drill-down.

Nodes and arrows carry their notes beside the chart string, in `diagrams.js`. Mermaid never reads those notes.

## Consequences

One binder covers all four diagram types. Matching arrows is type-specific, because each type draws lines differently. That matcher is `bindEdges` in `app.js`.

Export can inline this page's CSS and scripts. Mermaid itself still comes from the CDN.
