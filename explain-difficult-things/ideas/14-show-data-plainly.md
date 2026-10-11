# Show data plainly

For numbers, use position on a shared axis first, and use a table when exact values matter.

## Why

People compare some visual encodings much more accurately than others. Position along a common scale is read best. Length is next, then angle and slope, then area, then colour shade. A pie chart or a bubble chart asks the reader to compare angles or areas, which they do poorly. A chart is for seeing a pattern, and a table is for looking up a value.

## How

- To compare amounts: bars or dots on one common axis, sorted by value.
- To show change over time: a line on a time axis.
- To show exact numbers the reader will quote: a table.
- Use one chart for one point. Put that point in the title ("Checkout errors doubled after the release").
- Label the lines directly, not in a legend far away.
- Ask the DeFT question first: does the chart show something the sentence cannot? If not, write the sentence.

## Example

To show which API endpoint is slowest, a sorted horizontal bar chart of p95 latency beats a pie of request counts. If the reader needs the exact milliseconds for a ticket, add a table.

## Watch out

- 3D effects, dual axes, and truncated axes mislead more than they inform.
- Do not use colour alone for a difference that matters. Some readers cannot see it.

Based on: Cleveland and McGill's ranking of graphical encodings; Ainsworth's DeFT.
