# ADR-037 Fill one template by replacing a marker line

- Status: accepted
- Date: 2026-10-15
- Supersedes: the two halves and the `cat` join in [ADR-029](029-join-and-check-in-page.md). The checks in the page still hold.

## Context

An agent usually has no browser, so it cannot press Export. The skill has to carry the page ready-made, and the agent has to put its content inside it. ADR-029 shipped the page as two halves, with the content joined between them by `cat`. Two files that only work as a pair are easy to mix up, and the join looked fragile.

Two other options were weighed. Loading the engine from a CDN would leave the agent nothing to join, but it needs a release step and a public repo. A small CLI would give a tidy command, but it needs Node, and avoiding a runtime is why Python was dropped. Both stay open for later. This one is enough for now.

## Decision

The skill ships one file, `skill/assets/explainer.html`. It is the whole page with a marker line, `/* DIAGRAMS */`, alone inside a script tag where the content goes. The agent replaces that line with its content file, with an edit tool or with one command:

```bash
sed -e '/^\/\* DIAGRAMS \*\/$/r diagrams.js' -e '/^\/\* DIAGRAMS \*\/$/d' explainer.html > explanation.html
```

The page's own Export makes the template. Open the page with `?template` in the link and press Export HTML. It saves the markup from `index.html`, the CSS and the engine inlined, and the marker in place of the content file. It is the same code as a normal export, so the template and an exported file cannot drift apart.

A template opened with no content says so on the page, instead of showing a blank window.

## Consequences

The template has to be exported again whenever the engine changes. Nothing warns when it is stale.

The content file still must not contain `</script`, because it becomes the body of a script tag.

Code files named with `file=` are appended after the template's end, as [ADR-035](035-code-from-the-repo.md) describes.

The template is about 75 KB. An agent that uses the `sed` command never reads it.
