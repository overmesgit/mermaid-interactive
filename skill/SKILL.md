---
name: interactive-explainer
description: Build an interactive explanation as one HTML file with this diagram tool. Mermaid diagrams are walked step by step with Prev and Next, every shape and arrow has a tooltip and a note in a side panel, a shape can open an inner diagram, and notes can show real code from the repo. Use when asked to make an explanation, walkthrough, or lesson with the interactive Mermaid page.
---

# Interactive explainer

A Mermaid diagram on its own is a flat picture: the reader cannot ask what a box does, see the code behind an arrow, or step through a process. This tool adds that. You write one content file, and the page turns it into a lesson of clickable diagrams, saved as one HTML file that opens in any browser.

This skill covers how to use the tool: what the page does, what to write, how to build the file, and how to check it. [references/format.md](references/format.md) describes every field in full.

## What the reader gets

- **Tabs** across the top. Each opens one diagram.
- **A lesson**, if the tab has one. Prev, Next, and the arrow keys walk its steps, one diagram per step.
- **A story** in the side panel. It says what the diagram shows, and links each part where it talks about it, as a link or as a card between its sentences. There is no separate list of parts.
- **Colors that mean something.** A part can be marked new, changed, removed, or a problem, and the word shows with the color. A key part has a heavy outline, a background part steps back, and a dot marks a part with more to read.
- **One color per type of thing**, such as requests, routes, and handlers, in the diagram and in the text.
- **Tables** in notes and stories, to line up what is compared.
- **A tooltip** on hover over any shape or arrow you wrote a note for. The arrows it lights flow from start to end, and so do the arrows a lesson step adds.
- **A note** in the side panel on click. It can hold markdown, code from the repo, and facts, and it links to the connected shapes.
- **An inner diagram** on double-click, or the ↘ badge, for a shape or arrow that has one. Backspace goes back up.
- **Find** to filter shapes by name, and pan and zoom with the mouse.
- **A note that keeps the story in place.** A part opened from the story shows its note right under that card or link. A part clicked in the picture shows its note as a card by its shape. A link can choose either with its title, like `[API](#api "peek below")`. A target icon by the note's title finds the part in the diagram.
- **Back and Forward** in the browser undo and redo each step, drill-down, and opened note.
- **An amber ⚠ chip** by Find when the content has a mistake. It lists each one.

## What you write

One file, usually `diagrams.js`, that sets `window.DIAGRAMS`. This is a whole, working file:

