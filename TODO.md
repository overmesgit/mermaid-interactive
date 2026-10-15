# Todo

1. Make great examples
2. Create a site
3. Run from a file with no server. Export HTML may still need one.

## Agent mode

The decisions are [ADR-025](docs/decisions/025-explainer-skill.md) to [ADR-030](docs/decisions/030-code-folder.md), [ADR-035](docs/decisions/035-code-from-the-repo.md), and [ADR-037](docs/decisions/037-fill-a-template.md).

1. Pin `mermaid@11.17.2` and `marked@15.0.12` in `index.html` and `js/export.js` (ADR-028).
2. Export `skill/assets/explainer.html` again after each engine change (ADR-037). Nothing warns when it is stale.
3. Have the page run the checks in `skill/references/format.md` on load, and show a warning on the page and in the console (ADR-029).
4. Have the page list every interaction it could not wire after each draw, in the same warning (ADR-029).
5. Read `file=` fences from the packed code files: decode on first use, the header with path and lines, the whole-file view with the range highlighted (ADR-030, ADR-035).
6. Check every `file=` path and `lines` range in the same warning, and warn on an empty packed file (ADR-030, ADR-035).
7. Write `skill/SKILL.md`: the workflow, and the explanation guidance from `explain-difficult-things/`.
8. Decide where a PR link points. The options so far: a claude.ai artifact, a static host with access control, GitHub Pages for public repos. Pages is public even when the repo is private.
