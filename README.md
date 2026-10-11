# Interactive Mermaid

A page for explaining hard things: a concept, a subsystem, a pull request. An explanation is a series of Mermaid diagrams with a tooltip on every shape and arrow, a details panel with notes and code, drill-down into an inner diagram, and Prev and Next through the lesson. It exports to one HTML file.

There are two ways to make one.

- **By hand.** Edit the content, run the page, and export.
- **With an agent.** The skill in `skill/` tells an agent the format and the workflow. The agent writes one content file, like `diagrams.js`, and joins it into one HTML file, for example to link from a PR. See [ADR-025](docs/decisions/025-explainer-skill.md) and [ADR-029](docs/decisions/029-join-and-check-in-page.md). The skill is not finished yet. [TODO](TODO.md) lists what is missing.

## Run it

Serve the folder over HTTP and open `index.html`. The sample tabs are a bookshop. The How tab walks the implementation. Export needs that server. The downloaded file still loads Mermaid from the network.

## Docs

- [Context](CONTEXT.md) before changing the product
- [Content format](skill/references/format.md) to write an explanation
- [Matcher](docs/matcher.md)
- [Decisions](docs/decisions/README.md)
- [Feedback](docs/feedback.md)
