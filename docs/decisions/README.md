# Decisions

One file per decision, numbered in the order they were made. Files are never deleted, so the history stays readable. For what holds today, read the requirements in [CONTEXT.md](../../CONTEXT.md) first.

| Status | Meaning |
| --- | --- |
| Current | In force and built. |
| Current, partly replaced by N | In force, except the part a later ADR changed. The ADR file says which part. |
| Planned | Agreed, not built yet. |
| Replaced by N | No longer in force. Read N instead. |

## Agent mode

How an agent writes an explanation and hands it over.

| ADR | Decision | Status |
| --- | --- | --- |
| [025](025-explainer-skill.md) | The tool explains hard things, and agents use it through a skill | Current, partly replaced by 029 |
| [026](026-content-file.md) | Each explanation is one file, separate from the engine | Current |
| [027](027-one-file-from-a-template.md) | An agent delivers one HTML file | Planned, partly replaced by 029 |
| [028](028-pinned-cdn.md) | Pin exact versions of Mermaid and marked | Current |
| [029](029-join-and-check-in-page.md) | No Python: join the files with a shell command, and let the page check them | Current, partly replaced by 037 |
| [034](034-pick-the-content-file.md) | Pick the content file with ?src= in the link | Current |
| [037](037-fill-a-template.md) | Fill one template by replacing a marker line | Current |

## Finding and wiring shapes

How a note finds its piece of Mermaid's SVG and becomes clickable.

| ADR | Decision | Status |
| --- | --- | --- |
| [001](001-bind-the-svg.md) | Add clicks to the SVG Mermaid draws, instead of extending Mermaid | Current |
| [004](004-arrows.md) | Arrows are clickable, the same way as shapes | Current |
| [018](018-box-by-chart-type.md) | Find shapes with one rule per chart type | Current |
| [019](019-interaction-naming.md) | Names show whether a thing is Mermaid's or ours | Current, partly replaced by 023 |

## Camera and inner diagrams

Zooming the picture versus opening another diagram.

| ADR | Decision | Status |
| --- | --- | --- |
| [003](003-two-zooms.md) | Double-click opens an inner diagram. The wheel only zooms the camera | Current, partly replaced by 014 |
| [014](014-selection-keeps-camera.md) | Clicking a shape keeps the zoom and the position | Current, partly replaced by 033 |
| [015](015-drill-transition.md) | Animate opening an inner diagram, and remember each diagram's zoom | Current |

## Side panel

| ADR | Decision | Status |
| --- | --- | --- |
| [009](009-panel-resize.md) | Drag the panel's border to resize it | Current, partly replaced by 014 |
| [016](016-panel-links.md) | The panel links to the connected shapes and arrows | Current |
| [033](033-story-panel.md) | The side panel tells the diagram's story by default | Current |

## Notes and code in the panel

| ADR | Decision | Status |
| --- | --- | --- |
| [012](012-markdown-notes.md) | Panel notes are markdown | Replaced by 013 |
| [013](013-notes-in-templates.md) | Keep How notes inside diagrams.js, not in separate files | Current, partly replaced by 024 |
| [024](024-notes-name-functions.md) | How notes show a function by name instead of a pasted copy | Current |
| [030](030-code-folder.md) | Show code from a code/ folder, packed into the page | Current, partly replaced by 035 |
| [035](035-code-from-the-repo.md) | Read code files from the repo, not a code/ folder | Current |
| [038](038-code-files-in-preview-and-export.md) | Preview reads code files from the server, and Export packs them | Current |

## The How lesson

The tab that explains this page, step by step.

| ADR | Decision | Status |
| --- | --- | --- |
| [007](007-file-map.md) | Explain the page with a map of its files | Replaced by 008 |
| [008](008-teach-in-the-tool.md) | The How tab teaches in steps, with code in the panel | Replaced by 012 |
| [020](020-lesson-steps.md) | Step through the How lesson with buttons, not badges | Current, partly replaced by 021 and 031 |
| [021](021-lesson-stays.md) | Prev and Next keep their place, even inside an inner diagram | Current, partly replaced by 022 |
| [022](022-lesson-on-diagram.md) | Prev and Next sit on the top left of the diagram | Current, partly replaced by 036 |
| [031](031-how-starts-from-the-content-file.md) | The How lesson starts from the content file | Current |

## Look and feel

| ADR | Decision | Status |
| --- | --- | --- |
| [005](005-light-dim.md) | Hover fades the other shapes only a little | Current |
| [006](006-selection.md) | Double-click does not select text in the diagram | Current |
| [010](010-label-frame.md) | Clicking a shape draws no box around its label | Current |
| [017](017-compact-chrome.md) | Fewer bars above the diagram, shortcuts behind ?, one font | Current, partly replaced by 036 |
| [032](032-shape-captions.md) | Each shape shows a short caption under its name | Current |
| [036](036-floating-controls.md) | Controls float over a full-window diagram | Current |

## Files and export

| ADR | Decision | Status |
| --- | --- | --- |
| [002](002-static-page.md) | Plain static files, with no build step | Replaced by 011 |
| [011](011-split-scripts.md) | Split app.js into one script per job, still with no build | Current, partly replaced by 019 and 023 |
| [023](023-export-script-list.md) | Keep one list of scripts, in index.html | Current, partly replaced by 034 |

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
| `mermaidShapesFor` | `findMermaidShapes` |
| note id | chartId |
| the + badge | the ↘ badge ([ADR-015](015-drill-transition.md)) |
