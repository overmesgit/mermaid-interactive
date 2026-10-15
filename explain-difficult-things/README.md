# Explain difficult things

How to explain a hard concept, subsystem, or pull request. These notes will become the "how to explain" part of [`skill/SKILL.md`](../skill/SKILL.md). For now the skill only teaches how to use the tool ([ADR-040](../docs/decisions/040-skill-teaches-the-tool-first.md)). [skill-draft.md](skill-draft.md) is a short version, written for the skill and set aside until then.

Read the ideas in order. Each is one screen: the rule, why, how, an example, and when it backfires. The sources behind them are in [research/](research/).

## Ideas, most important first

1. [Know the reader](ideas/01-know-the-reader.md). Start from what this reader already knows and believes, not from the subject.
2. [Show a small whole first](ideas/02-small-whole-first.md). Show the smallest version of the whole that still works, then zoom in and back out.
3. [Find the hard part](ideas/03-find-the-hard-part.md). Spend most of the words on the one idea that unlocks the rest.
4. [Show the machine](ideas/04-show-the-machine.md). For code, show what runs, in what order, and what changes.
5. [Give two concrete examples](ideas/05-concrete-examples.md). One concrete case, a second that looks different, and say which part is the idea.
6. [Draw a picture that does work](ideas/06-picture-that-does-work.md). Add a diagram only when it does something words cannot, and shape it like the idea.
7. [Step, don't animate](ideas/07-step-dont-animate.md). Walk a process frame by frame, one change per frame.
8. [Name the wrong idea](ideas/08-name-the-wrong-idea.md). Say the common wrong idea, show where it fails, then give the right one.
9. [Make them do something](ideas/09-make-them-do-something.md). Ask for a prediction or an explanation, not "does that make sense?"
10. [Contrast near-misses](ideas/10-contrast-cases.md). Put an example next to a near-miss that differs in one thing.
11. [Use analogies carefully](ideas/11-analogies.md). Map relations, not looks, and say where the analogy breaks.
12. [Start from a question](ideas/12-start-from-a-question.md). Open with the question, failure, or surprise the idea answers.
13. [Adjust the help](ideas/13-adjust-the-help.md). Less help when the reader succeeds, more when they stall.
14. [Show data plainly](ideas/14-show-data-plainly.md). Position on a shared axis first; a table when exact values matter.

The order is by how much each idea changes an explanation written for a developer, and how often it applies. Ideas 1–4 decide what to explain. 5–8 decide how to show it. 9–14 are tools for particular cases.

## Where the ideas pull against each other

- **Answer first, or problem first.** Idea 2 gives the small whole first. Ideas 8, 10, and 12 show the problem or the failure first. Use the problem first when the reader holds a competing idea or has no reason to care yet. Use the small whole first when they are simply missing pieces.
- **Simplify, but say so.** A small whole (2) is a simplification. A simplification that leaves a "why" unanswered invites the reader to invent one (8). Say what you left out.
- **Help novices, not experts.** Worked steps, extra pictures, and concrete-first order help beginners and slow down experts (13). Everything depends on idea 1.
- **Step, don't animate, but don't over-step.** Frames beat animation (7). A simple path still fits in one diagram.
- **Parts, then the whole running.** Parts can be introduced one at a time (3), but understanding is in how they run together (4), and that has to be shown too.
