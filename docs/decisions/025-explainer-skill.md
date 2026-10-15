# ADR-025 The tool explains hard things, and agents use it through a skill

- Status: accepted, skill layout superseded by [ADR-029](029-join-and-check-in-page.md) and [ADR-037](037-fill-a-template.md)
- Date: 2026-10-11

## Context

The page was built as a Mermaid demo with a bookshop sample. The author wants it for explaining hard things: a concept, a subsystem, a pull request. One use is an agent that writes the explanation for a PR and puts a link in that PR.

An agent could not do that yet, because three things were missing: a written description of the content format, a way to produce the file without a browser, and guidance on how to explain well.

## Decision

The product is the engine (this page) and a skill. The skill is a folder an agent loads, in the Agent Skills layout that Claude Code and Cursor both read. It lives in this repo under `skill/`, so a change to the engine and a change to the format land together.

```
skill/
  SKILL.md               when to use it, the workflow, how to explain
  references/format.md   the content format
  assets/template.html   the engine, prebuilt
  scripts/build.py       fills the template, checks the content
```

The agent writes one content file. Everything else comes with the skill.

The bookshop and the How tab stay. They are the sample and the lesson about the engine.

## Consequences

`skill/references/format.md` is the only description of the format. `CONTEXT.md` and the README link to it.

The how-to-explain part of `SKILL.md` comes from `explain-difficult-things/`. Those notes are still not rules. `SKILL.md` is written after the content split and the template exist, so it never points at a script that is missing.
