# Rules

Rules that came from reading real explanations. Each says where it came from and what to do. The first set came from the Go router example (`examples/go-router.js`) on 2026-10-15. Most are advice for writing an explanation. Where the page helps, a **How** line says with what. The format is in `skill/references/format.md`.

### Color carries meaning
**Context:** The page and the diagrams are almost all gray, so nothing tells the eye where to look.
**Rule:** Use a few colors, each with one meaning, in both the page and the diagrams. For example, new, changed, removed, and a problem such as a conflict, which is red. Color is never the only signal, so a label or icon goes with it.
**How:** `status` on a note: `new`, `changed`, `removed`, or `problem`. The word shows in the panel, on the card, and in a legend.

### The reader knows how to read a view
**Context:** In a story, it was not clear whether to click the part cards as they come up, or to read to the end first.
**Rule:** The story reads top to bottom with no clicks. Opening a part is optional, and the page shows that.
**How:** the story starts with a hint to read it top to bottom, and its part cards are drawn as asides.

### The diagram shows how much each part matters
**Context:** Every shape looked the same, so the reader could not tell which ones were central and which ones had something worth opening.
**Rule:** A diagram tells the reader how much each part is worth: what is central to the point, what is background, and what has more to open. Never leave every part looking equal.
**How:** `weight: "key"` or `"background"` on a note. The page adds a dot to every part that has more to read.

### Show a change side by side
**Context:** Before and after were two lesson steps. The reader had to keep the first in mind while looking at the second, so the change itself was hard to see.
**Rule:** Show the states being compared on the same page, next to each other, with what changed marked. Don't split a comparison across two pages.
**How:** two `subgraph`s in one flowchart, joined by `~~~`, with `status` on what changed.

### Point at what matters
**Context:** A note showed a 40-line function, and the reader could not tell which lines mattered.
**Rule:** Whenever a piece of code, a list, or a diagram is bigger than its point, highlight the part that carries the point. The reader should never have to search for it.
**How:** `mark=` on a code fence highlights lines inside the ones shown. `weight: "key"` does the same for a part of a diagram.

### The diagram and the panel say what they each show
**Context:** A call order was on the left and source code on the right, and the reader did not see how they connect.
**Rule:** Make the link visible: the panel describes the selected part, and the view says what the diagram shows.
**How:** an open note starts with "Outlined in the diagram", in the outline's color. The story says what the diagram shows.

### Start with an overview and a plan
**Context:** The reader started without knowing what the lesson covers or where it goes.
**Rule:** The first view gives the change in one sentence, before and after at a glance, and the list of steps ahead.

### Link the original change
**Context:** The explanation never linked the PR, issue, or commits it explains.
**Rule:** The first view links the original change. If there is no single PR, it links the proposal and the commits.

### Offer the basics, easy to skip
**Context:** A reader new to the topic, for example someone who doesn't know what an HTTP request is made of, had nowhere to start.
**Rule:** Put the basics where an experienced reader never has to pass through them, and point to them from the first step.
**How:** a second tab, such as Basics, outside the lesson.

### Name the specifics every time
**Context:** "GET /posts/new matches two patterns. Which one runs?" did not say which two patterns.
**Rule:** Name the concrete items in the sentence that uses them. Don't expect the reader to remember them from an earlier step.

### Draw what happens, not a sentence
**Context:** "The more specific pattern wins" was drawn as a sentence laid out in boxes.
**Rule:** Draw a process in the order it happens, such as request → two matches → the winner. A rule belongs in the text.

### The diagram shows the step's point
**Context:** The step "Neither wins: refused at startup" had a diagram that was mostly the parsing process.
**Rule:** The main part of the diagram is what the title says. Cut parts that are not that point.

### Arrows get labels, not notes
**Context:** Every arrow had its own side-panel note, mostly one short sentence.
**Rule:** Put the arrow's meaning in a label on the diagram. Give an arrow a note only when it has real detail, such as code.
**How:** write the meaning as a Mermaid arrow label, and the arrow as `[from, to]`. Arrows with no detail stay out of the parts list.

### Show the data with real values
**Context:** The matching step did not show a conflict, or what the index stores.
**Rule:** Show the data structures filled with the example's real values, and mark problem cases, such as a conflict in red.
