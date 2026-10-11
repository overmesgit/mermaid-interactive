# ADR-012 Panel notes are markdown

- Status: superseded by [ADR-013](013-notes-in-templates.md)
- Date: 2026-10-11
- Supersedes: [ADR-008](008-teach-in-the-tool.md)

## Context

A panel note had text and one code snippet, each in a fixed place. A note could not put text after the code, or show two snippets. The How snippets were also stored as escaped strings in `diagrams.js`, so they were hard to edit.

The How tab's step-by-step teaching from ADR-008 still holds. Only the note format, and where notes live, change.

## Decision

Every panel note is markdown. `marked` 15 loads from jsDelivr. `marked.lexer` returns tokens, and the panel builds elements with `textContent`. Raw HTML tokens are skipped.

A short note stays a `body` string on the node. A How note that includes code is a file in `notes/how/`. The node stores that path in `note`. `loadNotes` fetches the file and writes the text onto `body` before the first diagram is drawn. Export inlines those files as `window.NOTE_TEXT`, so the downloaded HTML does not need a `notes/` folder. It still loads Mermaid and marked from the network.

`kicker`, `label`, `tooltip`, `facts`, and `zoom` stay fields. They are not part of the markdown.

## Consequences

A behavior change that one of the How pictures describes should update that view's note in `notes/how/` in the same change. The chat reply is not the manual.
