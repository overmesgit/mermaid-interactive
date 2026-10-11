# Matcher

How a note in `diagrams.js` becomes a clickable shape in the SVG Mermaid drew. The code is `js/bind.js`. It runs at the end of `show()`, after `mermaid.render` has inserted the SVG into `#camera`.

Mermaid only receives `view.chart`. `securityLevel` is `strict`, so Mermaid's own click syntax stays off. The tooltip, the panel text, and `zoom` live on the note, next to the chart string. The matcher finds the SVG piece for that note and attaches the listeners.

Boxes are bound before arrows. State arrows need the box centers from that first pass.

## The note

A node is an entry in `view.nodes`. The map key is the id. The object does not store `id` itself. `bindNodes` copies the key on before matching.

An edge is either `[from, to]` or the object `link()` returns. `currentEdges` turns both into one record: `from`, `to`, a panel label made from the two node labels, and an id `from-to-index`. Extra fields on the object (`tooltip`, `body`, `match`, `zoom`) are kept.

## Boxes

`chartKind` reads the first line of the chart. `mermaidShapesFor` uses one pattern for that kind and returns the shape group. It does not try a second pattern when the first misses.

Mermaid prefixes every id with the render id, `diagram-<n>-`.

1. **Flowchart.** A `g.node` whose id ends in `flowchart-<note id>-<number>`. `api` matches `diagram-2-flowchart-api-3`.
2. **C4.** A `g.node.c4-shape` whose id ends in `-<alias>`. `reader` matches `diagram-5-reader`. Markers are not shape groups, so they do not match.
3. **Sequence.** `name` equals the note id, on `rect.actor` or `g.actor-man` only. The top and bottom boxes both match, so one note is attached twice. Lifelines carry the same name and are not selected.
4. **State.** A `g.node` whose id ends in `state-<name>-<number>`. `Draft` matches `diagram-1-state-Draft-1`. The start and end dots are `root_start` and `root_end`, so they do not match a state name.

`visibleShape` then drops anything under 8 by 8 pixels. Sequence lifelines are tall and have almost no width. They are not selected, and this check still drops a group that has no real box.

`attach` makes the surviving group a button: hover, click, double-click, Enter, and Space. If the note has `zoom`, a green ↘ badge is drawn from the group's box. Double-click or the badge calls `show(zoom)`.

## Arrows

`bindEdges` claims each edge once. The first matcher that takes it wins.

1. **Flowchart id.** The stroke is `path.flowchart-link`. Mermaid puts the endpoints in the id, ending in `L_<from>_<to>_<n>`. The label is a separate `g.edgeLabel`. `nearestFlowchartLabel` takes the unclaimed label whose center is within 160px of the path midpoint, then marks it claimed.
2. **Sequence text.** These strokes are not named with the endpoints. Mermaid emits `messageText`, then `messageLine`, as siblings. The note must set `match`. The rendered text must equal `match`, or start with it. Each message is used once.
3. **C4 text.** Every relationship sits in one group. A `line` or `path` starts a relationship. The `text` nodes after it belong to that relationship, until the next stroke. Matching uses `match`, the same way sequence does. Two arrows that both say "Reads" are taken in source order, because each match sets `used`.
4. **State geometry.** What remains is `path.transition`. Those ids do not name the endpoints. The matcher samples a point near each end of the path and finds the nearest already-bound box. Start and end dots are not nodes. Mermaid draws them as `root_start` and `root_end`, and notes call them `*`. Both directions are scored. A candidate has to land within 360px. The closest pairs are kept, and each path and each edge is used once.

Path coordinates ignore the camera's CSS transform. `getScreenCTM` includes it, so those points line up with `getBoundingClientRect`.

The visible stroke is too thin to hover. `wireMermaidEdge` clones it, strips the arrowhead, and puts an 18px transparent stroke (`.edge-hit`) on top. `pointer-events` is `stroke`, so the empty middle of the arrow is still a miss. Only the first stroke is a keyboard button. The label listens too, and it is not a second tab stop.

An arrow uses the same click and double-click handlers as a box. An arrow with `zoom` has no ↘ badge. The tooltip says to double-click.

## What the matcher does not do

It does not parse the chart. It does not ask Mermaid to bind clicks. It does not change which diagram is showing. That is `show()`. Hover dimming and search run later, on the classes this file added (`.is-node`, `.is-edge`, `.is-edge-label`).
