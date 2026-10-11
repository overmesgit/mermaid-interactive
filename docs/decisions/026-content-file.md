# ADR-026 Each explanation is one file, separate from the engine

- Status: accepted, not built yet
- Date: 2026-10-11

## Context

To write an explanation, an agent would have to edit `diagrams.js`. That file mixes the explanation with things the agent must leave alone: the `arrow()` and `md` helpers, the How lesson, and the bookshop sample. So every new explanation could break the engine or the sample.

## Decision

The helpers `arrow()` and `md` move into the engine. A content file is a classic script that sets `window.DIAGRAMS = { tabs, views }` and may call those helpers. It is still JavaScript, not JSON. Charts are several lines long, and notes with code use the `md` template.

The engine never reads a content field that `skill/references/format.md` does not describe. A new field is added there in the same change.

The repo's own page keeps its sample and the How tab as its content file.

## Consequences

An agent writes one file and never touches the engine.

A `~~~js source=name` fence ([ADR-024](024-notes-name-functions.md)) still prints a function the page has loaded. That only works for the engine's own code. A PR explanation pastes its code into the note.

How the page picks a content file while someone is authoring one is decided with the code.
