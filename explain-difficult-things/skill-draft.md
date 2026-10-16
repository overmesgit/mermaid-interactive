# Draft: how to explain, for the skill

The explanation guidance that was in `skill/SKILL.md` until it was cut back to a manual for the tool. It is kept here for when the skill teaches how to explain well. It is drawn from the ideas in this folder.

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

## Explaining a PR: first draft

Written while making `examples/go-router.js`, which explains the Go 1.22 router. These are the steps that worked there. One example is not proof, so treat each step as a guess to test on the next PR.

1. **Find the whole change.** A feature often lands as many commits, not one PR. The Go router was about 20 commits over a month. Find the proposal or issue, list the commits, and pick two fixed points to compare, such as two release tags. Name those points in every `file=`, so the lines never move.
2. **Read the reasons before the code.** The proposal says what the authors cared about, and the code usually does not. For the router, one sentence explained half the design: which handler runs must never depend on the order routes were registered.
3. **Pick the reader and the opening question.** Write both down before the first diagram. For the router: a Go developer who has used `net/http` but has not read the change, and the question "why did servers add a third-party router just to route `GET /posts/{id}`?"
4. **Find the hard part by asking what would surprise the reader.** For the router it was "the more specific pattern wins, and two patterns where neither wins make the program panic at startup". The deepest point was in one code comment: the matcher can use a simple search order only because conflicting patterns were refused earlier. Each surprise gets its own step.
5. **Use one running example in every step.** Four routes for a small blog API, so the reader learns the example once and then only follows what changes.
6. **Run every claim you show.** Each example output in the router lesson came from running Go: the panic message, the 405 answer, the search that backs up. Some answers are easy to get wrong. For example, a `DELETE` gets a 405 only if no pattern matches at all, so registering `/` turns it into a normal response.
7. **Open with an overview.** The first step says the change in one sentence, shows before and after side by side in one chart, links the original change, and lists the steps ahead. When there is no single PR, link the proposal and the main reviews. Put the basics a newcomer needs in a separate tab, and point to it from the overview, so an experienced reader never passes through them.
8. **Order the rest as the hard part, how it works, what else changed.** End with a question the reader can answer from the lesson, and put the answer in a note. Five steps were enough for the router.
9. **Name the specifics in every sentence.** Write "`GET /posts/new` matches `GET /posts/new` and `GET /posts/{id}`", not "matches two patterns". The reader should not have to remember them from an earlier step.
10. **Draw what happens, not the rule.** "The more specific pattern wins" is a sentence. Its picture is the process: the request, the patterns that match, the comparison, the winner.
11. **Keep the code short.** Show 10 to 25 lines per note, and use `mark=` for the lines that carry the point. Show the old code from the old fixed point, next to the new. When the "before" is user code that is in no file, such as a handler that parses its own URL, write a short sketch in the note.
12. **Check it in a browser before handing over.** Walk every step and open each inner diagram. Look for labels that read the same but mean different things, such as a request and a pattern that are both `GET /posts/new`.
