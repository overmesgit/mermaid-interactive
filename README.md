# Interactive Mermaid

A page for explaining hard things: a concept, a subsystem, a pull request. An explanation is a series of Mermaid diagrams with a tooltip on every shape and arrow, a details panel with notes and code, drill-down into an inner diagram, and Prev and Next through the lesson. It exports to one HTML file.

There are two ways to make one.

- **By hand.** Edit the content, run the page, and export.
- **With an agent.** Point the agent at [`skill/SKILL.md`](skill/SKILL.md). It tells the agent how to use the tool: the format, how to build the file, and how to check it. The agent writes one content file, like `diagrams.js`, and puts it into the template in `skill/assets/`, which gives one HTML file, for example to link from a PR. See [ADR-025](docs/decisions/025-explainer-skill.md) and [ADR-037](docs/decisions/037-fill-a-template.md). Where that link should point is still open. [TODO](TODO.md) lists it.

## Install the skill

The repo is a Claude Code plugin marketplace, so Claude Code can install the skill straight from GitHub. Run both commands in a shell:

```bash
claude plugin marketplace add overmesgit/mermaid-interactive
claude plugin install mermaid-interactive@mermaid-interactive
```

The skill then runs as `/mermaid-interactive:interactive-explainer`, because a plugin's skills carry the plugin's name in front. Claude also picks it up without the command when asked for an explanation. To get a newer version after a push, refresh the marketplace, then update the plugin:

```bash
claude plugin marketplace update mermaid-interactive
claude plugin update mermaid-interactive@mermaid-interactive
```

The plugin is listed in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json), and it loads only the `skill/` folder.

## Run it

Serve the folder over HTTP, then open `http://127.0.0.1:8765/`:

```bash
python3 -m http.server 8765
```

To open another content file, name it in the link: `http://127.0.0.1:8765/?src=examples/starter.js`. To start a new explanation, copy `examples/starter.js` and open the copy the same way.

`examples/pr-checks.js` explains a real commit, the way an agent would with the skill. Its code notes name files at that commit, which only git has, so join it instead of opening it with `?src=`. Run step 2 of the [format](skill/references/format.md) from the repo root with `content=examples/pr-checks.js`, then open `explanation.html`.

The sample tabs are a bookshop. The How tab explains the tool itself, step by step. Export needs that server. The downloaded file still loads Mermaid from the network.

After changing the engine, rebuild the skill's template: open `http://127.0.0.1:8765/?template`, press Export HTML, and save the file as `skill/assets/explainer.html`. Until you do, the page's ⚠ list says the template is out of date. See [ADR-037](docs/decisions/037-fill-a-template.md) and [ADR-039](docs/decisions/039-stale-template-warning.md).

## Docs

- [Context](CONTEXT.md) before changing the product
- [Content format](skill/references/format.md) to write an explanation
- [Matcher](docs/matcher.md)
- [Decisions](docs/decisions/README.md)
- [Feedback](docs/feedback.md)
