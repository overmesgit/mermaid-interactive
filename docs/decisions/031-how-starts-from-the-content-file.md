# ADR-031 The How lesson starts from the content file

- Status: accepted
- Date: 2026-10-11
- Supersedes: the seven lesson steps in [ADR-020](020-lesson-steps.md)

## Context

The How tab explained an older version of the tool. Its first picture was "Mermaid draws", so it only taught how the page renders. Since [ADR-025](025-explainer-skill.md) the tool is an explainer: someone writes one content file, the page turns it into clickable diagrams, and it leaves as one HTML file. A reader of the How tab learned the internals without learning what the tool is for.

The notes were also hard to read. Almost every sentence named a function, so a reader had to know the code to follow the explanation. Parts of the page that a writer relies on, such as Prev and Next, markdown notes, and Export, were not in the lesson at all.

## Decision

The lesson has eight steps. It follows an explanation from the person who writes it to the file that is shared: who writes it, the content file, Mermaid's picture, the matcher, hover, the panel, inner diagrams and the camera, the lesson, and export. Each step redraws the one before and adds one piece, as before.

The code walks stay as inner diagrams: how one view is drawn, how a shape is found, and how an arrow is found. A new one shows how a note becomes the panel.

Every note starts with the problem in plain words, then says why, then gives at most one example. Function and file names go in the facts and the code, not in the first sentence.

The lesson shows only what is built. Joining the files with a shell command, the checks on load, and the `code/` folder join the lesson when they exist.

## Consequences

The step ids `how-notes`, `how-twozoom`, and `how-camera` are gone, so an old link to one of them opens the first tab. The ids that kept their meaning stay, so most old links still work. When a planned agent-mode part is built, it gets a step or a code walk in the same change.
