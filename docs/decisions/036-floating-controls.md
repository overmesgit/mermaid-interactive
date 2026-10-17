# ADR-036 Controls float over a full-window diagram

- Status: accepted, partly superseded by [ADR-055](055-fewer-features.md): Find is gone
- Date: 2026-10-14
- Supersedes: the header from [ADR-017](017-compact-chrome.md), and the top-left place of Prev and Next from [ADR-022](022-lesson-on-diagram.md). The ? help and the one font from ADR-017 stay.

## Context

The page looked busy and uneven. Every control was a boxed button, the header spent a row on a title nobody needed, and the controls in the two bars did not line up. Copy source and Export HTML sat beside Find, although a reader rarely uses them.

## Decision

There is no header, so the diagram fills the window. The controls sit on small white cards over the diagram, each 16px from its edge:

- Top left: the tabs. Under them, the Story button, the diagram's name, and its summary.
- Top right: Find, with a magnifier instead of a label, and a ⋯ menu that holds Copy source and Export HTML.
- Bottom centre: Prev, the step count, and Next.
- Bottom right: zoom out, fit, zoom in, and ?.

Buttons have no border and show a tint on hover. Only Next is filled, so the next step is the one obvious thing to press. Every control is 32px tall, and every gap is a multiple of 8px, so the edges line up. The colours are a cool slate with one blue accent.

The Story button has a label and sits before the diagram's name, because the story is about that diagram. It is lit while the panel shows the story, and a second press hides it. As an unlabelled icon among the zoom buttons it was hard to find.

The lesson card has a fixed width, and Next fills it, cutting a long step name with "…". When the card grew with each step name, it re-centred, so Prev and Next moved under the pointer on every step. The Story button comes before the name for the same reason.

## Consequences

The diagram gets the whole window, and fit keeps it between the top and the bottom cards.

On a narrow window the cards stack instead of sharing a row. Below 640px the tabs, Find, the camera, and the lesson each take a full row.

A step name longer than the card is cut. The panel still shows the whole name.

The ⋯ menu and the help are native popovers, so Escape closes the open one and leaves the panel alone.
