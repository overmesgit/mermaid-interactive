# ADR-034 Pick the content file with ?src= in the link

- Status: accepted
- Date: 2026-10-14
- Supersedes: the open question at the end of [ADR-026](026-content-file.md), and the form of the script list in [ADR-023](023-export-script-list.md)

## Context

The page could only show `diagrams.js`, because `index.html` loaded that file by name. So a new explanation had to be written into `diagrams.js`, over the bookshop sample and the How lesson, or the page had to be edited to point at another file. ADR-026 split the helpers out of the content file but left open how the page picks one.

## Decision

The link names the content file: `index.html?src=examples/starter.js`. Without `?src=` the page loads `diagrams.js`, so existing links still work.

`arrow()` and `md` live in `js/helpers.js`, which loads before any content file.

The content file loads first, and the engine starts only after it has set `window.DIAGRAMS`, because `js/state.js` reads it at once. A static `<script src>` cannot wait like that, so a short inline script in `index.html` adds the content file and then the engine scripts, in order. Its list of engine scripts is still the only script list. Export still inlines every local script in page order, so the exported file holds whichever content file was picked.

`?src=` takes only a path on the same site. Otherwise a shared link with `?src=https://...` would run a stranger's script on the page.

## Consequences

A writer copies `examples/starter.js`, edits the copy, and reloads the page with its path in `?src=`. The sample and the How lesson stay untouched.

A content file that fails to load, or loads without setting `window.DIAGRAMS`, shows a message where the diagram would be, instead of a blank page.

Adding an engine script is now an edit to the list inside that inline script, not a new `<script>` tag.

Notes will show files from the repo the explanation is about ([ADR-035](035-code-from-the-repo.md)). Reading them while previewing is decided when that is built.
