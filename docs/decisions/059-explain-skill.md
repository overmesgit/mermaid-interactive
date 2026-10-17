# ADR-059 A second skill, explain-clearly, holds the rules for explaining

- Status: accepted
- Date: 2026-10-18
- Does: the how-to-explain part that [ADR-040](040-skill-teaches-the-tool-first.md) postponed

## Context

The rules for explaining clearly lived in `docs/rules.md`, but no skill pointed to them. An agent installs only the skill folders, so the agent that writes a lesson never saw a single rule. ADR-040 had moved the explanation advice out of the tool's skill until it was settled. Two reviewed examples, the Go router and OAuth PKCE, have now turned that advice into rules, each with when to apply it.

Some of the rules were about the page, not the writing: how a note opens, how it shows what it belongs to, and how a reader knows what to click. A writer cannot act on those.

## Decision

The plugin has two skills. `skill/`, interactive-explainer, teaches the tool, as before. `explain/`, explain-clearly, teaches how to explain: a short `SKILL.md` that says which rules to use while planning, writing, and reviewing, and the rules in `explain/references/rules.md`, moved from `docs/rules.md`.

- The rules keep their **How** lines, which name the tool's fields, because the two skills are used together.
- Where each rule came from stays in `docs/rules-context.md`, because that history is for the people who keep the rules, not for the writer.
- The three rules about the page moved to `docs/page-design.md`.
- Advice in `explain-difficult-things/skill-draft.md` that is not a rule yet is listed under **To do** at the end of the rules. Each one becomes a rule only after it is tried on a real example and checked with a reader.

## Consequences

An agent that writes a lesson now has the rules, and can review the lesson against each rule's **Apply when**. The tool's skill stays a manual, and points to the second skill in one line.

The rules and their history are two files under the same headings, so a change to a rule's name or order changes both.
