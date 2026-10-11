# Explain difficult things — source notes

Source material for a Cursor skill we have not written yet. There is no `SKILL.md` here. These notes are for us to read and argue with before any skill text exists.

Each file is a short account of one framework: what it claims, the pieces that match an explanation skill, and links. Quotes are tied to a page we opened or to a named passage in a secondary write-up of the primary text. Where a page did not load, the note says so.

## What we were looking for

1. Show the big picture first.
2. Build on what the person already knows.
3. Choose how to represent the idea, including data.
4. Provide examples.

Added in the second pass:

5. Find out what the person already believes that is wrong, and deal with it. The first four needs assume something is missing. Often something is there and it is wrong.
6. Have the person do something with the explanation, and check it. Reading is the weakest mode, and "does that make sense?" does not test anything.
7. Know where the difficulty is, including the explainer's own blind spot.

## Map

| Need | Note | Framework |
| --- | --- | --- |
| Big picture first | [elaboration-theory.md](sources/elaboration-theory.md) | Reigeluth, elaboration theory |
| Big picture first, and prior knowledge | [ausubel-meaningful-learning.md](sources/ausubel-meaningful-learning.md) | Ausubel, subsumption and advance organizers |
| Prior knowledge, and wrong prior knowledge | [taber-prior-knowledge.md](sources/taber-prior-knowledge.md) | Taber, typology of learning impediments |
| Prior knowledge | [gentner-structure-mapping.md](sources/gentner-structure-mapping.md) | Gentner, analogy as structure-mapping; Glynn, teaching with analogies |
| Representation | [mayer-multimedia.md](sources/mayer-multimedia.md) | Mayer, multimedia learning; Paivio; Sweller |
| Representation | [ainsworth-deft.md](sources/ainsworth-deft.md) | Ainsworth, DeFT |
| Representation | [bruner-cra.md](sources/bruner-cra.md) | Bruner; concrete–representational–abstract |
| Representation | [diagrams-and-animation.md](sources/diagrams-and-animation.md) | Larkin and Simon; Tversky, congruence and apprehension; Victor, ladder of abstraction |
| Examples | [examples.md](sources/examples.md) | Worked examples; variation and non-examples; contrasting cases |
| Wrong prior knowledge | [conceptual-change.md](sources/conceptual-change.md) | Posner et al., conditions for conceptual change; refutation text |
| Doing and checking | [icap-engagement.md](sources/icap-engagement.md) | Chi and Wylie, ICAP; illusion of explanatory depth |
| Doing and checking | [scaffolding.md](sources/scaffolding.md) | Wood, Bruner, and Ross; Vygotsky |
| Where it is hard | [threshold-concepts.md](sources/threshold-concepts.md) | Meyer and Land, threshold concepts; Perkins, troublesome knowledge |
| Where it is hard | [curse-of-knowledge.md](sources/curse-of-knowledge.md) | Hinds, curse of expertise; Nathan et al., expert blind spot (thin, not opened) |

## Where the notes disagree

These are the decisions a skill would have to make. The notes do not make them.

**Tell first, or show the problem first.** Reigeluth and Ausubel put the general idea first. Schwartz and Bransford put contrasting cases before the telling ([examples.md](sources/examples.md)). Posner et al. put dissatisfaction with the old idea before the new one ([conceptual-change.md](sources/conceptual-change.md)). One way to reconcile them is Taber's split. With a null impediment (nothing to build on, or pieces not connected), the organizer or epitome comes first. With a substantive impediment (a competing idea), the old idea has to be named and fail first, or the new one gets read through it.

**Simplify, or not.** The epitome and the simplifying-conditions method say to start with a simple whole. Taber's octet example says a simplification that leaves a "why" open invites the learner to fill it in, and the invented answer can last for years. These fit together if a simplification says what it leaves out: "this skips why X happens; for now, take it that it does."

**Support helps novices and hurts experts.** Worked examples, pre-training, concrete-first order, and extra pictures all carry an expertise-reversal caution ([examples.md](sources/examples.md), [mayer-multimedia.md](sources/mayer-multimedia.md), [bruner-cra.md](sources/bruner-cra.md)). Every one of them depends on knowing the person's level, which is need 2 again.

**Animate, or step.** Mayer's temporal contiguity favors words and pictures together in time. Tversky et al. found animation rarely beats equivalent static pictures, and that people think of processes as discrete steps ([diagrams-and-animation.md](sources/diagrams-and-animation.md)). That supports the How tab's Prev and Next over a continuous animation, as long as each step is easy to compare with the one before.

**Parts, or the whole.** Sweller's isolated-interacting elements teaches parts first. Land et al.'s "underlying game" in programming is a case where every part is understood and the interaction is not ([threshold-concepts.md](sources/threshold-concepts.md)). Parts-first is not enough on its own. The whole still has to be taught as a whole.

## Still missing

Ideas worth a note, not yet read for this folder:

- **Research on explanations themselves.** Wittwer and Renkl (2008), "Why instructional explanations often do not work," *Educational Psychologist*, 43(1), 49–64. The most direct fit for the whole folder. Only the ERIC abstract was reached. Its later meta-analysis is already cited in [examples.md](sources/examples.md) (d = .16).
- **Choosing a chart for data.** Need 3 says "including data," and no note covers chart choice. DeFT says whether a second form should exist, not which one. Cleveland and McGill (1984) on the ranking of graphical encodings (position, length, angle, area, colour) is the usual starting point.
- **Notional machines.** du Boulay (1986) and Sorva (2013): to explain code, give the learner a model of the machine that runs it. Likely the most useful idea for a skill that mostly explains software, and close to what the How tab already does.
- **Start from a question.** Loewenstein's (1994) information-gap account of curiosity, and Kapur's productive failure. Both are about why the person should want the answer before getting it. Close to Schwartz and Bransford's "time for telling."
- **Ontological categories.** Chi's work on why some misconceptions resist: a process taken for a thing (heat as a substance), or an emergent process taken for a direct one. Would make [conceptual-change.md](sources/conceptual-change.md) more specific about which wrong ideas are hard to move.
- **Practitioner writing.** Victor's *Explorable Explanations* (2011), Olah and Carter's "Research Debt" (Distill, 2017), and Pinker's chapter on the curse of knowledge in *The Sense of Style* (2014). Not research, but each is a working method for explanations written by experts for non-experts.

## Not decided

Nothing here is a rule for the skill. A later pass can keep, drop, or rewrite any of it.
