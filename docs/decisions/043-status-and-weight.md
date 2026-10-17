# ADR-043 Each part can show its status and how much it matters

- Status: accepted, partly superseded by [ADR-052](052-one-color-per-type.md): no parts list under a story, and [ADR-055](055-fewer-features.md): no `weight` and no legend
- Date: 2026-10-16

## Context

Every shape looked the same: white, with a thin gray outline. So a reader could not tell which parts the change touched, which parts carry the point, or which parts have something worth opening. The Go router example showed this. A reader had to click each shape to find out.

The page did mark parts a lesson step adds, as NEW. But when a step draws a whole new picture, every part is new, so every part was marked, and the mark said nothing.

## Decision

A node or arrow note can have two new fields.

- `status` is `new`, `changed`, `removed`, or `problem`. The shape is filled and outlined in that status's color: green, amber, gray and dashed, or red. Because color must never be the only signal, the word is written too: on a chip in the panel's kicker, on the part's card, and in a legend under the summary. The legend lists only the statuses the picture uses.
- `weight` is `key` or `background`. A key part gets a heavy outline. A background part gets a pale box and quieter text.

Two marks are added without the author writing anything:

- A shape whose note has more than its tooltip, such as a body or facts, gets a small dot in its top left corner. Its card has the same dot. A shape with an inner diagram already has the ↘ badge instead.
- A part a lesson step adds gets the status `new`, unless the author gave it a status. This happens only when the step shares at least one part with the step before. A step with a new picture marks nothing.

The list under the story leaves out arrows that have nothing more than a tooltip. Their meaning belongs in the arrow's label on the picture.

The page lists a misspelt `status` or `weight` as a problem, because it would change nothing on screen.

## Consequences

An author marks a change once, on the part, and the picture, the panel, and the legend agree. Selection still draws on top of the status color, so the selected part stays clear.

This replaces the part of [ADR-042](042-lit-arrows-flow.md) that marked every added part on any lesson step.
