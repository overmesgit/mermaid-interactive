# Rules for explaining

An explanation can be correct and still lose its reader: it starts in the middle, says the same thing three times, or draws a picture the text never points at. These rules say how to avoid that. Use them in the order of the work: plan the lesson with The order of ideas and Making the key points land, write with Sentences, and draw with What the diagram draws and Color. Before handing over, read each rule's **Apply when**, and check the lesson against every rule that applies.

Each rule says what to do. **Apply when** says when it matters, and **How**, where the diagram tool helps, says with what. The groups, and the rules inside each group, are ordered by how much they matter to the reader. In the repo, `docs/rules-context.md` says where each rule came from, and **To do** at the end lists advice not yet made into rules.

- **The order of ideas**
  - The whole, then the problem, then the plan
  - Each step stands on the steps before
  - Facts first, then a picture, then the real why
  - Start from the reader's natural guess
  - Offer background to look up, outside the lesson
- **Making the key points land**
  - Give the key points the most care
  - Use an everyday picture where it fits
  - Carry one analogy through
  - Pick examples that show the point to every reader
  - Tell look-alikes apart by their jobs
- **Sentences**
  - Name the specifics every time
  - Say when each thing happens
  - Use lists for parallel items, each with an example
  - Mark every identifier in the text
- **What the diagram draws**
  - The step's point is the clearest thing in the picture
  - Draw what happens, not a sentence
  - Put what is compared side by side
  - Build each picture on the one before
  - Make the places that change the answer stand out
  - Arrows get labels, not notes
- **Color**
  - Color carries meaning
  - Give each type of thing one color, everywhere
  - Color says what a thing is, not when it appeared
- **Text and picture together**
  - Don't repeat an explanation
  - Keep the text and the picture in step
  - Point at what matters
  - Every part is introduced in the text

## The order of ideas

Getting the order wrong loses the reader before any sentence or picture can help.

### The whole, then the problem, then the plan
**Rule:** A lesson goes from the outside in:
1. Show the whole system the subject belongs to, once, with its main players and one worked example.
2. Say the problem in it. For a change, such as a PR, the diff takes the place of the problem: show what changed, and link the PR, or the proposal and the commits.
3. Give the plan: the steps ahead, which lead to the part that solves the problem or explain the change.

A reader who doesn't know where the part sits, what problem it solves, or where the lesson goes, can't tell why each detail matters.

**Apply when:** Planning any lesson. Skip step 1 when the subject is the whole system.

### Each step stands on the steps before
**Rule:** Each step adds something new, and uses only what earlier steps have already shown, so the reader always has what the next point needs. A step can add more than one idea, as long as each rests on what came before. If a step needs something not yet shown, show that first. Merge steps that show the same thing, and cut a topic that nothing later rests on and that does not serve the lesson's point, or reduce it to a sentence.

**Apply when:** Planning the steps, and again after changing any of them.

### Facts first, then a picture, then the real why
**Rule:** Inside a step, go in this order:
1. Say plainly what happens, in the order it happens, with the diagram.
2. Give a picture that predicts it, either an everyday analogy or a simple model, say that it is a picture, and match it to the facts part by part.
3. Explain the real mechanism or the reason for the design, in the picture's words, and why the two give the same answer.
4. Name only the differences between the picture and reality that change the answer.

A picture given before the facts has nothing to stand for, and real reasons given without a picture are hard to hold.

**Apply when:** A step explains how something works or why it is built that way, and the plain facts alone don't make that obvious.

### Start from the reader's natural guess
**Rule:** Start from the guess most readers would make. Say whether it is right, then show what the real rule adds beyond it. Don't argue against guesses few readers would make, and don't step around the model most readers already hold.

**Apply when:** Most readers will arrive with a guess about the answer or about how it works, such as a request trying the routes in some order.

### Offer background to look up, outside the lesson
**Rule:** Some readers are new to the topic and need its background first. Others know most of it, but miss one piece or have forgotten it. Serve both without slowing down a reader who needs neither: put the background outside the lesson, as short entries, one for each thing the lesson assumes. Each entry makes sense on its own and shows a real value or a picture. Point to the background from the first step, and again where the lesson first leans on an entry, so a reader with a gap can fill it when they hit it.

**Apply when:** The lesson assumes something some readers may not know or may have forgotten, such as what an HTTP request is made of, or what a hash is.

**How:** a second tab, such as Basics, with one heading per entry. A link opens only a part of the same view, so where an entry is needed, name the tab and the entry in the text.

## Making the key points land

A few points decide how the system behaves, so they get the most help.

### Give the key points the most care
**Rule:** Find the few points that most decide how the system behaves: the ones a reader must get, or nothing after them makes sense. Give each more than a definition: a worked case in a picture or a table, and a plain rule of thumb. Keep the exact wording for those who want it, after the plain one. Points that matter less get less space.

**Apply when:** Planning a lesson, before writing the steps.

