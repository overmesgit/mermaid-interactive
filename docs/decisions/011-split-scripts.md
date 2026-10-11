# ADR-011 Scripts split by job, still no build

- Status: accepted. The script list is superseded by [ADR-019](019-interaction-naming.md).
- Date: 2026-10-11
- Supersedes: [ADR-002](002-static-page.md)

## Context

`app.js` held navigation, SVG binding, the panel, the camera, and export. The binding is the part that is hard to follow, because it matches notes to SVG that Mermaid already drew. A UI library would not own that SVG.

Export still has to inline the page into one HTML file. A module graph or a compile step would have to be bundled at export time.

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
