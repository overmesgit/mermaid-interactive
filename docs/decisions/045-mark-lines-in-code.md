# ADR-045 A code note can mark the lines that matter

- Status: accepted
- Date: 2026-10-16

## Context

A note showed a 40-line function, the whole of `registerErr` in the Go router example, and the reader could not tell which lines mattered. Showing fewer lines cuts off the context the reader needs. Showing more hides the point.

## Decision

A file fence takes `mark=`, with one line, a range, or a comma list: `~~~go file=server.go lines=2737-2779 mark=2764-2774`. The marked lines get a yellow background and a bar on the left, in both the range and the whole file. The code scrolls to the first marked line.

The page lists a `mark` outside the lines shown as a problem, because nothing would be highlighted.

The join command needs no change. It reads only `file=`.

## Consequences

A note can show enough context and still point at the few lines that carry it. `lines` says what to show, and `mark` says where to look.
