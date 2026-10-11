# ADR-023 Export reads the script list from the page

- Status: accepted
- Date: 2026-10-11
- Supersedes: the `APP_SCRIPTS` list in [ADR-011](011-split-scripts.md) and [ADR-019](019-interaction-naming.md)

## Context

`js/export.js` kept `APP_SCRIPTS`, a copy of the script tags in `index.html`. The two lists had to be kept in the same order by hand.

## Decision

Export inlines every `<script src>` on the page that is not an `http(s)` URL, in page order. `index.html` is the only script list. `diagrams.js` is one of those scripts, so it no longer has its own fetch.

## Consequences

Adding, removing, or reordering a script is one edit in `index.html`. Each source is inlined as its own `<script>`, as on the page.
