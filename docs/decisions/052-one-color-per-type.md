# ADR-052 One color per type of thing, tables, a one-line note header, and no parts list under a story

- Status: accepted
- Date: 2026-10-17
- Supersedes: the parts list under a story, from [ADR-033](033-story-panel.md) and [ADR-041](041-story-links-to-parts.md); the note's header from [ADR-051](051-note-hangs-under-its-card.md)

## Context

Reading the step "Two routes match" in the Go router example showed four problems.

- In "The request GET /posts/new matches two routes: GET /posts/new, and GET /posts/{id}", a request and a route look alike, so the reader had to work out which was which each time.
- The values being compared sat inside one sentence, so their one difference was hard to see. The panel could not show a table, so a writer had nothing better to use.
- The note's header still took three lines: the kicker, "Outlined in the diagram", and the title, plus the lead.
- The list "Other parts, to open for detail" under the story was a plain list of names, which nobody read.

## Decision

- **Types.** `DIAGRAMS.types` names the types of thing an explanation keeps naming, such as `request`, `route`, and `handler`. A shape takes `type`, and gets that type's border and tint. In text, `[words](~route)` shows the words in that color, and a link to a part with a type has its color. The page gives four fixed colors in order: violet, teal, pink, and sky. None is a status color or the selection blue. A status wins over a type. The legend names the types a diagram shows.
- **Tables.** The panel renders markdown tables. A table with an empty header row shows no header, so it can line up rows such as a request and two routes.
- **One header line.** The note's title, its status, the kicker in small gray text, a target icon, and × share one line. Hovering the icon lights the part in the diagram, and clicking it brings the part into view. The tooltip follows as the note's first line, in plain text.
- **No parts list under a story.** A view with a story links its parts where it talks about them. A check names each part with a `body`, `facts`, or `opensView` that the story never links. On a lesson step, parts the step before already showed are left out of that check, because they were introduced there. A view with no story keeps the list.

## Consequences

The Go router example names four types and rewrites the step around a table, the reader's natural guess, an analogy, and a numbered list. The starter, pr-checks, and side-panel examples now link every part. The How tab's stories do not yet link every part they add, so the check lists those.
