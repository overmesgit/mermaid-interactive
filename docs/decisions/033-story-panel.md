# ADR-033 The side panel tells the diagram's story by default

- Status: accepted, partly superseded by [ADR-041](041-story-links-to-parts.md): parts the story shows as cards are not listed again, [ADR-052](052-one-color-per-type.md): no parts list under a story, and [ADR-053](053-inline-and-peek-notes.md): a note opens inside the story or by its shape instead of replacing it
- Date: 2026-10-12
- Supersedes: `show()` closing the panel, from [ADR-014](014-selection-keeps-camera.md)

## Context

The words of an explanation lived only in the notes of single shapes. To follow a diagram, a reader had to click shape after shape and piece the story together. Captions under the shapes ([ADR-032](032-shape-captions.md)) help at a glance, but a few words per box cannot say why the diagram matters or what to look at first.

## Decision

A view can have a `story`: markdown, like a note, about the whole diagram. When nothing is selected, the side panel is open and shows the story, then a list of the view's shapes and arrows with their tooltips. On a lesson step, the parts the step adds are marked New. Clicking a part opens its note, and pointing at it lights it in the picture.

From a note, Back and Escape return to the story. From the story, Close hides the panel, and it stays hidden on the next diagrams until the Story button opens it again. The arrow keys step through a lesson while the story is open, and not while a note is open.

## Consequences

The diagram is narrower by the panel's width on every view, so a large diagram fits at a smaller scale. A view without a story still gets the parts list, so the bookshop tabs open with a panel too. The How tab has a story on every view. A writer now has one more field to fill, and `skill/references/format.md` asks for it.
