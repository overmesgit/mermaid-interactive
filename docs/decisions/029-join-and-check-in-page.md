# ADR-029 No Python: join the files with a shell command, and let the page check them

- Status: accepted, partly superseded by [ADR-037](037-fill-a-template.md): one template with a marker line replaces the two halves and the `cat` join
- Date: 2026-10-11
- Supersedes: the template slot and `build.py` in [ADR-027](027-one-file-from-a-template.md), and the skill layout in [ADR-025](025-explainer-skill.md)

## Context

The agent's whole output should be a content file like `diagrams.js`. ADR-027 also required Python, to fill a template and to check the content, and Python may not be installed.

Neither job needs Python. Joining files is one shell command. The checks are better in the page, because only the page sees what Mermaid drew: a message whose text differs, or a shape the matcher misses.

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
