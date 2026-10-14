# ADR-022 Prev and Next sit on the top left of the diagram

- Status: accepted, partly superseded by [ADR-036](036-floating-controls.md): Prev and Next sit at the bottom centre now
- Date: 2026-10-11
- Supersedes: the stage-bar placement in [ADR-021](021-lesson-stays.md)

## Context

The bar above the diagram was too crowded. With Prev and Next beside the title, the summary, and the camera buttons, it wrapped into a second row.

## Decision

The controls sit on the diagram, at its top left. The stage bar is the title, the summary, and the camera buttons again. Dragging the diagram does not start from these controls.

## Consequences

Fit places the diagram below the controls, so a fitted picture is not covered. After a pan or zoom the controls can cover part of it. A long next title ellipsizes at the edge of the diagram. Other tabs still have no stepper.
