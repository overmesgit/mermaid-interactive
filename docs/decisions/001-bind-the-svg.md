# ADR-001 Bind the SVG Mermaid already drew

- Status: accepted
- Date: 2026-10-10

## Context

The page needs browser diagrams, a tooltip, a side panel on click, drill-down when a shape has its own diagram, and an export to one HTML file. The starting question was whether Mermaid could be extended.

A custom Mermaid diagram type would mean a new parser and a new renderer. Flowchart, C4, sequence, and state would not share one panel.

## Decision

Call `mermaid.render`, then bind the SVG this page already has. `securityLevel` is `strict`, so Mermaid's click syntax stays off. `app.js` attaches the tooltip, the panel, and drill-down.

Nodes and arrows carry their notes beside the chart string, in `diagrams.js`. Mermaid never reads those notes.

## Consequences

One binder covers all four diagram types. Matching arrows is type-specific, because each type draws lines differently. That matcher is `bindEdges` in `app.js`.

Export can inline this page's CSS and scripts. Mermaid itself still comes from the CDN.
