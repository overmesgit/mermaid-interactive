# ADR-053 A note opens inline under its link, or as a peek card by its shape

- Status: accepted, partly superseded by [ADR-055](055-fewer-features.md): Back no longer reopens a note, and the note has no target icon
- Date: 2026-10-17
- Supersedes: ADR-050, and what is left of ADR-051 apart from its thin scrollbars

## Context

With the note in a pane under the story (ADR-050), the story and the note shared the panel's height. Both were short, so a code note scrolled early, and the note still looked like a separate panel. Under a card it also repeated the card: the part's name, its status, and its tooltip were in the card and again in the note's header.

Six layouts were tried side by side on one page: the split, the note inside the story, a second column, a sheet over the story, a card on the canvas, and a drawer along the bottom. A ranked the note inside the story and the card on the canvas above the rest.

## Decision

A note opens one of two ways.

- **Inline.** The note opens inside the story, right under what was clicked: under a part's card, or after the paragraph that holds the link. The story flows around it and keeps its place. Under a card the note shows only its text and code, because the card already names the part, and the picture shows the connections, so the header, facts, and links are left out. Under a link in a sentence it keeps its header line and lead, since nothing above names the part. The open card's › turns down, and a second click on the card or link closes the note.
- **Peek.** The note is a card on the canvas, held against its shape: beside it, below it, or in the corner. A small arrow points at the shape. When the card opens, the camera pans so the shape and the card both fit. After that the card moves with the shape on every pan and zoom, and the canvas edge clips it. The story keeps the whole panel.

Each link chooses. A link's markdown title says how its note opens: `[API](#api "peek")`, `[API](#api "peek below")`, or `"inline"`. With no title, a link or card in the story opens inline, and a link in a note opens as a peek. A click on the picture opens a peek, because the reader is looking at the picture.

Where a peek card sits comes from, first to last: the reader's pick with the card's buttons, the link's place, the view's `notePlace`, the explanation's `notePlace`, and beside. The reader's pick lasts for that view until the page closes. It is not stored.

Back and Forward reopen a note the same way it was opened. A history entry keeps the mode and the link's place. An inline note comes back under its part's card, because a paragraph cannot be named in history; with no card, it comes back as a peek. A link with only a hash, like one pasted into a chat, opens a peek.

The divider between the story and the note is gone, and so is the note that covered the story on a narrow screen.

## Consequences

The story keeps its full height while a detail is open, and an inline note reads as part of the card it belongs to. A peek card covers part of the diagram; the reader can move it with its buttons or pan the diagram. A wrong link title or `notePlace` shows in the ⚠ list instead of quietly falling back.
