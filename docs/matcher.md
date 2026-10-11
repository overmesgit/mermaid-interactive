# Matcher

How a note in `diagrams.js` becomes a clickable shape in the SVG Mermaid drew. The code is `js/bind.js`. It runs at the end of `show()`, after `mermaid.render` has inserted the SVG into `#camera`.

Mermaid only receives `view.chart`. `securityLevel` is `strict`, so Mermaid's own click syntax stays off. The tooltip, the panel text, and `zoom` live on the note, next to the chart string. The matcher finds the SVG piece for that note and attaches the listeners.

Boxes are bound before arrows. State arrows need the box centers from that first pass.

## The note

A node is an entry in `view.nodes`. The map key is the id. The object does not store `id` itself. `bindNodes` copies the key on before matching.

An edge is either `[from, to]` or the object `link()` returns. `currentEdges` turns both into one record: `from`, `to`, a panel label made from the two node labels, and an id `from-to-index`. Extra fields on the object (`tooltip`, `body`, `match`, `zoom`) are kept.

## Boxes

`mermaidShapesFor` looks for the group Mermaid drew, in this order. The first try that finds anything wins. The later tries do not run.

1. **Id.** `idMatches` accepts the note id as the whole element id, or as the last dash-separated piece, with an optional `-<number>`. A flowchart node `api` is drawn as `flowchart-api-0`. A C4 person `reader` is drawn as something like `diagram-3-reader`. A match in the middle of the id does not count.
2. **Name.** Sequence actors do not use the name you wrote as their id. They expose `name="DB"`. The top and bottom actor boxes both match, so one note is attached twice.
3. **Label text.** Used when id and name both miss. The text of a `text`, `tspan`, `span`, `div`, or `p` must equal `node.label`, or one string in `node.match`. A parent is skipped when a child already has that same text, so the inner node wins.

When several elements match, an element that contains another match is dropped. The inner shape gets the listeners.

`visibleShape` then drops anything under 8 by 8 pixels. Sequence lifelines are tall and have almost no width, so they fail this test and do not become invisible click targets.

`attach` makes the surviving group a button: hover, click, double-click, Enter, and Space. If the note has `zoom`, a green + badge is drawn from the group's box. Double-click or the badge calls `show(zoom)`.

## Arrows

`bindEdges` claims each edge once. The first matcher that takes it wins.

1. **Flowchart id.** The stroke is `path.flowchart-link`. Mermaid puts the endpoints in the id, ending in `L_<from>_<to>_<n>`. The label is a separate `g.edgeLabel`. `nearestFlowchartLabel` takes the unclaimed label whose center is within 160px of the path midpoint, then marks it claimed.
2. **Sequence text.** These strokes are not named with the endpoints. Mermaid emits `messageText`, then `messageLine`, as siblings. The note must set `match`. The rendered text must equal `match`, or start with it. Each message is used once.
3. **C4 text.** Every relationship sits in one group. A `line` or `path` starts a relationship. The `text` nodes after it belong to that relationship, until the next stroke. Matching uses `match`, the same way sequence does. Two arrows that both say "Reads" are taken in source order, because each match sets `used`.
4. **State geometry.** What remains is `path.transition`. Those ids do not name the endpoints. The matcher samples a point near each end of the path and finds the nearest already-bound box. Start and end dots are not nodes. Mermaid draws them as `root_start` and `root_end`, and notes call them `*`. Both directions are scored. A candidate has to land within 360px. The closest pairs are kept, and each path and each edge is used once.

Path coordinates ignore the camera's CSS transform. `getScreenCTM` includes it, so those points line up with `getBoundingClientRect`.

The visible stroke is too thin to hover. `wireMermaidEdge` clones it, strips the arrowhead, and puts an 18px transparent stroke (`.edge-hit`) on top. `pointer-events` is `stroke`, so the empty middle of the arrow is still a miss. Only the first stroke is a keyboard button. The label listens too, and it is not a second tab stop.

An arrow uses the same click and double-click handlers as a box. An arrow with `zoom` has no + badge. The tooltip says to double-click.

## What the matcher does not do

It does not parse the chart. It does not ask Mermaid to bind clicks. It does not change which diagram is showing. That is `show()`. Hover dimming and search run later, on the classes this file added (`.is-node`, `.is-edge`, `.is-edge-label`).
