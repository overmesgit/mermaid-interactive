# Decisions

One file per decision, numbered in the order they were made. A later decision can replace part of an earlier one, and the earlier file's status line says which part. An ADR is deleted once nothing in it still holds; git keeps it. For what holds today, read the requirements in [CONTEXT.md](../../CONTEXT.md) first.

| Status | Meaning |
| --- | --- |
| Current | In force and built. |
| Current, partly replaced by N | In force, except the part a later ADR changed. The ADR file says which part. |

## Agent mode

How an agent writes an explanation and hands it over.

| ADR | Decision | Status |
| --- | --- | --- |
| [025](025-explainer-skill.md) | The tool explains hard things, and agents use it through a skill | Current, partly replaced by 029, 037, 040, and 054 |
| [026](026-content-file.md) | Each explanation is one file, separate from the engine | Current, partly replaced by 030 and 048 |
| [027](027-one-file-from-a-template.md) | An agent delivers one HTML file | Current, partly replaced by 029 |
| [028](028-pinned-cdn.md) | Pin exact versions of Mermaid and marked | Current |
| [029](029-join-and-check-in-page.md) | No Python: join the files with a shell command, and let the page check them | Current, partly replaced by 037 and 048 |
| [037](037-fill-a-template.md) | Fill one template by replacing a marker line | Current, partly replaced by 048 and 054 |
| [040](040-skill-teaches-the-tool-first.md) | The skill teaches the tool first. How to explain comes later | Current |
| [048](048-pack-files-into-the-content-file.md) | Pack code files into the content file, and preview it on the site | Current, partly replaced by 049 and 054 |
| [049](049-export-without-a-server.md) | Export works without a server, so the preview page has one export button | Current, partly replaced by 054 |
| [054](054-one-editor-page.md) | One page, the editor, which builds the template from the engine | Current |
| [055](055-fewer-features.md) | Fewer features, and one form for content, so the engine stays small | Current |

## Finding and wiring shapes

How a note finds its piece of Mermaid's SVG and becomes clickable.

| ADR | Decision | Status |
| --- | --- | --- |
| [001](001-bind-the-svg.md) | Add clicks to the SVG Mermaid draws, instead of extending Mermaid | Current |
| [004](004-arrows.md) | Arrows are clickable, the same way as shapes | Current |
| [018](018-box-by-chart-type.md) | Find shapes with one rule per chart type | Current |
| [019](019-interaction-naming.md) | Names show whether a thing is Mermaid's or ours | Current, partly replaced by 054 |

## Camera and inner diagrams

Zooming the picture versus opening another diagram.

| ADR | Decision | Status |
| --- | --- | --- |
| [003](003-two-zooms.md) | Double-click opens an inner diagram. The wheel only zooms the camera | Current, partly replaced by 014, 015, and 055 |
| [014](014-selection-keeps-camera.md) | Clicking a shape keeps the zoom and the position | Current, partly replaced by 033 |
| [015](015-drill-transition.md) | Animate opening an inner diagram, and remember each diagram's zoom | Current |

## Side panel

| ADR | Decision | Status |
| --- | --- | --- |
| [009](009-panel-resize.md) | Drag the panel's border to resize it | Current, partly replaced by 014 |
| [033](033-story-panel.md) | The side panel tells the diagram's story by default | Current, partly replaced by 041, 052, and 053 |
| [041](041-story-links-to-parts.md) | The story points at parts where it talks about them | Current, partly replaced by 047 and 052 |
| [047](047-story-reading-cues.md) | The panel says how to read it, in readable text | Current, partly replaced by 052 and 053 |
| [052](052-one-color-per-type.md) | One color per type of thing, tables, a one-line note header, and no parts list under a story | Current, partly replaced by 055 |
| [053](053-inline-and-peek-notes.md) | A note opens inline under its link, or as a peek card by its shape | Current, partly replaced by 055 |

## Notes and code in the panel

| ADR | Decision | Status |
| --- | --- | --- |
| [030](030-code-folder.md) | Show code from a code/ folder, packed into the page | Current, partly replaced by 035 and 048 |
| [035](035-code-from-the-repo.md) | Read code files from the repo, not a code/ folder | Current |
| [045](045-mark-lines-in-code.md) | A code note can mark the lines that matter | Current |

## Lessons

Prev and Next through the steps of a tab.

| ADR | Decision | Status |
| --- | --- | --- |
| [020](020-lesson-steps.md) | Step through the How lesson with buttons, not badges | Current, partly replaced by 021 |
| [021](021-lesson-stays.md) | Prev and Next keep their place, even inside an inner diagram | Current, partly replaced by 022 |
| [022](022-lesson-on-diagram.md) | Prev and Next sit on the top left of the diagram | Current, partly replaced by 036 |

## Look and feel

| ADR | Decision | Status |
| --- | --- | --- |
| [005](005-light-dim.md) | Hover fades the other shapes only a little | Current |
| [006](006-selection.md) | Double-click does not select text in the diagram | Current |
| [010](010-label-frame.md) | Clicking a shape draws no box around its label | Current |
| [017](017-compact-chrome.md) | Fewer bars above the diagram, shortcuts behind ?, one font | Current, partly replaced by 036 |
| [032](032-shape-captions.md) | Each shape shows a short caption under its name | Current |
| [036](036-floating-controls.md) | Controls float over a full-window diagram | Current, partly replaced by 055 |
| [042](042-lit-arrows-flow.md) | A lit arrow flows from its start to its end | Current, partly replaced by 043 and 055 |
| [043](043-status-and-weight.md) | Each part can show its status and how much it matters | Current, partly replaced by 052 and 055 |
| [046](046-side-by-side-in-one-chart.md) | Show a change side by side in one chart | Current |

## Files and export

| ADR | Decision | Status |
| --- | --- | --- |
| [011](011-split-scripts.md) | Split app.js into one script per job, still with no build | Current, partly replaced by 019 and 054 |
## Old names

ADRs written before [ADR-019](019-interaction-naming.md) use older names. The decisions still hold under the new names:

| Old name | Name today |
| --- | --- |
| `app.js` | the scripts in `js/` ([ADR-011](011-split-scripts.md)) |
| `current.edges`, `edges` | `edgeInteractions` |
| `nodes` | `nodeInteractions` |
| `link()` | `arrow()` |
| `match` | `mermaidText` |
| `zoom` | `opensView` |
| `bindEdges` | `bindEdgeInteractions` |
| note id | chartId |
| the + badge | the ↘ badge ([ADR-015](015-drill-transition.md)) |
| `onNodeDblClick` | `onInteractionDblClick` |
| the stage bar | the floating controls ([ADR-036](036-floating-controls.md)) |
