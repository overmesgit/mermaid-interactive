# ADR-047 The panel says how to read it, in readable text

- Status: accepted, partly superseded by [ADR-052](052-one-color-per-type.md) and [ADR-053](053-inline-and-peek-notes.md): the note's header
- Date: 2026-10-16

## Context

Three things made the side panel hard to use in the Go router example.

- The reading text was the light gray meant for labels, so it was tiring to read.
- In a story, the part cards looked like the next thing to read. A reader could not tell whether to click each one, or to read to the end first.
- With a note open, it was not clear that the note describes the part outlined in the picture, for example a call on the left and its code on the right.

## Decision

- Reading text is dark slate, at 15px. Labels and captions are a darker gray than before. All text reaches at least 4.5:1 contrast, and the accent blue is a shade darker so that it passes on its light background.
- A story starts with a quiet hint: "Read top to bottom. Click a part only when you want more detail." A card in the story is drawn as an aside: smaller, with a rule on its left and a chevron. The list under the story is called "Parts, to open for detail".
- A note starts with "Outlined in the diagram" next to a small square in the selection color, the same color as the outline on the part.
- The shape under the pointer, or under a hovered part card, gets a blue outline. The light fade on the other shapes ([ADR-005](005-light-dim.md)) was the only hover cue, and colored fills made it hard to see.

## Consequences

The story reads as text with optional asides. The panel and the picture are visibly tied together by one color.
