# Show a small whole first

Show the smallest version of the whole that still works, then zoom into one part and back out.

## Why

A reader who sees the parts first has nothing to hang them on. A table of contents or a list of components does not help much: it names everything and explains nothing. What helps is a small, real version of the whole that the reader can follow from start to end. After that, every detail has a place to go.

## How

- Find the simplest case that is still typical: one request, one happy path, one record. Show it end to end.
- Keep it real. A toy that never happens in the system misleads.
- Then zoom into one part. Add one complication at a time: an error, a second user, a retry.
- After each zoom, zoom back out and show where the new detail sits in the whole.
- Teach a prerequisite in the step that needs it, not all of them up front.

## Example

For the bookshop: first the order path in one picture. Browser → web app → API → database, one book bought with a card. Then open "Checkout" for the steps inside, then "Card payment" for the case where the card is declined. Then return to the top picture.

## Watch out

- The very simplest case can be unrepresentative. A system with no failure path at all teaches the wrong shape.
- A summary is not a small whole. "There are five services" tells the reader nothing they can follow.

Based on: Reigeluth's elaboration theory (epitome, zoom lens); Ausubel's advance organizer.
