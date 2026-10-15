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

> i want to discuss decision 27 i thought ai agent will give something like diagram.js can we avoide python?

The agent writes `diagrams.js`. It is joined between two halves of the page, and the page checks it. No Python. [ADR-029](decisions/029-join-and-check-in-page.md).

> ADR-024 How notes name a function instead of copying it explain

`source=` only reaches the engine's own functions. It also means the engine must not be minified. [ADR-029](decisions/029-join-and-check-in-page.md).

> I was thinking about this how about allowing to link folder with code? and than we could reference it from the side panel it doesn't have to be original code with the same structure, maybe just files that we are interested in

> can we inline files as gzip in our html page wdyt?

A `code/` folder, named from a fence by path and lines, packed into the page as gzip and base64. [ADR-030](decisions/030-code-folder.md).

> check existing docs for similar problems oportunities for improvements

> 1 - 4 we can rewrite this time

Every ADR Context now starts with the problem, then why it matters. The decisions index maps the names used before ADR-019 to today's. CONTEXT.md gained a writing rule and the missing terms. Rewriting accepted ADRs was allowed this once, for wording only. No decision changed.

> clearer ADR titles, a simpler status column in the decisions index, and a "start here" section in format.md. lets make those

ADR titles now say the choice in plain words. The decisions index groups ADRs by topic, with four status words: Current, partly replaced, Planned, Replaced. `format.md` starts with five steps, including the join command.

> let's update current explanation of this tool in HOW diagram

The How lesson now starts from the content file and ends with the exported file, and its notes are rewritten in plain words. It shows only what is built. [ADR-031](decisions/031-how-starts-from-the-content-file.md).

## 2026-10-12

> why do we need server? can I open file?

The page opens from a file. Only Export needs a server, because it reads the scripts with fetch, and a browser blocks that on file://.

> it kinda feel strange that we need to open each node to follow explanation can we add text below block with short explanations?

Each shape now has a short caption under its name, written in the Mermaid label. [ADR-032](decisions/032-shape-captions.md).

> hmm... adding some text block to diagram can be good how about adding default side panel with the explanation flow?

With nothing selected, the side panel shows the view's story and its parts, with what a lesson step adds marked New. The captions stay. [ADR-033](decisions/033-story-panel.md).

## 2026-10-14

> instead of code folder can we provide list of files?

> we only save those areas? I think we should allow to save the whole file to expand in side panel if we need

No folder and no list. The join collects the paths from the `file=` fences and reads them from the repo, or from git for an older version. Each whole file is packed. [ADR-035](decisions/035-code-from-the-repo.md).

> can we improve UI and design? I think we don't need logo. buttons are ugly. we can move export, copy to menu. For find, remove label, just add search icon. we want minimalistic, balanced look where elements are aligned

Five versions were built side by side. The floating one was picked: no header, the controls on small cards over the diagram, Copy and Export in a ⋯ menu, Find with a magnifier.

> I really like floating. the only thing is the story of diagram will be hard to find. and make prev / next to jump less between steps, different step name make buttons jump too far

The Story button has a label and sits before the diagram's name. The lesson card has a fixed width, so Prev and Next stay put. [ADR-036](decisions/036-floating-controls.md).

## 2026-10-15

> why would we need [the two template halves and the join command]

An agent has no browser, so it cannot press Export. The skill has to carry the page ready-made.

> hmmm.. I don't like cat files like this, any alternatives?

> how about replacing some tag inside html to inject diagrams? maaa maybe not the final solution but should be good for now

One template with a marker line replaces the two halves. The page's Export makes it when the link has `?template`. Loading the engine from a CDN stays open for later. [ADR-037](decisions/037-fill-a-template.md).

> i opened file://wsl.localhost/Ubuntu/home/overmes/mermaid-interactive/index.html?src=examples/pr-checks.js#problem [and the ⚠ list showed seven lines, one per note, all saying a 4c92d28: file is not in this page]

A preview cannot read files from git history, or any file when opened from disk. That is a limit of previewing, not a mistake, so the checks no longer list it, and the panel says why in place of the code. A missing file is one problem however many notes name it, and the list's heading no longer says every line is a dead shape. [ADR-038](decisions/038-code-files-in-preview-and-export.md).

> [Where a PR link points] yeah, we don't need it yet. i suppose consumer will need to find way to host it. it is not a final decision, for now it is ok

Hosting stays open in the TODO. For now whoever uses the file hosts it. No ADR, because nothing is decided.

> helping understanding PRs is only one for the use cases

> [Warn when the template is out of date] this we can fix

The template carries a fingerprint of the files it was made from, and the page served from this repo warns when they differ. [ADR-039](decisions/039-stale-template-warning.md).
