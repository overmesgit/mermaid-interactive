# ADR-005 Hover dim stays light

- Status: accepted
- Date: 2026-10-10

## Context

Hover highlights a shape and the arrows that touch it, and dims the rest. The first dim was strong enough that the rest of the picture disappeared. The feedback called that destructive.

## Decision

Unrelated shapes use `.is-dim` at opacity 0.72. Leaving the shape runs `applySearch()`, so the highlight does not stick after the pointer leaves. Search uses the same dim and also matches arrow text.

## Consequences

The picture stays readable while one relationship is emphasized. A later change to the strength of the dim needs a new ADR.
