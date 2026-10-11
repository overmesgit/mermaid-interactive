# ADR-010 Clicking a shape draws no box around its label

- Status: accepted
- Date: 2026-10-10

## Context

Clicking a flowchart shape drew a box with a scrollbar around its label. It looked like a glitch.

The cause: Mermaid puts each flowchart label in a frame (a `foreignObject`) that is slightly shorter than the text. A click focused that frame, so the browser drew a focus box, and the extra height showed a scrollbar.

## Decision

After each render, `relaxLabels` sets `overflow="visible"` on every `foreignObject` and grows its height to the label's `scrollHeight`. CSS does the same for overflow. A mouse click does not draw a focus outline. Keyboard focus still can, through `:focus-visible`.

## Consequences

Turning `htmlLabels` off would also remove the frame, and it would change how every label is drawn. This decision keeps HTML labels.
