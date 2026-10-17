# Todo

1. Make great examples
2. Create a site

## Next: diagram research

Find out which kinds of diagram explain best, so the page learns the ones worth the work first. The list under "Mermaid features to consider" is where to start.

## Agent mode

The decisions are under Agent mode in the [decision index](docs/decisions/README.md).

1. Later: decide where a PR link points. For now whoever uses the file hosts it. The options so far: a claude.ai artifact, a static host with access control, GitHub Pages for public repos. Pages is public even when the repo is private.
2. Later: teach how to explain well in the skill. A short version is in `explain-difficult-things/skill-draft.md` (ADR-040).

## Mermaid features to consider

Each new kind of diagram or shape needs the page to learn how Mermaid draws it, the way image nodes did. Until then it draws, but nothing on it is clickable.

1. Architecture diagrams (`architecture-beta`). Groups such as a VPC or a cluster, with service icons, so "what runs where" reads better than a flowchart.
2. Icon packs. Register one, such as `logos`, so icon nodes and architecture diagrams show real logos instead of a `?`. It is another pinned script to load, and the page must learn to find icon nodes again ([ADR-055](docs/decisions/055-fewer-features.md) dropped that).
3. Entity-relationship diagrams, for a data model. Each table and link could carry a note.
4. Flowchart shapes that mean something, such as `@{ shape: cyl }` for a database or `doc` for a document. Check that the page finds each one, because some may be drawn without the `node` class, like image nodes were.
5. ELK layout, for big diagrams with fewer crossing arrows. It is an extra script.
6. Sequence `box` around participants, and `rect` to shade a block of steps, such as a retry.
7. The hand-drawn look (`look: handDrawn`), so a proposal reads as a draft.
8. Arrow ids. The page finds a flowchart arrow by its two ends and a counter, which is fragile when two arrows join the same shapes. Reading Mermaid's own arrow id (`e1@-->`) would be exact. Today the checks reject arrow ids, because Mermaid then drops the ends from the arrow's name.