### Use an everyday picture where it fits
**Rule:** People imagine everyday, physical things more easily than abstract ones, so a good everyday analogy is one of the strongest tools an explanation has. Use one only where it fits well: its parts match the real ones, and it predicts the right result. A forced analogy costs the reader more than it gives. Prefer growing one analogy over the whole lesson to adding a new one per step.

**Apply when:** An idea is complex or not obvious, and an everyday situation has the same shape, such as a cloakroom ticket for a login code.

### Carry one analogy through
**Rule:** Work the analogy out on its own first, with a few concrete cases. Then map the real case onto it explicitly, part by part, with the real thing on the left and the analogy on the right, so the reader never has to work out which part is which. Keep using its words for later points, including where the analogy and the real thing differ. Where it goes in a step is in Facts first, then a picture, then the real why.

**Apply when:** An analogy carries a key point, or comes back in more than one step.

### Pick examples that show the point to every reader
**Rule:** Choose concrete values so the point can be seen in them: the case that clashes, two values that differ in one place, a list short enough to scan. Values from a real run are a good start, and you can change them to make the point clearer, as long as the system could still produce them and each value stays the same wherever it appears. Mark the problem cases, such as a conflict in red. For an everyday example, pick one that reads the same in any country and culture, or build it from parts everyone shares. Avoid local formats, units, holidays, and sports, unless the subject is local.

**Apply when:** Showing data, an example input, or an everyday example, such as what an index stores, which routes a request matches, or the address in an analogy.

### Tell look-alikes apart by their jobs
**Rule:** Put the two side by side, and say for each where it is made, where it travels, what it is used for, and how long it lasts, with a real value of each.

**Apply when:** Two things look alike in form or name, such as a code and a token, so the reader may mix them up.

## Sentences

A sentence the reader has to decode costs attention the idea needed.

### Name the specifics every time
**Rule:** Name the concrete items in the sentence that uses them. Don't expect the reader to remember them from an earlier step.

**Apply when:** A sentence refers to things by count or kind, such as "two patterns" or "the value".

### Say when each thing happens
**Rule:** Attach every action to its phase. Say it in the sentence, and show it in the diagram.

**Apply when:** The system works in phases, such as startup and request time, or build and run.

### Use lists for parallel items, each with an example
**Rule:** Put the items in a numbered or bulleted list, and give each one an example. Keep prose for reasoning, so lists stay the exception.

**Apply when:** A sentence names three or more items of the same kind.

### Mark every identifier in the text
**Rule:** Set every name the reader may need to spot again apart from the prose: code values, labels such as route 1, and the analogy's names such as house 12. Use the type's color where the thing has a type, and code style otherwise.

**Apply when:** Always, in every story and note.

## What the diagram draws

The picture is what the reader keeps, so it must show the point and nothing else.

### The step's point is the clearest thing in the picture
**Rule:** The main part of the diagram is what the step's title says. Cut parts that are not that point, and keep background parts small or out of the picture. Mark the parts that have more to open. Never leave every part looking equal, because then the reader can't tell what is central.

**Apply when:** Always. Check every diagram against its step's title.

**How:** the story names what is central. The page adds a dot to every part that has more to read.

### Draw what happens, not a sentence
**Rule:** Draw a process in the order it happens, such as request → two matches → the winner. A rule belongs in the text.

**Apply when:** A diagram is about to show a rule or a claim instead of a process.

### Put what is compared side by side
**Rule:** Show the things being compared next to each other, on the same page, with what changed marked. Don't split a comparison across two steps. In text, put them in aligned rows, one per line, so the eye can scan down a column and see what changes.

**Apply when:** The point is a difference: before and after, two options, or two matches.

**How:** in a diagram, two `subgraph`s in one flowchart, joined by `~~~`, with `status` on what changed. In text, a markdown table. With an empty header row, it shows no header.

### Build each picture on the one before
**Rule:** Keep the same kind of diagram, the same players in the same places, and the same bands and colors from step to step, so each step reads as the one before with something added or changed. Change the kind of diagram only when the new point cannot be drawn in the old one.

**Apply when:** A lesson has more than one diagram of the same system.

### Make the places that change the answer stand out
**Rule:** The reader should see each place before reading a single label. Draw it as an area the eye picks out at once, in a light shade of its own that says what the place means, such as a warm shade for an exposed place and a cool one for a private place. Don't use the status colors for places: red means a problem, so a red place reads as a problem even where nothing goes wrong there. Mark what goes wrong on the parts it happens to. Name each place inside its area, and use the same shade and name every time it comes back, in every step and in the text. When things move between the places, shade the stretches of their path, not a box per place: boxes make the arrows cross back and forth, so draw the path in the order things move and say the place in each caption. A box suits only shapes that stay in their place.

**Apply when:** Where something happens changes the answer, such as an exposed path and a private one, or a client and a server.

**How:** in a sequence chart, `rect rgb(…)` shades a block of messages, and a `Note over` at its top names it. In a flowchart, a `subgraph` works only for shapes that stay in their place. When things move between places, use a top-to-bottom flowchart with the place in each shape's caption.

