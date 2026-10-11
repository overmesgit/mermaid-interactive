# ADR-028 Pin exact versions of Mermaid and marked

- Status: accepted, not built yet
- Date: 2026-10-11

## Context

`mermaid@11` means "the newest Mermaid 11", so the same explanation can draw differently next month. A PR explanation is often opened weeks later, and a Mermaid update can rename the SVG pieces the matcher looks for. Then shapes stop being clickable.

Inlining both libraries would remove the network, but Mermaid alone is about 3.5 MB, so every explanation would be that large.

## Decision

The page, the export, and the template load exact versions: `mermaid@11.17.2` and `marked@15.0.12`. They stay CDN links.

## Consequences

An explanation renders the way it did when it was made, as long as jsDelivr serves that version.

Moving to a newer Mermaid is a change on its own. The matcher is checked against the sample tabs in the same change.

The file still needs the network.
