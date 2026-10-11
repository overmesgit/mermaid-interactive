# ADR-021 Prev and Next stay put, including inside a node

- Status: accepted
- Date: 2026-10-11
- Supersedes: drill hiding and the Back label in [ADR-020](020-lesson-steps.md)

## Context

Back sat next to the breadcrumb, so a longer title pushed it. The word also matched Escape and Backspace, which step up a drill. Opening a node's inner diagram hid the buttons, so the stage bar jumped.

## Decision

The control is Prev, not Back. It sits with Next and the count in the right side of the stage bar, beside the camera buttons, so the breadcrumb cannot move it.

A drill does not hide them. Prev and Next follow the lesson step the open view belongs to: the view itself, or the nearest parent that is in the lesson. Escape and Backspace still step up.

## Consequences

From a code walk, Next leaves that walk and opens the next lesson picture. Other tabs still have no stepper.
