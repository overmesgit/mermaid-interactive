# ADR-056 Sequence arrows take clicks across their width, and an arrow can have a type

- Status: accepted
- Date: 2026-10-17
- Supersedes: in [ADR-043](043-status-and-weight.md), marking New a part with a type

## Context

The OAuth PKCE example was the first to lean on sequence diagrams: `box` around participants, `rect` to shade a block of steps, `alt` for two cases, and messages over two lines. Before writing it, a test chart with each of these was checked in Chrome, one point at a time, to see what a click there would reach.

`box`, `rect`, and `alt` broke nothing. Mermaid draws their backgrounds before the messages, so a message stays on top. But the test found three other problems, and the example found a fourth.

1. **A sequence arrow was hard to click.** Every arrow gets a wide, invisible copy that takes the clicks. Mermaid's sequence style sets every line in the diagram to 2px, and its rule names the diagram's id, so it beat the page's rule for the copy. So the copy was 2px wide, and a click a few pixels off the line missed. A reply, drawn dashed, was worse, because the copy kept the dashes and a click in a gap missed too. This was true of every sequence chart, not only ones with a `box` or a `rect`.
2. **A message over two lines was not found.** `A->>B: Authorize<br>with challenge` is drawn as two pieces of text, and the page read only the last one, `with challenge`. So no `mermaidText` matched, and the arrow did nothing.
3. **A value carried by a message had no color.** The example gives each kind of value, such as the login code, its own color. In a flowchart the value is a shape, and a shape can have a `type`. In a sequence chart the value travels on a message, and an arrow's `type` did nothing.
4. **A new part's green hid its type.** On a lesson step that shares a part with the step before, the page marks each part the step adds as New, in green. Each sequence step of the example is a different run with the same participants, so every message the attack step adds turned green, the attacker included. Green read as good news, and the attacker's requests lost the color of the code they carry.

## Decision

- The click copy of an arrow is always 18px wide and never dashed. The CSS rule says so with `!important`, because Mermaid's rule names the diagram's id and the dashes sit in the line's own style.
- The text pieces before a sequence message's line are all its label, joined with a space. So `mermaidText: "Authorize with challenge"` finds the message written with `<br>`, and every piece takes clicks. The content check reads `<br>` in a chart as a space too.
- An arrow can have a `type`. Its line and its label take that type's color, the same way a shape does. A `status` still wins.
- A part with a type keeps its type's color on a lesson step that adds it. New is the page's guess, and the type is the author's choice. A part with no type is marked New as before.

## Consequences

Every message in every sequence chart takes a click anywhere along it, and up to 9px to each side at full size. The test chart missed 88 of its test points before the change, and none after.

`box`, `rect`, `alt`, `loop`, `opt`, `par`, and `critical` can be used freely, and were each checked the same way. The TODO no longer lists them.

An author who wants a typed part marked New on a step says so with `status: "new"`.

A click in the empty space beside a stick-figure `actor` still reaches nothing, because the figure's box is mostly empty. A `participant` is a box, so it does not have this problem.
