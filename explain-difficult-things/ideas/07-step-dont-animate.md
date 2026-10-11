# Step, don't animate

Walk a process as a series of frames, one change per frame, and move between the general view and one concrete case.

## Why

People think of a process as a sequence of steps, even when it is continuous. Animation is fast and disappears, so readers miss what changed. A series of still frames lets them compare a step with the one before and go back. When animation seems to win in studies, it is usually because it had extra information or let people pause and replay, not because it moved.

## How

- One frame, one change. Highlight what changed from the previous frame.
- Let the reader go forward and back at their own pace (Prev and Next).
- Keep the layout stable between frames so only the change moves.
- Alternate levels: the general picture, then one concrete run through it, then back to the general picture with what the run showed.
- Keep frames schematic. Drop realism that does not carry meaning.

## Example

The How tab walks the page in eight frames: one file holds the explanation, Mermaid draws, the page finds each shape, and so on. Each frame adds one mechanism to the same picture. A user who loses the thread presses Prev.

## Watch out

- Too many frames for a simple path is padding. A single diagram with arrows can show a simple flow.
- If the frames change layout, the reader has to search for the change, which defeats the point.

Based on: Tversky, Morrison, and Betrancourt on animation; Mayer's segmenting principle; Victor's ladder of abstraction.
