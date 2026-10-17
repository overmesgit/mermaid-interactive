# ADR-055 Fewer features, and one form for content, so the engine stays small

- Status: accepted
- Date: 2026-10-17
- Supersedes: Back through every move (ADR-044), the In/Out links (ADR-016), `source=` fences (ADR-024), `weight` and the legend in [ADR-043](043-status-and-weight.md), the target icon in [ADR-052](052-one-color-per-type.md), Back reopening a note in [ADR-053](053-inline-and-peek-notes.md), the ↘ badge as a button in [ADR-003](003-two-zooms.md), Find in [ADR-036](036-floating-controls.md) and [ADR-042](042-lit-arrows-flow.md)

## Context

The engine had grown features that did the same job as another, or that only one example used. Several files also handled two forms of the same content. Each of these had to be kept working, written up, and checked, so every change touched more places than it needed to. For example, an arrow could be written as `[from, to]` or as an object, so four files checked which form they had before reading it.

## Decision

**One form for content.** When the page loads, it gives each view its key as its id and turns every arrow into an object. So `viewId` need not be written, and the rest of the page reads one form. A part has one key everywhere, the one a link uses: `api` for a shape and `web->api` for an arrow.

**Removed, because something else already does the job:**

- **Back and Forward through every move.** The link still names the diagram on screen, so it can be shared, but each move replaces the entry instead of adding one. Back leaves the page.
- **Find.** Lesson diagrams are small enough to read.
- **`weight`.** It overlapped with `status` and `type`, and only one example used it. The story says what is central.
- **The legend.** The status word already shows on the part's card and in its note, and the story says what a type's color means.
- **The In/Out links in a note.** The picture shows the connections.
- **The target icon in the note's header.** Opening a note already brings its part into view, and a part's card or link lights it on hover.
- **The ↘ badge as a button.** It only marks a part that has an inner diagram. A double-click, or the note's button, opens it. A double-click on a part with no inner diagram no longer opens the note a second time.
- **Icon shapes.** The page loads no icon pack, so they drew as `?`.
- **`source=` fences.** Only the How tab used them ([ADR-054](054-one-editor-page.md)).
- **The editor's remembered width and open state.**

**Rewritten to do the same with less:**

- marked renders notes. A renderer leaves an empty placeholder for each part card, part link, and code file, and the page fills those in. HTML in a note shows as text.
- The content check is a few small checks. The checks on a chart's text are kept per view, and a drawn view's draw check replaces them, instead of a flag on each problem.
- Each type and status sets one ink and one fill in CSS, and chips, text, shapes, and arrows all read those two.
- Export copies the markup as it was before anything was drawn, so an export holds no picture or open note from the visit.
- Scrollbars are thin with the standard property alone.

## Consequences

The engine is about 280 lines of JavaScript and 130 of CSS smaller, and a content file is shorter by its `viewId` lines.

A reader who wants to go back uses Prev, the breadcrumb, Escape, or Backspace, not the browser's Back.

An explanation that used `weight` draws those parts like any other. It shows no error, because the page no longer reads the field.

On Windows, Chrome's thin standard scrollbar keeps its arrows.
