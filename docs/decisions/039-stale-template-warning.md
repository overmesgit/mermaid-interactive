# ADR-039 Warn when the skill's template is older than the engine

- Status: accepted
- Date: 2026-10-15
- Supersedes: "Nothing warns when it is stale" in the consequences of [ADR-037](037-fill-a-template.md)

## Context

The skill's template is exported from the page by hand ([ADR-037](037-fill-a-template.md)). After an engine change, it is easy to forget, and nothing showed it. An agent would then build every explanation on the old page, so a fixed bug would come back in each new file.

## Decision

Exporting the template stamps it with a fingerprint of the files it is made from: `styles.css`, `index.html`, and every engine script. It sits in a `<meta name="engine-fingerprint">` tag.

The page served from this repo computes the same fingerprint from the current files, and reads the stamp in `skill/assets/explainer.html`. When they differ, the ⚠ list says so and says how to export the template again.

The fingerprint is FNV-1a, a short hash that needs no secure context. It only has to change when a file changes.

## Consequences

The warning shows on the page you use while working on the engine, so a forgotten export is seen at once.

A joined page, or a page opened from disk, has no template next to it, so readers of an explanation never see this warning.

Any edit to an input warns, even a comment. That is intended. The template is then exactly the current files.

The files are now read with `cache: "no-cache"`, so neither the fingerprint nor an export uses a copy the browser kept from before an edit.
