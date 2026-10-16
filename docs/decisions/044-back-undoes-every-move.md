# ADR-044 Back undoes every move

- Status: accepted
- Date: 2026-10-16

## Context

The page kept the current view in the link, but it replaced the browser's history entry on every move. So the browser's Back button did nothing useful. After drilling into a shape or opening a part from the side panel, Back left the page instead of going back one move.

## Decision

Every move the reader makes adds a history entry: a lesson step, a tab, a breadcrumb, a drill-down, opening a part, and going back to the story. So Back undoes the last move, and Forward redoes it.

The link names the open part after an `@`: `#after@mux` for a shape, `#after@web->api` for an arrow. A link with a part opens that part's note, so a reader can share a link to one note.

On Back and Forward, the page redraws only when the view changed. Going back from a note to its story keeps the picture where it was. While it follows the history, the page does not add entries of its own. The first load replaces the entry, so Back from the first view leaves the page.

## Consequences

Escape and Backspace still go up one level, as before. They now also add a history entry, so Back after Escape returns to where the reader was.

A reader who clicks many shapes makes many entries, one per click. That matches what a reader expects from Back: undo one thing.
