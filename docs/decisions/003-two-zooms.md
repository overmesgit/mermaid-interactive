# ADR-003 Double-click opens an inner diagram. The wheel only zooms the camera

- Status: accepted, partly superseded by [ADR-014](014-selection-keeps-camera.md): `fit()` and the 220ms, [ADR-015](015-drill-transition.md): the + badge is now ↘, and [ADR-044](044-back-undoes-every-move.md): Back steps back inside the page
- Date: 2026-10-10

## Context

"Zoom in" could mean two different things: open the diagram that belongs to a shape, or look more closely at the current picture.

## Decision

A shape with `zoom` set drills in. Double-click, the + badge, or Enter calls `show(id)`, which replaces the SVG with the child view. The breadcrumb walks `parent`. The hash is updated with `replaceState`, so the browser Back button leaves the page.

The wheel, the + and − buttons, and dragging empty space change `cam`, which is `{x, y, s}` on `#camera`. That never loads another view. `fit()` runs when a view opens and when the panel opens or finishes a resize, because the stage width changed.

A shape that can drill in waits 220ms before the panel opens, so the double-click can cancel the click. The + badge does not wait.

## Consequences

The two gestures stay distinct. A reader can scale a picture without losing their place, and can still open the inner diagram.
