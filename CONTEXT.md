# Context

Read this before changing the product. It is the shared context for the page: what it is, what it must keep doing, and where the rest of the knowledge lives.

## What this is

A tool for explaining hard things: a concept, a subsystem, a pull request. An explanation is a series of Mermaid diagrams. The page draws them in the browser and adds the interactions Mermaid does not provide: a tooltip, a details panel, drill-down into another diagram, a lesson walked with Prev and Next, and camera pan and zoom. The same page can export one HTML file.

The product is two parts ([ADR-025](docs/decisions/025-explainer-skill.md)):

- **The engine.** This page: `index.html`, `styles.css`, and `js/`.
- **The skill.** `skill/`, a folder an agent loads. It holds the content format, the workflow, and, later, the prebuilt template and the build script. With it an agent writes one content file and hands over one HTML file, for example as a link in a PR.

The sample subject is a bookshop. The tabs are Architecture, C4, Flow, Sequence, State, and How. How explains this page.

## Who it is for

- A, a software engineer, who builds the tool. The useful way to work is in the code, in small steps, with the page still running after each step.
- The reader of an explanation. For a PR that is a reviewer who opens the link cold and has a few minutes.
- The agent that writes an explanation. It does not see the page, so everything it needs is written in `skill/`.

## Requirements that still hold

- It runs in the browser.
- A click on a node or an arrow opens a side panel with the notes for that shape.
- Hover shows a tooltip.
- If a shape has its own diagram, a double-click or the ↘ badge opens that diagram.
- Arrows work the same way as nodes: tooltip, panel, highlight, and drill-down when `opensView` is set.
- Hover may dim unrelated shapes. The dim stays light.
- Double-click drills in without selecting the label. Text in the panel stays selectable.
- Export produces one HTML file. That file still loads Mermaid from the network.
- The How tab explains the page as a series of diagrams. Prev and Next move along that series, and they stay when a shape's inner diagram is open. The panel note is markdown, and the code is part of that note.
- An explanation is one content file, apart from the engine ([ADR-026](docs/decisions/026-content-file.md)).
- An agent can produce the HTML file without a browser, and a content mistake fails the build instead of drawing a dead shape ([ADR-027](docs/decisions/027-one-file-from-a-template.md)).
- An explanation opened months later draws the same way. Mermaid and marked load at exact versions ([ADR-028](docs/decisions/028-pinned-cdn.md)).
- Where a PR link points is not decided. The skill ends with the file, and publishing is a separate step.

## How it runs

There is no build and no framework. The page is `index.html`, `styles.css`, `diagrams.js`, and the scripts in `js/`. Mermaid 11 and marked 15 load from jsDelivr. How notes are markdown strings in `diagrams.js`. A fence such as `~~~js source=show` shows that function as the page loaded it, so a whole function is named, not copied. `securityLevel` is `strict`, so Mermaid's own click syntax is off and this page binds the finished SVG. `show()` in `js/nav.js` is the only way to change the diagram. A panel note is markdown. `marked.lexer` turns it into elements, and the text is set with `textContent`.

Open it through a local server. Export fails on `file://` because it has to read the CSS and scripts. On this machine Python and Node were not available, so the preview server is a PowerShell `HttpListener` on `http://127.0.0.1:8765/`.

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
3. Keep the files in this repo, in Markdown, next to the code they describe.
4. The How tab is the lesson inside the page. `docs/matcher.md` is the written account of the binder. A behavior change that either one describes should update it in the same change. Do not add a second function-by-function manual beside those two.
5. A change to a field the engine reads, or to what the matcher can find, updates `skill/references/format.md` in the same change. An agent only knows what that file says.
6. If a task depends on knowledge that is not in this repo, say so. Do not invent a ticket, a chat, or a wiki entry.

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
- **content file**. One explanation: a script that sets `window.DIAGRAMS`. Today that is `diagrams.js`. The format is `skill/references/format.md`.
- **lesson**. The ordered view ids on a tab. The How tab's lesson is the seven teaching pictures. A drill view is not in the lesson. Prev and Next stay on the lesson step that view was opened from.

`js/mermaid-svg.js` finds Mermaid shapes and arrows. `js/bind.js` wires interactions onto them. Neither file decides which diagram is showing. That is `show(viewId)`.

## What a change should assume

- One binder for flowcharts, C4, sequence, and state. It runs after `mermaid.render`.
- Drill-down calls `show(viewId)` and replaces the SVG. The wheel only changes the camera.
- The panel width is chosen by dragging its left border.
- A click must not draw a frame around the label.
