# ADR-054 One page, the editor, which builds the template from the engine

- Status: accepted
- Date: 2026-10-17
- Supersedes: the `?src=` link (ADR-034), the script list in `index.html` (ADR-023), reading code files from the server (ADR-038), the stale-template fingerprint (ADR-039), the Export modes that read files and save the template in [ADR-049](049-export-without-a-server.md), and the preview page's place in [ADR-048](048-pack-files-into-the-content-file.md)

## Context

The repo had two pages. `index.html` ran the engine on a content file named in the link, and `preview.html` was the editor, which filled in the skill's saved template. So an engine change showed in the editor only after someone rebuilt the template by hand, and the page carried code that only that rebuild used: Export read files from a server, saved the template with `?template`, and stamped it with a hash that every page checked.

The default content had a How tab that explained the page itself. It had to change with every engine change, and it had already fallen behind, so the README, CONTEXT, the ADR index, and the How tab each described something different.

## Decision

There is one page, the editor, at `index.html`. It starts empty. A content file is opened, dropped, or pasted, and the editor shows it in a sandboxed frame.

The engine's markup is `page.html`. It lists the scripts in load order as `<script src>` tags, with one `/* DIAGRAMS */` line where the content goes. Nobody opens it. When the editor loads, it reads `page.html`, `styles.css`, and every `js/` file, puts them inline, and so builds the skill's template. A content file is shown by putting it in place of the marker line, as the skill's `sed` command does. An engine change therefore shows up on reload.

The editor compares what it built with `skill/assets/explainer.html`. When they differ, its status line says the template is out of date, and its download button saves the new one to put there. Nothing in the finished page checks the template.

Export inside a page only copies that page: its style and its inline scripts. It reads no files.

A code note shows only files packed into the content file. The page never reads one from a server.

The bookshop tabs move to `examples/bookshop.js`, without the How tab. `examples/side-panel.js` is gone.

## Consequences

The editor needs a server, or GitHub Pages, because a page opened from disk cannot read the files next to it. A finished page still opens from disk.

In the editor, a content file that names code files shows each one as not packed until it is packed. This is the same message the reader of an unpacked file would get.

`js/export.js` dropped from 136 lines to 38, and `?src=`, `?template`, and the fingerprint are gone.
