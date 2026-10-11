# ADR-015 Drill-down zooms toward the shape, and each view keeps its camera

- Status: accepted
- Date: 2026-10-11

## Context

Opening an inner diagram replaced the picture instantly, so the reader could not see where the new picture came from. Going back up reset the parent picture's zoom.

The badge that opens an inner diagram was a +, the same sign as the camera's zoom-in button, although the two do different things ([ADR-003](003-two-zooms.md)).

## Decision

`show(id, from)` takes the note that was drilled through. While `mermaid.render` runs, `leaveView` scales the old picture toward that shape and fades it out over 200ms. The new SVG fades in. A tab, a breadcrumb, or Escape only fades. With `prefers-reduced-motion` there is no animation.

Before a view is left, its camera is saved in `app.cams` by view id. Opening that view again restores it. A view seen for the first time runs `fit()`.

The drill-down badge is a ↘ on a green circle.

## Consequences

The camera is placed before the binder runs, so the matcher sees the new picture at its final scale. A saved camera can be off after a window resize. The Fit button resets it.
