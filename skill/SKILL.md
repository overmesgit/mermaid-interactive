---
name: interactive-explainer
description: Explain a pull request, a subsystem, or a hard concept as one HTML page of clickable Mermaid diagrams, walked step by step, with notes and real code in a side panel. Use when asked to explain a change or a piece of a system visually, or to add an explanation link to a PR.
---

# Interactive explainer

A reviewer who opens a PR cold has a few minutes, and a diff shows what changed but not why or how it runs. This skill turns an explanation into one HTML file: a short lesson of Mermaid diagrams, where every shape and arrow can be clicked for a note, and notes can show the real code.

You write one content file, `diagrams.js`. The skill holds the page, so you only put your content into it.

## What you write

- **A lesson.** One tab, with a view per step. Prev and Next walk the steps.
- **A diagram per step.** A flowchart, sequence, state, or C4 chart. Only these four are clickable.
- **A story per step.** The side panel shows it when nothing is selected. It says what the step shows and why, so a reader can follow without clicking.
- **Notes.** One per shape or arrow that matters: a one-line tooltip, then markdown, which can show code from the repo with `file=`.
- **Inner diagrams,** when needed. A shape can open a more detailed diagram on double-click.

[references/format.md](references/format.md) describes every field, with a complete example. Read it before writing.

## Workflow

1. **Find out what to explain, and for whom.** For a PR, read the diff, the description, the linked issue, and the commits. Note the one or two ideas the change depends on. If you do not know who the reader is, assume a teammate who knows the codebase but not this change, and say so in the first story.
2. **Plan the lesson before writing code.** Write the step titles as a list: the question, the small whole, the hard part, the change, the answer. Three to seven steps is usual. See [How to explain](#how-to-explain).
3. **Write `diagrams.js`** in the repo root, or wherever the user asks. Follow `references/format.md`.
4. **Put it into the page, look at it, and check it,** as steps 2 to 4 of `references/format.md` describe. The command writes `explanation.html` from the template in `assets/` and packs every file the notes name. If you can open a browser, open the file, walk every step, and fix everything under the amber ⚠ chip. If you cannot, go through the checklist in `references/format.md` by hand.
5. **Hand over `explanation.html`.** Say where it is and what it covers. Do not commit it or publish it unless asked. Choosing a host is a separate decision.

## How to explain

These rules come from research on teaching. The first four decide what to explain, and the rest decide how to show it.

### Decide what to explain

- **Know the reader.** Start from what they already know: the code they touch, the words they use. When an explanation fails, a piece is missing, the pieces are not connected, or the reader holds a wrong idea. Each needs a different fix.
- **Start from the question.** Open the first story with the problem the change solves, in one or two sentences: "Customers were charged twice when the payment page timed out." Not "This PR adds an idempotency key table." Come back to the question in the last step and answer it.
- **Show a small whole first.** The first diagram is the smallest version of the whole that still runs: one request, one happy path. Every later step adds one thing to it: an error, a retry, the changed part. A list of components is not a small whole.
- **Find the hard part, and spend the words there.** Ask which idea, once understood, makes the rest obvious. Give it its own step, its own diagram, and its own example. The boxes everyone knows get a caption, not a paragraph.

### Show it

- **Show the machine.** For code, show what runs, in what order, and what changes. Follow one concrete input and name its value at each step. Use a sequence or state chart for behaviour, and a flowchart only for where things live.
- **Match the chart to the idea.** Sequence for an order of events, state for a lifecycle, flowchart for structure and dependencies. Cut every box the explanation does not use.
- **One change per step.** Keep the same ids and layout from step to step, so only the change moves. Mark what is new in the story.
- **Name the wrong idea.** If there is a natural wrong reading, such as "the transaction makes checkout atomic", say it, show the case where it fails, then give the right one.
- **Give a concrete example, then say which part is the idea.** In a note: "This line is the retry. The rest is setup." A second example with a different surface shows what stays the same.
- **Layer the detail.** The story and the captions carry the main line. Notes carry the detail, and inner diagrams carry the depth. An expert reads the stories. A newcomer opens the notes.
- **Show the real code.** Point at it with `file=` and `lines=` instead of pasting it, so it cannot drift. To compare before and after, use two notes, one with a revision such as `file=main:api/session.go`.
- **End with a question,** when it helps the reader check themselves: "If the card is declined after authorize, what does the customer see?" Ask for a prediction, not "makes sense?".

### Write plainly

- Start with the problem in one plain sentence. Then say why it matters, and connect the steps with "so" and "because", so the logic is visible.
- Give at most one concrete example per point.
- Name files and functions only when the reader needs them to act. They are evidence, not the explanation.
- Say what a project term means the first time you use it.
- When you simplify, say what you left out, so the reader does not fill the gap with a wrong idea.

## Mistakes to avoid

- A diagram of every class in the diff. Structure is not behaviour.
- Steps that change the layout, so the reader has to search for what moved.
- A story that repeats the diagram's labels instead of saying why.
- Code pasted into notes, when the file is in the repo.
- Handing over without walking every step. A shape that does nothing on click looks broken.
