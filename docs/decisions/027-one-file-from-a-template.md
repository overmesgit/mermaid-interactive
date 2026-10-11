# ADR-027 The agent hands over one HTML file, built from a template

- Status: accepted, template slot and `build.py` superseded by [ADR-029](029-join-and-check-in-page.md)
- Date: 2026-10-11

## Context

An agent cannot click a button, and export only runs as a button in the browser. To use it, the agent would need a headless browser and a local server.

Where the link will point is not decided yet. One file works on any host and can be attached to a PR or a message. A folder needs a host that keeps its files together.

A content mistake is silent. A chartId that matches nothing draws a shape that does nothing on click. The agent does not see the page, so it cannot notice.

## Decision

A release of the engine produces `skill/assets/template.html`. That is the page with the CSS and engine scripts inlined, Mermaid and marked as CDN links, and one empty slot for the content script.

`skill/scripts/build.py` puts a content file into that slot and writes one HTML file. Before writing, it runs the checks listed in `skill/references/format.md`, and it fails when one of them fails. It uses only the Python standard library. Python is on most agent machines and CI runners. The engine is never assembled per PR.

The Export button stays for a person working in the page.

Publishing is a separate step after the build. The skill ends with the file. No host is chosen yet.

## Consequences

The template has to be rebuilt when the engine changes. How it is made, from the Export button or from a script, is decided with the code.

`build.py` checks the content without drawing it. A miss that only Mermaid's output shows, such as a sequence message that renders different text, still needs the page itself to warn.

A host can be added later without changing the content, the template, or the build.
