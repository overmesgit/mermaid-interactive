# ADR-020 How moves with Back and Next

- Status: accepted, drill hiding and the Back label superseded by [ADR-021](021-lesson-stays.md)
- Date: 2026-10-11

## Context

In the How tab, moving to the next lesson step and opening a shape's inner diagram used the same ↘ badge. So a reader could not tell "move on" from "look deeper".

The breadcrumb made it worse. Each step was stored as inside the previous one, so on the last picture the breadcrumb listed all seven titles.

## Decision

The How tab has a `lesson`: the seven view ids, in order. Back, Next, and the count in the stage bar call `show()` with the neighbor id. `ArrowLeft` and `ArrowRight` do the same when the panel is closed, the help is closed, and focus is not in a field.

Those six pictures after the first have `parent: null`, so a lesson step has one crumb. The code walks keep their parents. They are not in the lesson, so the stepper is hidden there. Escape and Backspace still step up a drill. The ↘ badges that open the next picture stay.

## Consequences

A lesson step's hash is its own view id. A hash that still lists the old parent path opens the same picture, because `openFromHash` uses the last segment. Other tabs have no lesson, so they show no stepper.
