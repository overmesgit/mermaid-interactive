# ADR-011 Split app.js into one script per job, still with no build

- Status: accepted, partly superseded by [ADR-019](019-interaction-naming.md): the names, and [ADR-054](054-one-editor-page.md): the script list lives in `page.html`, and Export reads no files
- Date: 2026-10-11
- Supersedes: ADR-002

## Context

All the code was in one file, `app.js`: navigation, the panel, the camera, export, and the matching of notes to Mermaid's SVG. The matching is the hardest part to understand, and it was hard to find in that file.

A UI framework would not help, because Mermaid owns that SVG, not the framework. Any split also had to keep export simple, because export inlines every script into one HTML file.

## Decision

Classic scripts, loaded in this order, sharing one `app` object. There is still no package manifest and no compile step. Mermaid 11 still loads from jsDelivr.

1. `js/state.js` holds the view, the camera, and the element refs.
2. `js/camera.js` pans and zooms `#camera`.
3. `js/highlight.js` dims on hover and applies search.
4. `js/panel.js` fills and resizes the details aside.
5. `js/bind.js` finds the shapes and arrows Mermaid drew and attaches the listeners.
6. `js/nav.js` owns `show()`. That is the only way to change the diagram.
7. `js/export.js` fetches those files and inlines them in this order.
8. `js/boot.js` initializes Mermaid and starts the page.

The How tab's matcher box is labeled Scripts. The match itself is `js/bind.js`.

## Consequences

`index.html` lists the same scripts, in the same order, as `APP_SCRIPTS` in `js/export.js`. Those two lists have to stay aligned. Arrow matching stays in `bindEdges`, and it is still type-specific.
