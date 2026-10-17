# Page design rules

Some of what makes an explanation easy to follow is the page's job, not the writer's: how a note opens, how it shows what it belongs to, and how a reader knows what to click. A writer can't act on these, so they are kept here, apart from the writing rules in [the explain-clearly skill](../explain/references/rules.md). The page already follows each one. A change to the page must keep them true.

Each rule says what the page does, **How** says how it does it today, and **Before** and **After** say what a reader saw before the rule and what replaced it.

## Details open without hiding the big picture
**Rule:** Opening a detail never hides the overall picture. The reader sees the story and the part's note at the same time, and the story stays where they left it.

**How:** a part's note opens inside the story, under the card or link that was clicked, or as a card on the canvas beside its shape. The story keeps its scroll either way ([ADR-053](decisions/053-inline-and-peek-notes.md)).

**Before:** on the Go router's overview, clicking Handler for /posts/ in the story swapped the whole story for that handler's code, so the reader lost their place and had to go back to keep reading.

**After:** the code opens under that card, between the paragraphs the reader was on.

## Show how parts belong together
**Rule:** When one thing is a detail of another, the page shows the link with position, a border, or a shared color: a note and its part, an inner diagram and its shape, a step and its lesson. The reader should never have to guess what belongs to what.

**How:** an inline note sits directly under its card, with the card's blue rule and a lighter tint, and the card's › turns down. A peek card sits against its shape, with an arrow pointing at it. Opening a note brings its part into view, outlined in the panel's blue, and pointing at a part's card or link lights it in the diagram ([ADR-058](decisions/058-story-drives-the-picture.md)).

**Before:** in the Go router, "Your code, before" opened under the story at full width, with a plain gray line between them, so it looked like a second, separate panel, though it was the detail of one card in the story.

**After:** it opens under the Handler for /posts/ card, as that card's lower half.

## The reader knows how to read a view
**Rule:** The story reads top to bottom with no clicks. Opening a part is optional, and the page shows that.

**How:** the story starts with a hint to read it top to bottom, and its part cards are drawn as asides.

**Before:** in the Go router, a story's part cards were full-width buttons between its paragraphs, so it was not clear whether to click each one as it came up or read to the end first, and the reader stopped at each one.

**After:** the story opens with "Read top to bottom. Click a part only when you want more detail.", and each card is a small aside with a rule on its left and a ›.
