# Todo

1. Make great examples
2. Create a site
3. Run from a file with no server. Export HTML may still need one.
4. Clean up before the next stage, diagram research.

## Agent mode

The decisions are [ADR-025](docs/decisions/025-explainer-skill.md) to [ADR-030](docs/decisions/030-code-folder.md), [ADR-035](docs/decisions/035-code-from-the-repo.md), [ADR-037](docs/decisions/037-fill-a-template.md), [ADR-038](docs/decisions/038-code-files-in-preview-and-export.md), [ADR-039](docs/decisions/039-stale-template-warning.md), and [ADR-040](docs/decisions/040-skill-teaches-the-tool-first.md).

1. Later: decide where a PR link points. For now whoever uses the file hosts it. The options so far: a claude.ai artifact, a static host with access control, GitHub Pages for public repos. Pages is public even when the repo is private.
2. Later: teach how to explain well in the skill. A short version is in `explain-difficult-things/skill-draft.md` (ADR-040).

## Mermaid features to consider

Each new kind of diagram or shape needs the page to learn how Mermaid draws it, the way image and icon nodes did. Until then it draws, but nothing on it is clickable.

1. Architecture diagrams (`architecture-beta`). Groups such as a VPC or a cluster, with service icons, so "what runs where" reads better than a flowchart.
2. Icon packs. Register one, such as `logos`, so icon nodes and architecture diagrams show real logos instead of a `?`. It is another pinned script to load.
3. Entity-relationship diagrams, for a data model. Each table and link could carry a note.
4. Flowchart shapes that mean something, such as `@{ shape: cyl }` for a database or `doc` for a document. Check that the page finds each one, because some may be drawn without the `node` class, like image nodes were.
5. ELK layout, for big diagrams with fewer crossing arrows. It is an extra script.
6. `classDef` colors, so a PR explanation can color what the change touched.
7. Sequence `box` around participants, and `rect` to shade a block of steps, such as a retry.
8. The hand-drawn look (`look: handDrawn`), so a proposal reads as a draft.
9. Arrow ids. The page finds a flowchart arrow by its two ends and a counter, which is fragile when two arrows join the same shapes. Reading Mermaid's own arrow id (`e1@-->`) would be exact. Today the checks reject arrow ids, because Mermaid then drops the ends from the arrow's name.