```js
window.DIAGRAMS = {
  tabs: [
    { id: "order", label: "Checkout", lesson: ["order", "payment"] },
  ],
  views: {
    order: {
      viewId: "order",
      tab: "order",
      parent: null,
      title: "One order",
      summary: "A cart becomes an order.",
      story: md`
        What this step shows, and why. The panel shows it when nothing is selected.

        [API](#api)

        A line that only links to a part shows that part's card in its place.
      `,
      chart: `flowchart LR
  web["Web app<br><small>Sends the cart</small>"] --> api["API<br><small>Creates the order</small>"]`,
      nodeInteractions: {
        web: { label: "Web app", tooltip: "The page the customer clicks Pay on." },
        api: {
          label: "API",
          tooltip: "Turns the cart into an order.",
          body: md`
            The note, in markdown. Code comes from the repo:

            ~~~js file=src/api/orders.js lines=10-24
            ~~~
          `,
          opensView: "api-inside",
        },
      },
      edgeInteractions: [
        arrow("web", "api", "Posts the cart."),
      ],
    },
    "api-inside": {
      viewId: "api-inside",
      tab: "order",
      parent: "order",
      title: "Inside the API",
      summary: "What the API does with the cart.",
      chart: `flowchart LR
  check["Check stock"] --> save["Save order"]`,
      nodeInteractions: {
        check: { label: "Check stock", tooltip: "Every item must be in stock." },
        save: { label: "Save order", tooltip: "One row per order." },
      },
      edgeInteractions: [["check", "save"]],
    },
    payment: {
      viewId: "payment",
      tab: "order",
      parent: null,
      title: "Payment",
      summary: "The order is paid.",
      chart: `sequenceDiagram
  participant API
  participant Bank
  API->>Bank: Charge the card
  Bank-->>API: Approved`,
      nodeInteractions: {
        API: { label: "API", tooltip: "Asks the bank to charge." },
        Bank: { label: "Bank", tooltip: "Approves or declines." },
      },
      edgeInteractions: [
        arrow("API", "Bank", "One charge per order.", "", [], { mermaidText: "Charge the card" }),
        arrow("Bank", "API", "The answer.", "", [], { mermaidText: "Approved" }),
      ],
    },
  },
};
```

- **`tabs`** are the buttons across the top. `lesson` lists the steps in order, by view id.
- **`views`** are the diagrams, keyed by id. A lesson step has `parent: null`. An inner diagram names the view it opens from as its `parent`.
- **`chart`** is the Mermaid source. Flowchart, sequence, state, and C4 charts are clickable. Other Mermaid types draw, but nothing on them is clickable.
- **`nodeInteractions`** are the notes on shapes, keyed by the shape's id in the chart: `api` in `api["API"]`.
- **`edgeInteractions`** are the notes on arrows. `arrow(from, to, tooltip, body, facts, more)` makes one, and `[from, to]` is the short form.
- **`md`** strips the indent from a note, so notes can be indented with the code.
- **`status`** and **`weight`** on a note say what changed and what matters: `status: "new"`, `"changed"`, `"removed"`, or `"problem"`, and `weight: "key"` or `"background"`.
- **Arrow labels** carry what an arrow means, as in `api -- reads --> db`. Most arrows need only `[from, to]`. Give an arrow a note only when it has real detail.

## Build it

1. **Write `diagrams.js`.** Start from the file above, or from the complete example in `references/format.md`.
2. **Pack it, then put it into the page.** The commands in step 2 of `references/format.md` first pack: they copy your file to `packed.js` and add every code file the notes name to its end. Then they put `packed.js` into `assets/explainer.html`, the whole page with one line, `/* DIAGRAMS */`, where the content goes. They write `packed.js` and `explanation.html`. Run them from the root of the repo the code comes from.
3. **Look at it.** Open `explanation.html` in a browser. It needs no server, but it loads Mermaid from the network. Walk every step and open every inner diagram, because an arrow is only checked once its diagram is drawn. Fix everything under the ⚠ chip, then run step 2 again and reload.
4. **Check it by hand** if you cannot open a browser. `references/format.md` has the checklist.
5. **Hand over `explanation.html`.** Say where it and `packed.js` are. Do not commit or publish them unless asked.

## Mistakes that are easy to make

A mistake does not stop the page. It leaves a shape or an arrow that does nothing on click, so it looks broken. These cause most of them:

- **A note key that is not the shape's id.** The key must be the id in the chart, not its label. In a C4 chart it is the alias, in a sequence chart the participant id, in a state chart the state id.
- **An arrow the page cannot find.** In a flowchart the chart must draw `from --> to`. In a sequence or C4 chart the arrow needs `mermaidText`, the message or relation text. In a state chart both ends need a shape note, or `"*"` for the start and end dots.
- **A view id that does not exist.** Every `opensView`, `parent`, tab `id`, and lesson entry must be a key in `views`, and each view's `viewId` must equal its key.
- **Backticks in a note.** A note is a JavaScript template, so a backtick ends it. Fence code with `~~~`, write inline code as `` \`name\` ``, and write `${` as `\${`.
- **A reserved id.** Mermaid fails on some ids, such as `end` in a flowchart or `Note` in a state chart. Use another id and keep the word as the label: `state "Note" as Selected`.
- **`</script` in the content file.** It ends the page's script tag. Code files named with `file=` may contain it.
- **A layout that jumps between steps.** Keep the same ids from one lesson step to the next, so Mermaid draws them in the same place and only the change moves.
- **A comparison split across two steps.** To show before and after, draw both in one flowchart, as two `subgraph`s side by side. `references/format.md` shows how.

## Show code from the repo

Name a file and a line range in an empty fence, and the page shows those lines:

```md
~~~go file=api/session.go lines=40-58
~~~
```

The path starts at the repo root. Add `mark=44-47` to highlight the lines that matter inside a longer range. Clicking the code's header switches to the whole file, with the range highlighted. To show an older version, put a git revision first, as in `file=main:api/session.go`. Step 2 packs each named file whole into the content file, so the explanation works without the repo. `references/format.md` has the details.
