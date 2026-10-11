# Give two concrete examples

Give one concrete case, then a second that looks different, and say which part of them is the idea.

## Why

Abstract statements are hard to hold. One example helps, but readers remember its surface (the names, the domain) instead of its structure. A second example with a different surface shows what stays the same. And if the example and the rule disagree, readers follow the example, so the link between them has to be said out loud.

## How

- Order: concrete case → picture of it → general rule or code. Not the other way round.
- After the example, point at the part that *is* the idea: "this line is the retry; the rest is setup."
- Add a second example from a different area with the same structure.
- For a procedure, label the steps by what they achieve ("validate", "reserve", "charge"), not just by number.
- For a reader learning to do it: show a full worked example, then one with a step left for them, then let them do it.

## Example

To explain idempotency keys: first a card payment retried after a timeout, charged once. Then a second case: a "create order" request sent twice from a flaky phone, one order created. Then say what both share: the server remembers the key and returns the first result.

## Watch out

- An interesting detail that is not the point crowds out the point.
- Once the reader can do the task, more full examples slow them down.

Based on: worked-example research (Renkl; Atkinson et al.); concrete examples and analogical transfer (Gick and Holyoak); concrete–representational–abstract order (Bruner).
