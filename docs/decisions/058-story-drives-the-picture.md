# ADR-058 The picture follows the story, and a link to a numbered message shows its number

- Status: accepted
- Date: 2026-10-17

## Context

A reader of the OAuth PKCE example said the explanation lived apart from the diagram. The story is in the side panel and the diagram in the middle, and they met only when the reader pointed at a link. A reader who just reads, without pointing, saw a picture that never changed, so they had to find each message the text talked about by themselves.

Sequence charts number their messages, but the text named them in words, such as "the redirect back to the app". So the reader had to match the words to an arrow, too.

## Decision

- **The paragraph being read lights its parts.** As the story scrolls, the block at the reader's eye, a paragraph, list item, table, or card, lights every part it links and fades the rest of the picture more than hover does. The block gets a light tint, so the reader sees which text the picture follows. The eye is near the top of the pane before scrolling and near the bottom at the end, so the first and last blocks each get their turn. A block with no links lights nothing, so the whole picture shows while the story speaks in general.
- It pauses while a note is open, because the note's part is what the reader looks at then, and when the whole story fits without scrolling. Hover still wins while the pointer is on a part or a link, and the picture goes back to the story when it leaves.
- **A link to a numbered message shows its number.** In a sequence chart with `autonumber`, a story or note link to a message, and its card, start with the message's number in a dark dot like the one Mermaid draws by the arrow.

## Consequences

Authors need no new syntax: the links a story already has drive the picture. A paragraph that links nothing leaves the picture whole, so a story should link the parts each paragraph is about, which the checks already ask for parts with notes.

The numbers come from the drawn picture, so they show once it is drawn, and they match it even with `autonumber 10 5`.

Two arrows between the same shapes are one part, so a link lights and numbers the first of them, as it opens the first.
