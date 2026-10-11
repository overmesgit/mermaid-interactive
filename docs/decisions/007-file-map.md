# ADR-007 Explain the page with a map of its files

- Status: superseded by [ADR-008](008-teach-in-the-tool.md)
- Date: 2026-10-10

## Context

The page was asked to explain its own implementation, with code and architecture. The first How tab listed `index.html`, `diagrams.js`, `app.js`, and the functions that bind the SVG.

## Decision

Put that map in the How tab, with drill-down into the data, `show()`, binding, and input.

## Consequences

The tab rendered, and one of its views could only be opened from the URL. The explanation was rejected. See the feedback log. ADR-008 replaces this choice. This file stays as the record of what was tried.
