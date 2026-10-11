# ADR-013 Keep How notes inside diagrams.js, not in separate files

- Status: accepted, copied code superseded by [ADR-024](024-notes-name-functions.md)
- Date: 2026-10-11
- Supersedes: [ADR-012](012-markdown-notes.md)

## Context

Keeping each How note in its own file (ADR-012) meant 36 small files. Each one had to be fetched before the page could draw, and editing a lesson meant switching between `diagrams.js` and those files.

The markdown rendering from ADR-012 still holds: a note is markdown, and the text is set with `textContent`.

## Decision

How notes live in `diagrams.js` as `body` strings, written with the `md` tagged template. A fence is `~~~`, which `marked` already accepts. `md` removes the indent of the template and does not parse the markdown. A short bookshop note stays a plain string.

`loadNotes` and `window.NOTE_TEXT` are gone. Export inlines `diagrams.js` and still loads `marked` from jsDelivr.

## Consequences

A behavior change that one of the How pictures describes should update that note in `diagrams.js` in the same change. The chat reply is not the manual.
