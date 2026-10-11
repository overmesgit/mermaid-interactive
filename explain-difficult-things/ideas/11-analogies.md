# Use analogies carefully

Map how the parts relate, not how they look, and say where the analogy breaks.

## Why

A good analogy carries a structure the reader already knows into a new area: what causes what, what limits what. A weak analogy carries surface features ("a queue is like a line at a shop") and stops there. Every analogy breaks somewhere. If the explainer does not say where, the reader carries the broken part across and gets a new wrong idea.

## How

1. Introduce the new idea.
2. Bring up the familiar one.
3. Name the parts of each that matter.
4. Map them: which part plays which role, and which cause or limit carries across.
5. Say where the analogy breaks.
6. State what the reader should conclude about the new idea.

## Example

A message queue is like a restaurant's order rail. The waiter (producer) clips tickets, cooks (consumers) take them in order, and a busy kitchen does not stop waiters from taking orders. Where it breaks: a ticket lost on the rail is gone, but a queue can redeliver a message that a consumer dropped. That is why consumers must handle duplicates.

## Watch out

- Pick an analogy the reader actually knows. One from outside their world adds a second thing to learn.
- Step 5 is the step most often skipped.

Based on: Gentner's structure-mapping; Glynn's teaching-with-analogies model.
