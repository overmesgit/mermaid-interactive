# ADR-028 Mermaid and marked load at exact versions

- Status: accepted, not built yet
- Date: 2026-10-11

## Context

The page loads `mermaid@11` and `marked@15`. jsDelivr serves the newest release in that major. A PR explanation is opened weeks or months after it was made. A minor Mermaid release can change the SVG ids and classes the matcher reads.

Inlining both libraries would remove the network. Mermaid is about 3.5 MB minified, so every explanation would weigh that much.

## Decision

The page, the export, and the template load exact versions: `mermaid@11.17.2` and `marked@15.0.12`. They stay CDN links.

## Consequences

An explanation renders the way it did when it was made, as long as jsDelivr serves that version.

Moving to a newer Mermaid is a change on its own. The matcher is checked against the sample tabs in the same change.

The file still needs the network.
