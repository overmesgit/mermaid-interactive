# ADR-029 The agent writes diagrams.js. The file is joined, and the page checks it

- Status: accepted, not built yet
- Date: 2026-10-11
- Supersedes: the template slot and `build.py` in [ADR-027](027-one-file-from-a-template.md), and the skill layout in [ADR-025](025-explainer-skill.md)

## Context

ADR-027 gave the skill a Python script to fill a template and check the content. A wants the agent's whole output to be a content file like `diagrams.js`, with no runtime to install.

The script had two jobs. Joining files needs no language. The checks run on data the page already has. A static check also cannot see what only Mermaid's SVG shows: a message that renders different text, or a shape the matcher misses.

## Decision

The skill ships the engine as two halves:

```
skill/
  SKILL.md
  references/format.md
  assets/head.html   the markup, the CSS, the CDN links, and arrow() and md, ending in <script>
  assets/tail.html   </script>, then the engine scripts inlined
```

The engine comes after the content. `js/state.js` reads `DIAGRAMS` as soon as it runs. `</body>` and `</html>` are optional in HTML, so the file can end after the engine, and ADR-030 appends code files there.

The agent writes `diagrams.js` and joins the three files:

```bash
cat skill/assets/head.html diagrams.js skill/assets/tail.html > explanation.html
```

A content file must not contain `</script`.

The page checks the content itself. On load it runs the checks in `skill/references/format.md` against `DIAGRAMS`. After each draw it lists every interaction that did not find a Mermaid shape or arrow. A problem shows as a warning on the page and in the console.

There is no Python, Node, or other script in the skill.

## Consequences

Everyone who opens the file sees a mistake, instead of a shape that does nothing on click. An agent that cannot open a browser does not see it. It follows the checklist in `format.md`. An agent that can open a browser reads the warning.

`head.html` and `tail.html` are rebuilt when the engine changes. How they are made is decided with the code. The engine scripts are inlined as written, not minified. A `source=` fence ([ADR-024](024-notes-name-functions.md)) prints a function with `toString()`, so minified engine code would show minified code in the How tab.

The one-file deliverable, the Export button, and publishing as a separate step still hold from ADR-027.
