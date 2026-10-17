# ADR-050 A note opens under the story instead of replacing it

- Status: accepted
- Date: 2026-10-17
- Supersedes: a note replacing the story, and Back returning to it, from [ADR-033](033-story-panel.md)

## Context

A reader went through a story and opened a part from a link in it. The part's note replaced the story, so the reader lost their place and had to go back to keep reading. The rule "Details open without hiding the big picture" in [rules.md](../rules.md) came from this.

## Decision

The panel has two panes. The story is on top, and a part's note opens in a pane under it, at the full width of the panel so that code still fits. Opening a part from the story, the parts list, the picture, or another note fills only the note pane. The story is not drawn again, so it keeps its scroll. Its card for the open part is marked in the outline's color.

- The note's × and Escape close only the note. The story stays as it was.
- Clicking the open part's card or link in the story again closes its note, so a reader can peek at a detail and go back to reading in one place.
- Close on the story, or the Story button, hides only the story. An open note then fills the panel. With both closed, the panel hides.
- A divider between the panes can be dragged. The story starts at 40% of the height.
- Moving to another diagram closes the note, as before.
- On a narrow screen the panel is too short for two panes, so the note covers the story. The story stays laid out underneath it, so closing the note shows the story at the same place.

## Consequences

The story and a detail can be read together. The note has less height than before, when the story is open, so a long code note scrolls sooner. The reader can drag the divider, or close the story.
