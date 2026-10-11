# ADR-015 Drill-down zooms toward the shape, and each view keeps its camera

- Status: accepted
- Date: 2026-10-11

## Context

Drill-down swapped the SVG at once, so nothing showed where the new picture came from. Stepping back up ran `fit()` and lost the pan and zoom of the parent. The drill-down badge was a +, the same sign as the camera zoom-in button, although the two zooms are different gestures ([ADR-003](003-two-zooms.md)).

## Decision

`show(id, from)` takes the note that was drilled through. While `mermaid.render` runs, `leaveView` scales the old picture toward that shape and fades it out over 200ms. The new SVG fades in. A tab, a breadcrumb, or Escape only fades. With `prefers-reduced-motion` there is no animation.

Before a view is left, its camera is saved in `app.cams` by view id. Opening that view again restores it. A view seen for the first time runs `fit()`.

The drill-down badge is a ↘ on a green circle.

## Consequences

The camera is placed before the binder runs, so the matcher sees the new picture at its final scale. A saved camera can be off after a window resize. The Fit button resets it.
