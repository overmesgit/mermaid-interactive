# ADR-012 Panel notes are markdown

- Status: superseded by [ADR-013](013-notes-in-templates.md)
- Date: 2026-10-11
- Supersedes: [ADR-008](008-teach-in-the-tool.md)

## Context

The panel kept prose in `#panel-body` and a snippet in `#panel-code`. A note could not put text after the snippet, and the How snippets lived as escaped strings in `diagrams.js`.

The How tab still teaches in steps. Each picture repeats the last one and adds one piece. That part of ADR-008 still holds. What changes is where the note text lives.

## Decision

Every panel note is markdown. `marked` 15 loads from jsDelivr. `marked.lexer` returns tokens, and the panel builds elements with `textContent`. Raw HTML tokens are skipped.

A short note stays a `body` string on the node. A How note that includes code is a file in `notes/how/`. The node stores that path in `note`. `loadNotes` fetches the file and writes the text onto `body` before the first diagram is drawn. Export inlines those files as `window.NOTE_TEXT`, so the downloaded HTML does not need a `notes/` folder. It still loads Mermaid and marked from the network.

`kicker`, `label`, `tooltip`, `facts`, and `zoom` stay fields. They are not part of the markdown.

## Consequences

A behavior change that one of the How pictures describes should update that view's note in `notes/how/` in the same change. The chat reply is not the manual.
