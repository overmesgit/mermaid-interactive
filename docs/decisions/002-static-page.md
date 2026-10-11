# ADR-002 Static files, Mermaid 11 from a CDN

- Status: superseded by [ADR-011](011-split-scripts.md)
- Date: 2026-10-10

## Context

The export target is one HTML file that opens in a browser. A build step or a framework would have to be inlined or abandoned at export time.

## Decision

The page is `index.html`, `styles.css`, `app.js`, and `diagrams.js`. Mermaid 11 loads from jsDelivr. There is no package manifest and no compile step.

## Consequences

Preview needs a local HTTP server, because export reads those files. On this machine that server is a PowerShell `HttpListener` on port 8765. Python and Node were not available when the page was first served.
