# Context

Read this before changing the product. It is the shared context for the page: what it is, what it must keep doing, and where the rest of the knowledge lives.

## What this is

A tool for explaining hard things: a concept, a subsystem, a pull request. An explanation is a series of Mermaid diagrams. The page draws them in the browser and adds the interactions Mermaid does not provide: a tooltip, a details panel, drill-down into another diagram, a lesson walked with Prev and Next, and camera pan and zoom. The same page can export one HTML file.

The product is two parts ([ADR-025](docs/decisions/025-explainer-skill.md)):

- **The engine.** This page: `index.html`, `styles.css`, and `js/`.
- **The skill.** `skill/`, a folder an agent loads. It holds the content format, the workflow, and the engine as one template page with a marker line where the content goes. With it an agent writes one content file, like `diagrams.js`, puts it in place of the marker, and hands over one HTML file, for example as a link in a PR.

The sample subject is a bookshop. The tabs are Architecture, C4, Flow, Sequence, State, and How. How explains this page.

## Who it is for

- The author, a software engineer, who builds the tool. The feedback log calls them A. The useful way to work is in the code, in small steps, with the page still running after each step.
- The reader of an explanation. For a PR that is a reviewer who opens the link cold and has a few minutes.
- The agent that writes an explanation. It does not see the page, so everything it needs is written in `skill/`.

## Requirements that still hold

- It runs in the browser.
- A click on a node or an arrow opens a side panel with the notes for that shape.
- With nothing selected, the side panel shows the view's story and a list of its shapes and arrows. Close hides it until the Story button. Escape from a note goes back to the story ([ADR-033](docs/decisions/033-story-panel.md)).
- The story can show a part's card between its paragraphs, where the text talks about that part. Those parts are not listed again under it ([ADR-041](docs/decisions/041-story-links-to-parts.md)).
- A lit arrow flows from its start to its end: selected, hovered, found by search, or new on this lesson step ([ADR-042](docs/decisions/042-lit-arrows-flow.md)).
- Hover shows a tooltip.
- If a shape has its own diagram, a double-click or the ↘ badge opens that diagram.
- Arrows work the same way as nodes: tooltip, panel, highlight, and drill-down when `opensView` is set.
- Hover may dim unrelated shapes. The dim stays light.
- Double-click drills in without selecting the label. Text in the panel stays selectable.
- Export produces one HTML file. That file still loads Mermaid from the network.
- The How tab explains the page as a series of diagrams. Prev and Next move along that series, and they stay when a shape's inner diagram is open. The panel note is markdown, and the code is part of that note.
- An explanation is one content file, apart from the engine ([ADR-026](docs/decisions/026-content-file.md)).
- An agent can produce the HTML file without a browser or a script runtime. The page checks the content and shows a warning instead of drawing a dead shape ([ADR-029](docs/decisions/029-join-and-check-in-page.md)).
- A note shows a file from the repo the explanation is about, by path and line range, or an older version of it by git revision. The whole file is packed into the page as gzip, so the panel can open all of it ([ADR-030](docs/decisions/030-code-folder.md), [ADR-035](docs/decisions/035-code-from-the-repo.md)).
- An explanation opened months later draws the same way. Mermaid and marked load at exact versions ([ADR-028](docs/decisions/028-pinned-cdn.md)).
- Where a PR link points is not decided. The skill ends with the file, and publishing is a separate step.

## How it runs

There is no build and no framework, so a change shows up on reload.

- **Files.** `index.html`, `styles.css`, and the scripts in `js/` are the engine. `diagrams.js` is the sample content, and `examples/` holds more. `?src=` in the link picks which one the page shows.
- **Libraries.** Mermaid 11 and marked 15 load from jsDelivr.
- **Drawing.** Mermaid draws the SVG. `securityLevel` is `strict`, so Mermaid's own click handlers are off, and this page adds its own to the finished SVG.
- **Changing the diagram.** `show()` in `js/nav.js` is the only way.
- **Notes.** A panel note is markdown. `marked.lexer` splits it into pieces, and the page sets the text with `textContent`, so a note cannot inject HTML.
- **Code in How notes.** A fence such as `~~~js source=show` shows that function as the page loaded it, so the note cannot fall out of date.

Open it through a local server, because export reads the CSS and scripts, and a browser blocks that on `file://`. From the repo folder:

```bash
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/`. On Windows without Python, a PowerShell `HttpListener` on the same port works too.

## Where knowledge lives

