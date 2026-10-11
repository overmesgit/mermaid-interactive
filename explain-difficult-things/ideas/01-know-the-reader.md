# Know the reader

Start from what this reader already knows and believes, not from the subject.

## Why

New ideas only stick when they attach to something the reader already has. When an explanation fails, the cause is usually one of three things. A piece is **missing**. The pieces are there but **not connected**. Or the reader holds an idea that is **wrong**, and reads the explanation through it. Each needs a different fix. The explainer is the worst judge of which one it is: once you know a subject, you stop seeing the steps you no longer have to think about.

## How

- Before explaining, find out what the reader works with: their role, the code they touch, the words they already use. Ask if you can; if you can't, infer it from context and say what you assumed.
- **Missing piece:** teach the prerequisite inside the explanation, right where it is needed, not as a glossary up front.
- **Not connected:** name the thing they already know and say how it relates ("this is the same retry loop you saw in the API client").
- **Wrong idea:** see [08-name-the-wrong-idea.md](08-name-the-wrong-idea.md).
- Write for someone one step outside the code. Every step you skip because it feels obvious is a step the reader may not have.

## Example

Explaining the bookshop's order state machine to a front-end developer: they know the checkout page but not the back end. Start from the button they built ("Place order"), then show which state that click moves the order into.

## Watch out

- A reader who says "I don't get it" usually has a missing piece. A reader who says "got it" may have read it through a wrong idea. Check with a question (see [09-make-them-do-something.md](09-make-them-do-something.md)).
- Help that a beginner needs slows down an expert. See [13-adjust-the-help.md](13-adjust-the-help.md).

Based on: Ausubel's meaningful learning; Taber's learning impediments; the curse of knowledge and expert blind spot.
