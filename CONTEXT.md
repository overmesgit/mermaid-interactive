# Context

Read this before changing the product. It is the shared context for the page: what it is, what it must keep doing, and where the rest of the knowledge lives.

## What this is

A tool for explaining hard things: a concept, a subsystem, a pull request. An explanation is a series of Mermaid diagrams. The page draws them in the browser and adds the interactions Mermaid does not provide: a tooltip, a details panel, drill-down into another diagram, a lesson walked with Prev and Next, and camera pan and zoom. The same page can export one HTML file.

The product is two parts ([ADR-025](docs/decisions/025-explainer-skill.md)):

- **The engine.** The page an explanation runs in: `page.html`, `styles.css`, and `js/`. The editor, `index.html`, shows a content file in it.
- **The skill.** `skill/`, a folder an agent loads. It holds the content format, the workflow, and the engine as one template page with a marker line where the content goes. With it an agent writes one content file, like `diagrams.js`, puts it in place of the marker, and hands over one HTML file, for example as a link in a PR.

`examples/` holds sample content files. `bookshop.js` has one tab per kind of diagram, `go-router.js` is a full lesson, `pr-checks.js` explains a real commit the way the skill would, and `oauth-pkce.js` explains a protocol with sequence charts.

## Who it is for

- The author, a software engineer, who builds the tool. The useful way to work is in the code, in small steps, with the page still running after each step.
- The reader of an explanation. For a PR that is a reviewer who opens the link cold and has a few minutes.
- The agent that writes an explanation. It does not see the page, so everything it needs is written in `skill/`.

## Requirements that still hold

- It runs in the browser.
- A click on a node or an arrow opens a side panel with the notes for that shape.
- An explanation can name a few types of thing, such as requests and routes. Each type has one color, in the diagram and in the text ([ADR-052](docs/decisions/052-one-color-per-type.md)).
- The side panel shows the view's story. A view with no story lists its shapes and arrows instead. Close hides it until the Story button ([ADR-033](docs/decisions/033-story-panel.md)). A part's note opens inline in the story, under the card or link that was clicked, or as a peek card on the canvas by its shape. Each link chooses with its title. Either way the story keeps its place, so the reader sees the detail and the whole picture together. Escape, ×, or a second click on the link closes the note ([ADR-053](docs/decisions/053-inline-and-peek-notes.md)).
- The story can show a part's card between its paragraphs, where the text talks about that part. A story links every part that has a body, facts, or an inner diagram, because there is no list under it ([ADR-041](docs/decisions/041-story-links-to-parts.md), [ADR-052](docs/decisions/052-one-color-per-type.md)).
- A lit arrow flows from its start to its end: selected, hovered, or new on this lesson step ([ADR-042](docs/decisions/042-lit-arrows-flow.md)).
- Hover shows a tooltip.
- If a shape has its own diagram, a ↘ badge marks it, and a double-click opens that diagram.
- Arrows work the same way as nodes: tooltip, panel, highlight, and drill-down when `opensView` is set.
- Hover may dim unrelated shapes. The dim stays light.
- Double-click drills in without selecting the label. Text in the panel stays selectable.
- Export produces one HTML file. That file still loads Mermaid from the network.
- A tab can hold a lesson, a series of diagrams. Prev and Next move along it, and they stay when a shape's inner diagram is open.
- An explanation is one content file, apart from the engine ([ADR-026](docs/decisions/026-content-file.md)).
- An agent can produce the HTML file without a browser or a script runtime. The page checks the content and shows a warning instead of drawing a dead shape ([ADR-029](docs/decisions/029-join-and-check-in-page.md)).
- A note shows a file from the repo the explanation is about, by path and line range, or an older version of it by git revision. The whole file is packed into the content file as gzip, so the panel can open all of it, and the content file alone is the whole explanation ([ADR-030](docs/decisions/030-code-folder.md), [ADR-035](docs/decisions/035-code-from-the-repo.md), [ADR-048](docs/decisions/048-pack-files-into-the-content-file.md)).
- Anyone can read a content file in the editor on GitHub Pages, without the repo or a server. It runs in a sandboxed frame, so it cannot reach the site ([ADR-048](docs/decisions/048-pack-files-into-the-content-file.md), [ADR-054](docs/decisions/054-one-editor-page.md)).
- An explanation opened months later draws the same way. Mermaid and marked load at exact versions ([ADR-028](docs/decisions/028-pinned-cdn.md)).
- Where a PR link points is not decided. The skill ends with the file, and publishing is a separate step.

