# ADR-013 How notes are markdown templates in diagrams.js

- Status: accepted, copied code superseded by [ADR-024](024-notes-name-functions.md)
- Date: 2026-10-11
- Supersedes: [ADR-012](012-markdown-notes.md)

## Context

ADR-012 put each How note in its own file under `notes/how/`. That was 36 files. The panel renderer from that decision still holds: a note is markdown, `marked.lexer` walks the tokens, and the text is set with `textContent`.

## Decision

How notes live in `diagrams.js` as `body` strings, written with the `md` tagged template. A fence is `~~~`, which `marked` already accepts. `md` removes the indent of the template and does not parse the markdown. A short bookshop note stays a plain string.

`loadNotes` and `window.NOTE_TEXT` are gone. Export inlines `diagrams.js` and still loads `marked` from jsDelivr.

## Consequences

A behavior change that one of the How pictures describes should update that note in `diagrams.js` in the same change. The chat reply is not the manual.
