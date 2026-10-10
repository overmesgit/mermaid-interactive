# ADR-010 A click does not frame the label

- Status: accepted
- Date: 2026-10-10

## Context

Flowchart labels are HTML inside a `foreignObject`, because `htmlLabels` is on. The label was a fraction taller than the frame Mermaid assigned. A click focused that HTML, and the browser drew a box with a scrollbar around the text.

## Decision

After each render, `relaxLabels` sets `overflow="visible"` on every `foreignObject` and grows its height to the label's `scrollHeight`. CSS does the same for overflow. A mouse click does not draw a focus outline. Keyboard focus still can, through `:focus-visible`.

## Consequences

Turning `htmlLabels` off would also remove the frame, and it would change how every label is drawn. This decision keeps HTML labels.
