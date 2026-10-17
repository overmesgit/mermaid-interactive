# Interactive Mermaid

A page for explaining hard things: a concept, a subsystem, a pull request. An explanation is a series of Mermaid diagrams with a tooltip on every shape and arrow, a details panel with notes and code, drill-down into an inner diagram, and Prev and Next through the lesson. It exports to one HTML file.

There are two ways to make one.

- **By hand.** Write a content file, open it in the editor, and export.
- **With an agent.** Point the agent at [`skill/SKILL.md`](skill/SKILL.md). It tells the agent how to use the tool: the format, how to build the file, and how to check it. The agent writes one content file, like `diagrams.js`, packs the code it shows into it, and puts it into the template in `skill/assets/`, which gives one HTML file, for example to link from a PR. See [ADR-025](docs/decisions/025-explainer-skill.md) and [ADR-037](docs/decisions/037-fill-a-template.md). Where that link should point is still open. [TODO](TODO.md) lists it.

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

## The editor

The [editor](https://overmesgit.github.io/mermaid-interactive/) shows a content file: paste it, open it, or drop it on the page. Export HTML in the explanation's ⋯ menu saves it as one file. Nothing is uploaded. Code notes show when the file was packed, as the skill does.

## Run it

Serve the folder over HTTP, then open `http://127.0.0.1:8765/`:

```bash
python3 -m http.server 8765
```

The editor builds the page from `page.html`, `styles.css`, and `js/` each time it loads, so an engine change shows on reload. Open a file from `examples/` to try it: `bookshop.js` has one tab per kind of diagram, and `go-router.packed.js` is a full lesson with its code. That code is Go's own source, cut to the lines its notes show, in `examples/go-router/`. To start a new explanation, copy `examples/starter.js`.

`examples/pr-checks.js` explains a real commit, the way an agent would with the skill. Its code notes name files at that commit, so open `examples/pr-checks.packed.js` to see them. That is the same file after packing (step 2 of [SKILL.md](skill/SKILL.md#build-it), with `content=examples/pr-checks.js`). Copy `packed.js` over it after changing the example.

`examples/oauth-pkce.js` explains OAuth 2.0 login with PKCE in sequence charts, with each kind of value in its own color. Every value in it comes from running golang.org/x/oauth2 against local test servers, in `examples/oauth-pkce/run/`, and its code notes show the library's PKCE code, cut to the lines they show, in `examples/oauth-pkce/`. Open `examples/oauth-pkce.packed.js` to see the code.

After changing the engine, rebuild the skill's template: the editor's status line says when `skill/assets/explainer.html` is out of date. Press the download button by Preview and save the file there. See [ADR-054](docs/decisions/054-one-editor-page.md).

## Docs

- [Context](CONTEXT.md) before changing the product
- [Content format](skill/references/format.md) to write an explanation
- [Matcher](docs/matcher.md)
- [Decisions](docs/decisions/README.md)
- [Rules](docs/rules.md) learned from reading real explanations
