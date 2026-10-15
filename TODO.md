# Todo

1. Make great examples
2. Create a site
3. Run from a file with no server. Export HTML may still need one.

## Agent mode

The decisions are [ADR-025](docs/decisions/025-explainer-skill.md) to [ADR-030](docs/decisions/030-code-folder.md), [ADR-035](docs/decisions/035-code-from-the-repo.md), [ADR-037](docs/decisions/037-fill-a-template.md), and [ADR-038](docs/decisions/038-code-files-in-preview-and-export.md).

1. Export `skill/assets/explainer.html` again after each engine change (ADR-037). Nothing warns when it is stale.
2. Write `skill/SKILL.md`: the workflow, and the explanation guidance from `explain-difficult-things/`.
3. Decide where a PR link points. The options so far: a claude.ai artifact, a static host with access control, GitHub Pages for public repos. Pages is public even when the repo is private.