### Arrows get labels, not notes
**Rule:** Put the arrow's meaning in a label on the diagram. Give an arrow a note only when it has real detail, such as code.

**Apply when:** Every arrow you draw.

**How:** write the meaning as a Mermaid arrow label, and the arrow as `[from, to]`. Arrows with no detail stay out of the parts list.

## Color

Color is read before any word, so it must mean the same thing every time.

### Color carries meaning
**Rule:** Use a few colors, each with one meaning, in both the page and the diagrams. For example, new, changed, removed, and a problem such as a conflict, which is red. Color is never the only signal, so a label or icon goes with it.

**Apply when:** Always, in every diagram and on the page.

**How:** `status` on a note: `new`, `changed`, `removed`, or `problem`. The word shows in the note and on the part's card.

### Give each type of thing one color, everywhere
**Rule:** Give each type of thing one color, and use it on every mention: each word in the text that names it, each shape, and each arrow that carries it. The colors become a small sign language: once the reader knows that routes are teal, they don't need to read the word. A color used only sometimes tells the reader nothing.

**Apply when:** The explanation keeps naming a few kinds of thing, such as requests and routes, or codes and tokens.

**How:** `DIAGRAMS.types` names the types, such as `request`, `route`, and `handler`. A shape or an arrow takes `type: "route"`, also in `arrow()`. In text, `[GET /posts/{id}](~route)` shows the words in that color, and a link to a part with a type has its color too. The page picks the colors, up to four, and the legend names them.

### Color says what a thing is, not when it appeared
**Rule:** Color each part by what it is and how it ends, not by the step that adds it.

**Apply when:** The steps of a lesson are different runs or cases, not one picture that changes.

**How:** a part with a `type` keeps its color on the step that adds it. `status: "problem"` marks what goes wrong, and `status: "new"` what the change adds.

## Text and picture together

The text and the picture sit side by side, so each must add to the other, and the reader must always see how they connect.

### Don't repeat an explanation
**Rule:** Explain each thing in one place: one step, one table, or one note. When it comes back, refer to it in a few words, or link to it, instead of explaining it again. Repetition makes the reader read the same thing twice, and hides what is new. It builds up where a lesson stacks layers: the summary, the story, a card, a note, a tooltip, a table, and the next step. So a layer the reader opens, such as a tooltip, a note, or an inner diagram, must add something the layer above it does not, or be left out. A note repeats the story only when it would not make sense without it.

**Apply when:** Revising a lesson, and whenever you add a note, a tooltip, a table, or a step about something already explained.

**How:** `tooltip` is optional. A part with no tooltip still lights up on hover.

### Keep the text and the picture in step
**Rule:** Whatever the text is talking about should stand out in the picture at that moment, and the two should name each thing the same way. The story says what the diagram shows, and an open note shows which part it describes.

**Apply when:** A view has both a story and a diagram.

**How:** link the parts each paragraph is about. As the reader scrolls, the paragraph at their eye lights its parts and fades the rest. In a sequence chart, `autonumber` numbers the messages, and each link to one shows the same number.

### Point at what matters
**Rule:** Highlight the part that carries the point, so the reader never has to search for it.

**Apply when:** A code block, a list, or a diagram is bigger than its point.

**How:** `mark=` on a code fence highlights lines inside the ones shown. In a diagram, `status` marks the parts that changed.

### Every part is introduced in the text
**Rule:** The story links each part that has something to open, at the sentence that talks about it. Don't leave parts for a list at the end.

**Apply when:** A view has a story and parts with notes.

**How:** a view with a story has no parts list. A check names each part with a note that its story never links, except parts an earlier lesson step already showed.

## To do

Advice from `explain-difficult-things/skill-draft.md` in the repo that is not a rule yet. Each one becomes a rule only after it has been tried on a real example and checked with a reader.

- **Kinds of explanation.** A concept, a subsystem, and a change each need a different start: what to read first, how to open, the typical steps, and how much code to show.
- **Know the reader.** Start from what they already work with. An explanation fails in one of three ways, and each needs a different fix: a piece is missing, the pieces are not connected, or the reader holds a wrong idea.
- **Name the wrong idea.** When there is a natural wrong reading, say it, show the case where it fails, then give the right one.
- **Match the chart to the idea.** A sequence chart for events in order, a state chart for a lifecycle, a flowchart for structure, and C4 for systems and who uses them.
- **A second example with a different surface,** to show what stays the same.
- **Say what a simplification leaves out,** so the reader does not fill the gap with a wrong idea.
- **Run every claim you show.** Every output in a lesson comes from running the real code, because some answers are easy to get wrong.
- **Keep code notes short:** 10 to 25 lines each, with `mark=` on the lines that carry the point.
- **For a PR:** find the whole change, which may be many commits; read the reasons before the code; and end with what a reviewer should check.
