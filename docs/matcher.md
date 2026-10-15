# Matcher

Mermaid draws an SVG, but it gives no direct way to ask "which piece is the node `api`?". Each chart type hides the chartId in a different place: in an element id, in a `name` attribute, in the label text, or only in where the arrow starts and ends. So the page needs a matcher, with one rule per chart type, to find the right piece for each note before it can make that piece clickable.

How a node interaction in `diagrams.js` becomes a clickable Mermaid shape. The lookup is `js/mermaid-svg.js`. The listeners are `js/bind.js`. They run at the end of `show(viewId)`, after `mermaid.render` has inserted the SVG into `#camera`.

Mermaid only receives `view.chart`. `securityLevel` is `strict`, so Mermaid's own click syntax stays off. The tooltip, the panel text, and `opensView` live on the interaction, next to the chart string. The matcher finds the SVG piece for that chartId and `bind.js` attaches the listeners.

Shapes are wired before arrows. State arrows need the shape centers from that first pass.

## The interaction

A node interaction is an entry in `view.nodeInteractions`. The map key is the chartId. The stored object does not keep `chartId` itself. `nodeInteractions()` copies the key on and sets `kind: "node"`.

An edge interaction is either `[from, to]` or the object `arrow()` returns. `from` and `to` are chartIds. `edgeInteractions()` turns both into one record: `from`, `to`, a panel label made from the two node labels, `edgeId` of `from-to-index`, and `kind: "edge"`. Extra fields (`tooltip`, `body`, `mermaidText`, `opensView`) are kept. A stored `label` or `tooltip` replaces the generated one.

## Mermaid shapes

`chartKind` reads the first line of `view.chart`. `findMermaidShapes(svg, chartId)` uses one pattern for that kind and returns the shape group. It does not try a second pattern when the first misses.

Mermaid prefixes every DOM id with the render id, `diagram-<n>-`.

1. **Flowchart.** A `g.node` whose id ends in `flowchart-<chartId>-<number>`. `api` matches `diagram-2-flowchart-api-3`. Mermaid draws an image node as `g.image-shape` and an icon node as `g.icon-shape`, without the `node` class, so those two are looked for as well.
2. **C4.** A `g.node.c4-shape` whose id ends in `-<chartId>`. `reader` matches `diagram-5-reader`. Markers are not shape groups, so they do not match.
3. **Sequence.** `name` equals the chartId, on `rect.actor` or `g.actor-man` only. The top and bottom boxes both match, so one interaction is wired twice. Lifelines carry the same name and are not selected.
4. **State.** A `g.node` whose id ends in `state-<chartId>-<number>`. `Draft` matches `diagram-1-state-Draft-1`. The start and end dots are `root_start` and `root_end`, so they do not match a state name.

`visibleShape` then drops anything under 8 by 8 pixels. Sequence lifelines are tall and have almost no width. They are not selected, and this check still drops a group that has no real box.

`wireShape` makes the surviving group a button: hover, click, double-click, Enter, and Space. It sets `data-chart-id` to the chartId. If the interaction has `opensView`, a green ↘ badge is drawn from the group's box. Double-click or the badge calls `show(opensView)`.

## Mermaid arrows

`bindEdgeInteractions` claims each edge interaction once. The first matcher that takes it wins.

1. **Flowchart id.** The stroke is `path.flowchart-link`. Mermaid puts the endpoints in the id, ending in `L_<from>_<to>_<n>`. `from` and `to` are chartIds. The label is a separate `g.edgeLabel`. Two arrows between the same chartIds differ only in `<n>`, so the matcher takes the first path that is not wired yet. `nearestFlowchartLabel` takes the unwired label whose center is within 160 diagram units of the path midpoint. The limit is multiplied by the camera scale, because the distance is measured on screen. The binder then sets `data-wired` so the next arrow cannot take it.
2. **Sequence text.** These strokes are not named with the endpoints. Mermaid emits `messageText`, then `messageLine`, as siblings. The interaction must set `mermaidText`. The rendered text must equal `mermaidText`, or start with it. Every edge interaction tries an exact match before any of them falls back to a prefix, so "Pay" does not take "Pay refund". Each message is wired once.
3. **C4 text.** Every relationship sits in one group. A `line` or `path` starts a relationship. The `text` nodes after it belong to that relationship, until the next stroke. Matching uses `mermaidText`, the same way sequence does. Two arrows that both say "Reads" are taken in source order, because each match sets `wired`.
4. **State geometry.** What remains is `path.transition`. Those ids do not name the endpoints. The matcher samples a point near each end of the path and finds the nearest already-wired shape. Start and end dots are not node interactions. Mermaid draws them as `root_start` and `root_end`, and edge interactions call them `*`. Both directions are scored. A candidate has to land within 360 diagram units, scaled by the camera the same way. The closest pairs are kept, and each path and each edge interaction is used once.

Path coordinates ignore the camera's CSS transform. `getScreenCTM` includes it, so those points line up with `getBoundingClientRect`.

The visible stroke is too thin to hover. `wireArrow` clones it, strips the arrowhead, and puts an 18px transparent stroke (`.edge-hit`) on top. `pointer-events` is `stroke`, so the empty middle of the arrow is still a miss. Only the first stroke is a keyboard button. The label listens too, and it is not a second tab stop. Both get `data-edge-id`.

An arrow uses the same click and double-click handlers as a shape. An arrow with `opensView` has no ↘ badge. The tooltip says to double-click.

## What the matcher does not do

It does not parse the chart. It does not ask Mermaid to bind clicks. It does not change which diagram is showing. That is `show(viewId)`. Hover dimming and search run later, on the classes `bind.js` added (`.is-node`, `.is-edge`, `.is-edge-label`).
