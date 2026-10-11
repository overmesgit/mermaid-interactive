# ADR-021 Prev and Next stay put, including inside a node

- Status: accepted, placement superseded by [ADR-022](022-lesson-on-diagram.md)
- Date: 2026-10-11
- Supersedes: drill hiding and the Back label in [ADR-020](020-lesson-steps.md)

## Context

The Back button moved around and was easy to confuse. A longer title pushed it sideways. Its name sounded like Escape and Backspace, which do something different: they leave an inner diagram. And opening an inner diagram hid the buttons, so the bar above the diagram jumped.

## Decision

The control is Prev, not Back. It sits with Next and the count in the right side of the stage bar, beside the camera buttons, so the breadcrumb cannot move it.

A drill does not hide them. Prev and Next follow the lesson step the open view belongs to: the view itself, or the nearest parent that is in the lesson. Escape and Backspace still step up.

## Consequences

From a code walk, Next leaves that walk and opens the next lesson picture. Other tabs still have no stepper.
