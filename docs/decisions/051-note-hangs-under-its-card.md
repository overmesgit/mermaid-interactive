# ADR-051 The note hangs under its card, with a compact header and thin scrollbars

- Status: superseded by [ADR-052](052-one-color-per-type.md) and [ADR-053](053-inline-and-peek-notes.md), apart from the thin scrollbars
- Date: 2026-10-17
- Supersedes: "Outlined in the diagram" on its own line, from [ADR-047](047-story-reading-cues.md)

## Context

With the note under the story ([ADR-050](050-note-under-the-story.md)), three things got in the way.

- The note looked like a second, separate panel. Nothing said it was the detail of the card open in the story.
- Its header took about 30% of the pane: the kicker, "Outlined in the diagram", the title, and the lead each had a line, with gaps between them.
- The browser's scrollbars were wide, with arrow buttons, on two panes and on every code block.

## Decision

- The note pane hangs under the open card. Its left rule is the card's blue, it starts where the card's rule is, and it has a light tint of the same blue. The open card's rule is as thick as the note's. This follows the rule "Show how parts belong together" in [rules.md](../rules.md).
- The note's first line holds the kicker, "Outlined in the diagram" with its small blue square, and ×. On a narrow panel the words wrap under the kicker. The title is 17px, and the gaps are smaller. The story's header is tightened the same way.
- Scrollbars in the panel and in code blocks are 6px, with no arrows and a transparent track. They darken under the pointer. Chrome gets its own scrollbar styles, because its thin standard scrollbar keeps the arrows on Windows. Other browsers get `scrollbar-width: thin`.
- On a narrow screen the note covers the story, so it drops the hanging rule and uses the full width.

## Consequences

At a 690px panel, the note's text starts 90px below the top of its pane, down from about 170px. The note is 16px narrower, because it starts one step in.
