# ADR-024 How notes show a function by name instead of a pasted copy

- Status: accepted
- Date: 2026-10-11
- Supersedes: the copied code in How notes from [ADR-013](013-notes-in-templates.md)

## Context

The same code was copied into several side panels. When the code changed, every copy had to be updated by hand. Some were missed, so panels showed code that no longer existed. For example, `show()` was copied into six notes.

## Decision

A fence written as `~~~js source=show,openPanel` has no body. The panel fills it with each named function's source, read from the loaded page with `Function.prototype.toString`. The names must be top-level function declarations in `js/`. A name that is not loaded shows a comment saying so.

Code that is not a whole function stays written in the note: the Mermaid config, data shapes, CSS, and short excerpts of a few lines.

## Consequences

A renamed or deleted function shows "is not loaded" in its note, so a stale reference is visible on the page. A note shows the whole function, not an abridged one. Export needs nothing new, because it inlines the same scripts. The rest of ADR-013 still holds.