| Kind | Where |
| --- | --- |
| Shared context | `CONTEXT.md` |
| Decisions | `docs/decisions/`. Append-only. A later file supersedes an earlier one. |
| Feedback | `docs/feedback.md`. The words used while shaping the page. |
| Implementation | The source, and the How tab inside the running page. |
| Matcher | `docs/matcher.md`. How a note is found in the SVG Mermaid drew. |
| Content format | `skill/references/format.md`. The only description of what a content file holds. |
| How to explain | `explain-difficult-things/`. Source notes for the skill's explanation guidance. Not rules yet. |

There is no ticket system, chat archive, or wiki connected to this repo. The conversation that produced the page is captured in the decision log and the feedback log.

## How to keep the docs

1. Put context here when it would otherwise have to be repeated in every task. Business nuance, constraints, and the requirements above belong in this file.
2. Record a decision as a new ADR. Do not rewrite an accepted ADR. When a choice changes, add a new ADR and set the old status to superseded.
3. Write for a reader who was not there. Start with the problem in plain words, then say why it matters, then give one example if it helps. Name files and functions only when the reader needs them. In an ADR this is the Context section. [ADR-003](docs/decisions/003-two-zooms.md) is a good model.
4. Keep the files in this repo, in Markdown, next to the code they describe.
5. The How tab is the lesson inside the page. `docs/matcher.md` is the written account of the binder. A behavior change that either one describes should update it in the same change. Do not add a second function-by-function manual beside those two.
6. A change to a field the engine reads, or to what the matcher can find, updates `skill/references/format.md` in the same change. An agent only knows what that file says.
7. If a task depends on knowledge that is not in this repo, say so. Do not invent a ticket, a chat, or a wiki entry.

## Vocabulary

Three sides meet on the page. A name should say which side it belongs to.

- **chartId**. The id written in the Mermaid source (`web` in `web["Web app"]`). Mermaid copies it into the SVG. It is not a key this page invents.
- **Mermaid shape**. The `<g>` Mermaid drew for one chartId.
- **Mermaid arrow**. The stroke Mermaid drew, plus its label when there is one.
- **Node interaction**. This page's tooltip, panel text, facts, and `opensView` for one chartId. Stored on `view.nodeInteractions`.
- **Edge interaction**. The same kind of data for an arrow: `from` and `to` are chartIds, `mermaidText` is the label Mermaid rendered, `edgeId` is the key this page makes (`from-to-index`). Stored on `view.edgeInteractions`.
- **Interaction**. Either kind at runtime, with `kind: "node"` or `kind: "edge"`.
- **opensView**. The viewId a double-click opens. This is not camera zoom.
- **view**. One diagram in `DIAGRAMS.views`. Its `viewId` is the hash segment and the `app.views` key.
- **engine**. The page itself: `index.html`, `styles.css`, and `js/`. It is the same for every explanation.
- **content file**. One explanation: a script that sets `window.DIAGRAMS`. The page loads the one named by `?src=` in the link, or `diagrams.js` without it. `arrow()` and `md` come from `js/helpers.js`. The format is `skill/references/format.md`.
- **code file**. A file a note shows with `~~~lang file=path lines=a-b`. The path starts at the root of the repo the explanation is about, and `rev:path` names an older version. Not the engine's `js/`, which `source=` reads.
- **inner diagram**. The view a shape or arrow opens with double-click or the ↘ badge. Opening one is called drill-down, or a drill.
- **How note**. A panel note on the How tab, which explains this page's own code.
- **code walk**. A How view that steps through one function, such as `how-show`. It is an inner diagram, not a lesson step.
- **claim**. When an arrow matcher takes an edge interaction, so no later matcher can use it.
- **story**. A view's own note, about the whole diagram. The side panel shows it when nothing is selected, with the parts list under it. A line in it that links only to parts, like `[API](#api)`, shows those parts' cards in its place.
- **lesson**. The ordered view ids on a tab. The How tab's lesson is the eight teaching pictures. A drill view is not in the lesson. Each view in it is a lesson step. Prev and Next move between steps, and stay on the step an inner diagram was opened from.

`js/mermaid-svg.js` finds Mermaid shapes and arrows. `js/bind.js` wires interactions onto them. Neither file decides which diagram is showing. That is `show(viewId)`.

## What a change should assume

- One binder for flowcharts, C4, sequence, and state. It runs after `mermaid.render`.
- Drill-down calls `show(viewId)` and replaces the SVG. The wheel only changes the camera.
- The panel width is chosen by dragging its left border.
- A click must not draw a frame around the label.
