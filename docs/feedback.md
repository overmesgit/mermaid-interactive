# Feedback

What was said while the page was being shaped, in the order it was said. The spelling is the original. A line that changed a decision points at the ADR.

## 2026-10-10

> How could we implement something like diagrams but with click that opens side panel with tooltips with posiblity to zoom in if we click on element that have diagram too idealy it should work in browser and exported to something like html

This is the product. [ADR-001](decisions/001-bind-the-svg.md), [ADR-002](decisions/002-static-page.md), [ADR-003](decisions/003-two-zooms.md).

> is it possible to extend something like mermaid?

Yes, by binding the SVG it draws. [ADR-001](decisions/001-bind-the-svg.md).

> implement an few examples with mermaid architecture diagram of web app with c4 flow diagram 1-2 another popular diagram try to add usefull tooltips, side panel on click, zoom in on click try another useful inteructions any questoins?

The bookshop sample: architecture, C4, checkout flow, login sequence, order state. Tooltips, the panel, drill-down, search, keyboard, and the camera came with that.

> can we also make arrows inteructive ?

Arrows got the same tooltip, panel, highlight, and drill-down as nodes. [ADR-004](decisions/004-arrows.md).

> when I hover over element it dim other elemtns not connected, it is a little bit distructive, can we make it lighter?

The dim went from a heavy fade to opacity 0.72. [ADR-005](decisions/005-light-dim.md).

> can we make text select less destructive, if i double click for zoom it it selects text too

The diagram ignores selection. The panel does not. [ADR-006](decisions/006-selection.md).

> looks good use this diagram tool to explain how you implemented it, with code and architecture, etc

The first How tab was a map of files. [ADR-007](decisions/007-file-map.md).

> you are pretty bad at explaning, find popular skills for it

> lets try to use teach

> I mean use teach skill with our diagram tool to explain how our diagram tool works, I need very detailed explanation with code

The file map was not the explanation. The How tab became a series of pictures with the code in the panel. [ADR-008](decisions/008-teach-in-the-tool.md).

> we need to make an update to our diagram tool, right side bar must be able to change size by moving border with mouse

[ADR-009](decisions/009-panel-resize.md).

> can we get rid of this temporary box that appears when we click on the element

The box was the HTML label's frame and scrollbar. [ADR-010](decisions/010-label-frame.md).

> Let create a documentation for this project. Main requirements. Main decision points. Main feedback that I provided.

That request is this file, `CONTEXT.md`, and `docs/decisions/`. Implementation detail stays in the source and the How tab.

## 2026-10-11

> any suggestions for our frontend desing, ui, ux?

Twelve suggestions. A chose the selection and camera fixes, the drill-down transition, panel links, and the compact chrome. [ADR-014](decisions/014-selection-keeps-camera.md), [ADR-015](decisions/015-drill-transition.md), [ADR-016](decisions/016-panel-links.md), [ADR-017](decisions/017-compact-chrome.md).

> each time we open side bar it also moves diagram to the left, can we fix it?

That was `fit()` on panel open, still running from a cached script. ADR-014 had already removed it.

> we should update this project docs i'm building this tool for explaining difficult concepts, pr changes, etc one mode is to generate it with agent and add link to static file to pr what should we write in docs?

The page is an explainer, not a Mermaid demo. [ADR-025](decisions/025-explainer-skill.md).

> help me to decide

Content gets its own file, and the CDN versions are pinned. [ADR-026](decisions/026-content-file.md), [ADR-028](decisions/028-pinned-cdn.md). Where the link points stays open, so the deliverable is one file that any host can serve.

> why do we need python build script?

The Export button needs a browser and a server. The alternatives were a headless browser, the agent writing the whole page itself, or publishing the folder.

> we probably will provide a skill for ai agent to generate our tool format

The skill carries a prebuilt template, so the agent only adds its content. The script's main job is checking that content. [ADR-027](decisions/027-one-file-from-a-template.md).
