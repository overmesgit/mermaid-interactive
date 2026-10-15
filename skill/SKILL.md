---
name: interactive-explainer
description: Explain something hard as one HTML page of clickable Mermaid diagrams, walked step by step, with notes and real code in a side panel. Use it for a concept (how an index speeds up reads, what a consensus protocol guarantees), a subsystem (how checkout works, end to end), or a change (a pull request, a commit, a design proposal). Use when asked to explain, teach, or walk someone through something visually.
---

# Interactive explainer

Some ideas are hard to follow as prose, because the reader has to keep several moving parts in their head at once. This skill puts the explanation into one HTML file: a short lesson of Mermaid diagrams, walked with Prev and Next. Every shape and arrow can be clicked for a note, and a note can show real code from the repo.

You write one content file, `diagrams.js`. The skill holds the page, so you only put your content into it.

## What you write

- **A lesson.** One tab, with a view per step. Prev and Next walk the steps.
- **A diagram per step.** A flowchart, sequence, state, or C4 chart. Only these four are clickable.
- **A story per step.** The side panel shows it when nothing is selected. It says what the step shows and why, so a reader can follow without clicking.
- **Notes.** One per shape or arrow that matters: a one-line tooltip, then markdown. A note can show code from the repo with `file=`.
- **Inner diagrams,** when needed. A shape can open a more detailed diagram on double-click.

[references/format.md](references/format.md) describes every field, with a complete example. Read it before writing.

## Kinds of explanation

Most requests are one of three kinds. They differ in what you read first, what question opens the lesson, and how much code it shows.

### A concept

An idea that holds beyond one codebase: how a B-tree index works, why a cache needs an eviction policy, what "eventually consistent" promises.

- **Read first:** what the reader already works with, so you can attach the idea to it. A concept explained in the reader's own system sticks better than one explained in the abstract.
- **Open with:** the question the idea answers, or the failure it prevents. "Why does adding an index make writes slower?"
- **Typical steps:** the problem without the idea, the smallest case that shows the idea working, the hard part, a second example that looks different, and where the idea stops working.
- **Code:** often none. A three-line sketch in a note is enough. Use `file=` only when the reader's repo has a real instance.
- **Watch for:** a wrong idea the reader already holds. Concepts are where these live.

### A subsystem

How a part of a real system works: what happens between a click on Pay and the order showing Paid, how a job queue retries, where a request's session comes from.

- **Read first:** the entry point, then follow one real request or job through the code. Note what each part holds, and where control waits or leaves (calls, queues, callbacks).
- **Open with:** the question a newcomer would ask. "When a payment times out, who decides whether to retry?"
- **Typical steps:** the small whole (one happy path, end to end), then one part opened up, then one complication at a time, such as an error, a retry, or a second user. Come back to the whole picture at the end.
- **Code:** point at the few lines that carry each step with `file=` and `lines=`. Not every function on the path.
- **Watch for:** drawing the module structure and calling it an explanation. Show what runs, in what order, and what changes.

### A change

A pull request, a commit, a migration, or a design proposal: what changed, why, and what it means for the system.

- **Read first:** the diff, the description, the linked issue or incident, and the commits. Then read enough of the surrounding code to draw how it worked before.
- **Open with:** the problem the change solves, not the change itself. "Customers were charged twice when the payment page timed out." Not "This PR adds an idempotency key table."
- **Typical steps:** how it works today, where that goes wrong, the hard part of the fix, how it works after, and what a reviewer should check.
- **Code:** show the changed lines. To compare before and after, use two notes, one with a revision such as `file=main:api/session.go`. A diff cannot be shown directly.
- **Watch for:** one diagram per changed file. Explain the behaviour that changed, and leave the file list to the diff.

A request can mix kinds. A change to a subsystem the reader does not know needs a step or two of the subsystem first. Something else, such as an incident or a protocol, usually fits one of the three: an incident is a change to how the system behaved, and a protocol is a concept or a subsystem.

## Workflow

1. **Find out what to explain, and for whom.** Pick the kind above and read what it says to read first. Note the one or two ideas everything else depends on. If you do not know the reader, assume someone who knows the field but not this topic, and say so in the first story.
2. **Plan the lesson before writing.** Write the step titles as a list, starting from the kind's typical steps. Three to seven steps is usual. See [How to explain](#how-to-explain).
3. **Write `diagrams.js`.** Put it where the user asks. When notes show code with `file=`, the join in step 4 runs from the root of that repo. Follow `references/format.md`.
4. **Put it into the page, look at it, and check it,** as steps 2 to 4 of `references/format.md` describe. The command writes `explanation.html` from the template in `assets/`, and packs every file the notes name. If you can open a browser, open the file, walk every step, and fix everything under the amber ⚠ chip. If you cannot, go through the checklist in `references/format.md` by hand.
5. **Hand over `explanation.html`.** Say where it is and what it covers. Do not commit it or publish it unless asked. Where it is hosted is up to whoever uses it.

## How to explain

These rules come from research on teaching. The first four decide what to explain, and the rest decide how to show it.

### Decide what to explain

- **Know the reader.** Start from what they already know: the code they touch, the words they use. When an explanation fails, a piece is missing, the pieces are not connected, or the reader holds a wrong idea. Each needs a different fix.
- **Start from the question.** Open the first story with the question or the failure the topic answers, in one or two sentences. Come back to it in the last step and answer it.
- **Show a small whole first.** The first diagram is the smallest version of the whole that still works: one request, one record, one happy path. Every later step adds one thing to it. A list of components is not a small whole.
- **Find the hard part, and spend the words there.** Ask which idea, once understood, makes the rest obvious. Give it its own step, its own diagram, and its own example. The boxes everyone knows get a caption, not a paragraph.

### Show it

- **Show the machine.** For anything that runs, show what runs, in what order, and what changes. Follow one concrete input and name its value at each step.
- **Match the chart to the idea.** Sequence for an order of events, state for a lifecycle, flowchart for structure and dependencies, C4 for systems and who uses them. Cut every box the explanation does not use.
- **One change per step.** Keep the same ids and layout from step to step, so only the change moves. Mark what is new in the story.
- **Name the wrong idea.** If there is a natural wrong reading, such as "the database transaction makes checkout atomic", say it, show the case where it fails, then give the right one.
- **Give a concrete example, then say which part is the idea.** In a note: "This line is the retry. The rest is setup." A second example with a different surface shows what stays the same.
- **Use an analogy carefully.** Map how the parts relate, not how they look, and say where the analogy breaks.
- **Layer the detail.** The story and the captions carry the main line. Notes carry the detail, and inner diagrams carry the depth. An expert reads the stories. A newcomer opens the notes.
- **Show the real code** when there is some. Point at it with `file=` and `lines=` instead of pasting it, so it cannot drift.
- **End with a question,** when it helps the reader check themselves: "If the card is declined after it was authorized, what does the customer see?" Ask for a prediction, not "makes sense?".

### Write plainly

- Start with the problem in one plain sentence. Then say why it matters, and connect the steps with "so" and "because", so the logic is visible.
- Give at most one concrete example per point.
- Name files and functions only when the reader needs them to act. They are evidence, not the explanation.
- Say what a project term means the first time you use it.
- When you simplify, say what you left out, so the reader does not fill the gap with a wrong idea.

## Mistakes to avoid

- A diagram of every class or file involved. Structure is not behaviour.
- Steps that change the layout, so the reader has to search for what moved.
- A story that repeats the diagram's labels instead of saying why.
- Code pasted into notes, when the file is in the repo.
- Handing over without walking every step. A shape that does nothing on click looks broken.
