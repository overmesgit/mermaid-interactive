# Todo

1. Make great examples
2. Create a site
3. Run from a file with no server. Export HTML may still need one.

## Agent mode

The decisions are [ADR-025](docs/decisions/025-explainer-skill.md) to [ADR-028](docs/decisions/028-pinned-cdn.md).

1. Move `arrow()` and `md` into the engine. Make `diagrams.js` a content file like any other (ADR-026).
2. Pin `mermaid@11.17.2` and `marked@15.0.12` in `index.html` and `js/export.js` (ADR-028).
3. Produce `skill/assets/template.html` with one content slot (ADR-027).
4. Write `skill/scripts/build.py`: fill the slot, run the checks in `skill/references/format.md` (ADR-027).
5. Have the page warn about an interaction it could not wire, in the status line and the console.
6. Write `skill/SKILL.md`: the workflow, and the explanation guidance from `explain-difficult-things/`.
7. Decide where a PR link points. The options so far: a claude.ai artifact, a static host with access control, GitHub Pages for public repos. Pages is public even when the repo is private.
