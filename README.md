# Interactive Mermaid

A page for explaining hard things: a concept, a subsystem, a pull request. An explanation is a series of Mermaid diagrams with a tooltip on every shape and arrow, a details panel with notes and code, drill-down into an inner diagram, and Prev and Next through the lesson. It exports to one HTML file.

There are two ways to make one.

- **By hand.** Edit the content, run the page, and export.
- **With an agent.** The skill in `skill/` tells an agent the format and the workflow. The agent writes one content file, like `diagrams.js`, and joins it into one HTML file, for example to link from a PR. See [ADR-025](docs/decisions/025-explainer-skill.md) and [ADR-029](docs/decisions/029-join-and-check-in-page.md). The skill is not finished yet. [TODO](TODO.md) lists what is missing.

## Run it

Serve the folder over HTTP, then open `http://127.0.0.1:8765/`:

```bash
python3 -m http.server 8765
```

To open another content file, name it in the link: `http://127.0.0.1:8765/?src=examples/starter.js`. To start a new explanation, copy `examples/starter.js` and open the copy the same way.

The sample tabs are a bookshop. The How tab explains the tool itself, step by step. Export needs that server. The downloaded file still loads Mermaid from the network.

After changing the engine, rebuild the skill's template: open `http://127.0.0.1:8765/?template`, press Export HTML, and save the file as `skill/assets/explainer.html`. See [ADR-037](docs/decisions/037-fill-a-template.md).

## Docs

- [Context](CONTEXT.md) before changing the product
- [Content format](skill/references/format.md) to write an explanation
- [Matcher](docs/matcher.md)
- [Decisions](docs/decisions/README.md)
- [Feedback](docs/feedback.md)