## How it runs

There is no build and no framework, so a change shows up on reload.

- **Files.** `page.html`, `styles.css`, and the scripts in `js/` are the engine. `index.html` is the editor: it puts those files into one page, shows the content file you open in it, and saves that page without content as the skill's template, `skill/assets/explainer.html` ([ADR-054](docs/decisions/054-one-editor-page.md)).
- **Libraries.** Mermaid 11 and marked 15 load from jsDelivr.
- **Drawing.** Mermaid draws the SVG. `securityLevel` is `strict`, so Mermaid's own click handlers are off, and this page adds its own to the finished SVG.
- **Changing the diagram.** `show()` in `js/nav.js` is the only way.
- **Notes.** A panel note is markdown. marked renders it, and HTML written in a note shows as text. Part cards, part links, and code files start as empty placeholders that the page fills in ([ADR-055](docs/decisions/055-fewer-features.md)).

Open the editor through a local server, because it reads `page.html` and `js/`, and a browser blocks that on `file://`. [README](README.md#run-it) has the command. A finished page needs no server.

## Where knowledge lives

| Kind | Where |
| --- | --- |
| Shared context | `CONTEXT.md` |
| Decisions | `docs/decisions/`. A later file replaces an earlier one, and one that no longer holds is deleted. |
| Implementation | The source. |
| Matcher | `docs/matcher.md`. How a note is found in the SVG Mermaid drew. |
| Content format | `skill/references/format.md`. The only description of what a content file holds. |
| How to explain | `docs/rules.md`. Rules learned from reading real explanations, each with its example. `explain-difficult-things/` holds the research notes behind them. |

There is no ticket system, chat archive, or wiki connected to this repo. The conversation that produced the page is captured in the decision log.

## How to keep the docs

1. Put context here when it would otherwise have to be repeated in every task. Business nuance, constraints, and the requirements above belong in this file.
2. Record a decision as a new ADR. Do not rewrite an accepted ADR. When a choice changes, add a new ADR and set the old one's status to say what it replaces. Once nothing in an ADR still holds, delete it. Git keeps it.
3. Write for a reader who was not there. Start with the problem in plain words, then say why it matters, then give one example if it helps. Name files and functions only when the reader needs them. In an ADR this is the Context section. [ADR-003](docs/decisions/003-two-zooms.md) is a good model.
4. Keep the files in this repo, in Markdown, next to the code they describe.
5. `docs/matcher.md` is the written account of the binder. A behavior change it describes updates it in the same change. Do not add a function-by-function manual beside it.
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
- **view**. One diagram in `DIAGRAMS.views`. Its key is its `viewId`, the hash segment in the link, and the `app.views` key.
- **engine**. The page an explanation runs in: `page.html`, `styles.css`, and `js/`. It is the same for every explanation.
- **content file**. One explanation: a script that sets `window.DIAGRAMS`. The editor shows the one you open. `arrow()`, `md`, and `packFile()` come from `js/helpers.js`. The format is `skill/references/format.md`.
- **code file**. A file a note shows with `~~~lang file=path lines=a-b`. The path starts at the root of the repo the explanation is about, and `rev:path` names an older version.
- **inner diagram**. The view a shape or arrow opens with a double-click. A ↘ badge marks a shape that has one. Opening one is called drill-down, or a drill.
- **claim**. When an arrow matcher takes an edge interaction, so no later matcher can use it.
- **inline note**. A part's note opened inside the story, right under the card or link that opened it.
- **peek**. A part's note as a card on the canvas, held against its shape: beside it, below it, or in the corner.
- **story**. A view's own note, about the whole diagram. The side panel shows it, with an inline note opened inside it. A line in it that links only to parts, like `[API](#api)`, shows those parts' cards in its place.
- **lesson**. The ordered view ids on a tab. A drill view is not in the lesson. Each view in it is a lesson step. Prev and Next move between steps, and stay on the step an inner diagram was opened from.

`js/mermaid-svg.js` finds Mermaid shapes and arrows. `js/bind.js` wires interactions onto them. Neither file decides which diagram is showing. That is `show(viewId)`.

## What a change should assume

- One binder for flowcharts, C4, sequence, and state. It runs after `mermaid.render`.
- Drill-down calls `show(viewId)` and replaces the SVG. The wheel only changes the camera.
- The panel width is chosen by dragging its left border.
- A click must not draw a frame around the label.
