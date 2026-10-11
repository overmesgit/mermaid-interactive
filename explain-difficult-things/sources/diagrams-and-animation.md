# Diagrams, animation, and stepping (Larkin and Simon; Tversky; Victor)

When a diagram does work that words do not, and what that means for diagrams that change over time. [ainsworth-deft.md](ainsworth-deft.md) asks whether a second representation should exist. [mayer-multimedia.md](mayer-multimedia.md) says where to put the words. This note is about the diagram itself, and about animated or stepped diagrams such as the How tab's Prev and Next.

## Why a diagram can be worth ten thousand words (Larkin and Simon, 1987)

They compare a diagram and a text that hold the same information ("informationally equivalent") and ask which one is cheaper to use ("computationally equivalent"). A text is indexed by position in a list. A diagram is indexed by location in a plane, so many elements can share a location and each can be next to many others.

Their conclusion lists three reasons a diagram can be better (p. 98):

- It can group together all the information used together, so less search.
- It uses location to group information about one element, so no need to match symbolic labels.
- It supports many perceptual inferences, which are very easy for people.

And the caveat that matters more for a skill: "None of these points insure that an arbitrary diagram is worth 10,000 of any set of words. To be useful a diagram must be constructed to take advantage of these features" (p. 98). The advantage is computational, not that the diagram holds more. "Diagrams are useful only to those who know the appropriate computational processes for taking advantage of them" (p. 99). A reader who cannot read a sequence diagram gets no perceptual inferences from one.

A practical test from this: put next to each other the things the reader has to use together. If understanding a step still needs a hunt across the picture or back to the text, the layout is not doing its job.

## Congruence and apprehension (Tversky, Morrison, and Betrancourt, 2002)

Two principles for any graphic (pp. 257–258):

- **Congruence.** "The structure and content of the external representation should correspond to the desired structure and content of the internal representation." Their example: people think of routes as a series of turns, so a good route graphic is built on turns.
- **Apprehension.** "The structure and content of the external representation should be readily and accurately perceived and comprehended." People code angles and lengths in gross categories, so finer distinctions are lost.

On animation, their review of studies is "not encouraging" (p. 247). Where animation beat static graphics, the two were usually not equivalent: the animation had more information, or came with interactivity or prediction, which help on their own (p. 257). Animations are "often too complex or too fast to be accurately perceived" (p. 247).

Two findings are close to the How tab's design:

- People often conceive of continuous motion as discrete steps. "If motion is conceived of in discrete steps instead of continuously, then the natural way of conveying it is to portray it in discrete steps" (p. 256). Multiple diagrams "easily allow comparison and reinspection," while animations "are fleeting" (p. 256).
- Interactivity may be the key: stop, start, replay, zoom, control of speed (pp. 256, 258). The paper notes that static graphics also allow close-ups and perspective switches, so the proper experiments had not been done.

Their advice for an animation that is used: slow and clear enough to see each change and its timing, schematic rather than realistic, and annotated with arrows or highlights on the critical change (p. 258). "Clear understanding is a prerequisite to including only the information essential."

## Up and down the ladder of abstraction (Victor, 2011)

An interactive essay, not a study. Victor designs the steering rule for a simulated car and moves between levels: one concrete run at one time, then all times for one parameter value, then all parameter values at once. Stepping up shows the pattern. Stepping down to one concrete case shows why the pattern happens. "I believe that this dance is where the deepest insights are born." And: "we must never lose touch with what the behavior looks like on the ground."

This is Bruner's concrete-to-symbolic order made into a loop rather than a staircase, and Reigeluth's zoom lens with data. See [bruner-cra.md](bruner-cra.md) and [elaboration-theory.md](elaboration-theory.md). It also suggests the move is worth doing in both directions inside one explanation: show the general diagram, drop into one concrete trace through it, then come back up.

## What this does not settle

Larkin and Simon worked on physics and geometry problems solved by one person with paper. Tversky et al. restrict their conclusions to animations that teach complex mechanical, biological, and computational systems (p. 257). Neither tested a chat answer with a Mermaid diagram. Victor's essay is an argument from one worked example.

## Links

- Larkin, J. H., & Simon, H. A. (1987). Why a diagram is (sometimes) worth ten thousand words. *Cognitive Science*, 11(1), 65–99. https://doi.org/10.1016/S0364-0213(87)80026-5. Read: [UCSD course PDF](https://mechanism.ucsd.edu/bill/teaching/F12/cs200/Readings/larkin.whyadiagramissometimesworth.1987.pdf)
- Tversky, B., Morrison, J. B., & Betrancourt, M. (2002). Animation: Can it facilitate? *International Journal of Human-Computer Studies*, 57, 247–262. Read: [Stanford PDF](https://hci.stanford.edu/courses/cs448b/papers/Tversky_AnimationFacilitate_IJHCS02.pdf)
- Victor, B. (2011). Up and down the ladder of abstraction. Read: [worrydream.com/LadderOfAbstraction](https://worrydream.com/LadderOfAbstraction/)
- Not opened, worth reading next: Victor, B. (2011). Explorable explanations. [worrydream.com/ExplorableExplanations](https://worrydream.com/ExplorableExplanations/). And Mayer, Hegarty, Mayer, and Campbell (2005), When static media promote active learning, *Journal of Experimental Psychology: Applied*, 11(4), 256–265, which compares paper step diagrams with computer animation directly.
