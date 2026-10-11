# ADR-032 Each shape shows a short caption under its name

- Status: accepted
- Date: 2026-10-12

## Context

A diagram showed only the name of each shape. To learn what a shape does, a reader had to hover it or open its panel, one shape at a time. So following an explanation meant clicking through every box, even when one line per box would have been enough.

## Decision

Each shape carries a short caption under its name, written in the Mermaid label as `<br><small>…</small>`. Mermaid draws it as part of the label, so the box is sized to fit and long captions wrap. The page only changes its color, so Mermaid's measured size still fits. The engine does not add the caption itself, because that would mean rewriting the Mermaid source, and shapes are written in too many forms for that to be safe.

The How tab builds each lesson box from its label and a `caption` field, so a caption is written once and reused on every step.

## Consequences

The picture is denser, and a large diagram fits at a smaller scale. The caption, the tooltip, and the note now say the same thing at three lengths. The caption is a convention in the content format, not a field the engine reads, and it is documented in `skill/references/format.md`. It is tested only in flowcharts.
