# ADR-041 The story points at parts where it talks about them

- Status: accepted, partly superseded by [ADR-047](047-story-reading-cues.md): the list's heading, and [ADR-052](052-one-color-per-type.md): no list under a story
- Date: 2026-10-15
- Supersedes: in [ADR-033](033-story-panel.md), the list of every part under the story

## Context

The story panel showed the text first and the list of parts after it ([ADR-033](033-story-panel.md)). So a reader met a part twice, far apart: once named in a sentence, and again in the list at the bottom, where its tooltip was. To see the part the story was talking about, they had to scroll down and find it.

## Decision

A story or a note can link to a part of the diagram with a markdown link to `#` and its chartId: `[API](#api)` for a shape, `[](#web->api)` for an arrow.

- A line that holds only such links shows each part as a card, in that place: its name and tooltip, the same as in the parts list. Text, then a card, then more text, walks the reader through the picture in the order the story tells it.
- A link inside a sentence shows as a link.

Either one opens the part's note on click, and lights the part in the picture on hover. A part the story already showed as a card is left out of the list under it, which is then titled "Also in this picture". On a lesson step, a card for a part the step adds is marked New, as in the list.

Two arrows between the same shapes are one part, so the link opens the first. A link to a part the view has no note for shows as plain text, and the page lists it as a problem.

## Consequences

A story without links looks as before. A writer can move a story to cards one line at a time.

The link text of a card is not shown, because the card uses the part's label. Writing the name anyway, as in `[Redis](#redis)`, keeps the source readable.

Links work in any note, not only in the story, so a note can point at the next part to look at.
