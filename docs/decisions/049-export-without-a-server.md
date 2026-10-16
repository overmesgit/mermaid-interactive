# ADR-049 Export works without a server, so the preview page has one export button

- Status: accepted
- Date: 2026-10-17
- Supersedes: the Download HTML button and the page layout in [ADR-048](048-pack-files-into-the-content-file.md)

## Context

The preview page showed two export buttons: its own Download HTML, and Export HTML in the explanation's ⋯ menu. The menu's button did not work there. Export rebuilt the page by downloading the engine's files from the server, and a page in the preview's frame, or opened from disk, has no server to download them from.

The editor also took a third of the window, even when the reader only wanted to read.

## Decision

A page made from the template already holds every script inline. So when a page has no script files to read, Export copies its own inline scripts and style instead of downloading them. The content script in such a page is already packed, so nothing is added to it. The script that opens the start view is marked, so a new one replaces it on each export.

The preview page drops its Download HTML button. The explanation fills the window. The editor is a drawer on the left that collapses to a thin rail with one button, and its width can be dragged. Whether it is open, and its width, are kept for the next visit.

The drawer offers two examples: the starter, and `examples/pr-checks.packed.js`, the pr-checks example packed so its code notes work.

The ⋯ menu of `index.html` links to the preview page. A joined page hides the link, because it has no preview page beside it.

## Consequences

Export works from disk and inside the preview's frame. A file exported from a joined page can be exported again.

`examples/pr-checks.packed.js` must be packed again after `examples/pr-checks.js` changes. Nothing warns when it is stale.

Inside the preview's frame, the browser ignores a plain `#` link, because the frame's address belongs to the preview page and the sandbox does not own it. The page does not rely on that: links to parts are buttons, and moves are recorded with the History API, which works there.
