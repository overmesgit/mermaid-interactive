# ADR-023 Export reads the script list from the page

- Status: accepted
- Date: 2026-10-11
- Supersedes: the `APP_SCRIPTS` list in [ADR-011](011-split-scripts.md) and [ADR-019](019-interaction-naming.md)

## Context

The list of scripts existed twice: in `index.html` and in `js/export.js`. Both had to be updated by hand, in the same order. Adding a script to one and forgetting the other broke the exported file.

## Decision

Export inlines every `<script src>` on the page that is not an `http(s)` URL, in page order. `index.html` is the only script list. `diagrams.js` is one of those scripts, so it no longer has its own fetch.

## Consequences

Adding, removing, or reordering a script is one edit in `index.html`. Each source is inlined as its own `<script>`, as on the page.
