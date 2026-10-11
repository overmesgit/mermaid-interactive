# Decisions

Append-only. The current choice is the latest accepted ADR on that topic. An older file stays so the history is still readable. For what holds today, read the requirements in [CONTEXT.md](../../CONTEXT.md) first.

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

| ADR | Status | Choice |
| --- | --- | --- |
| [001](001-bind-the-svg.md) | accepted | Bind the SVG Mermaid already drew |
| [002](002-static-page.md) | superseded by 011 | Static files, Mermaid 11 from a CDN |
| [003](003-two-zooms.md) | accepted, fit and wait superseded by 014 | Drill-down replaces the SVG. The wheel only scales |
| [004](004-arrows.md) | accepted | Arrows use the same notes and handlers as nodes |
| [005](005-light-dim.md) | accepted | Hover dim stays light |
| [006](006-selection.md) | accepted | Double-click does not select the label |
| [007](007-file-map.md) | superseded by 008 | The first How tab was a map of files |
| [008](008-teach-in-the-tool.md) | superseded by 012 | How teaches in steps, with code in the panel |
| [009](009-panel-resize.md) | accepted, fit superseded by 014 | Drag the panel border to set its width |
| [010](010-label-frame.md) | accepted | A click does not frame the label |
| [011](011-split-scripts.md) | accepted, script list superseded by 019 | Scripts split by job, still no build |
| [012](012-markdown-notes.md) | superseded by 013 | Panel notes are markdown. How code lives in the note |
| [013](013-notes-in-templates.md) | accepted, copied code superseded by 024 | How notes are markdown templates in diagrams.js |
| [014](014-selection-keeps-camera.md) | accepted | A click selects and keeps the camera |
| [015](015-drill-transition.md) | accepted | Drill-down zooms toward the shape. Each view keeps its camera |
| [016](016-panel-links.md) | accepted | The panel links to connected shapes and arrows |
| [017](017-compact-chrome.md) | accepted | One header row, help behind ?, system font |
| [018](018-box-by-chart-type.md) | accepted | A box is matched by chart type |
| [019](019-interaction-naming.md) | accepted, script list superseded by 023 | Names say whether a thing is Mermaid's or ours |
| [020](020-lesson-steps.md) | accepted, drill hiding superseded by 021 | How moves with Back and Next |
| [021](021-lesson-stays.md) | accepted, placement superseded by 022 | Prev and Next stay put, including inside a node |
| [022](022-lesson-on-diagram.md) | accepted | Prev and Next sit on the top left of the diagram |
| [023](023-export-script-list.md) | accepted | Export reads the script list from the page |
| [024](024-notes-name-functions.md) | accepted | How notes name a function instead of copying it |
| [025](025-explainer-skill.md) | accepted, skill layout superseded by 029 | The page is an explainer, and agents make it through a skill |
| [026](026-content-file.md) | accepted, not built yet | One content file per explanation, apart from the engine |
| [027](027-one-file-from-a-template.md) | accepted, template and build.py superseded by 029 | The agent hands over one HTML file, built from a template |
| [028](028-pinned-cdn.md) | accepted, not built yet | Mermaid and marked load at exact versions |
| [029](029-join-and-check-in-page.md) | accepted, not built yet | The agent writes diagrams.js. The file is joined, and the page checks it |
| [030](030-code-folder.md) | accepted, not built yet | Notes show code from a code folder, packed into the page with gzip |
