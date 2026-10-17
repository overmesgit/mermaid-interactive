---
name: interactive-explainer
description: Build an interactive explanation as one HTML file with this diagram tool. Mermaid diagrams are walked step by step with Prev and Next, every shape and arrow can have a note in a side panel, a shape can open an inner diagram, and notes can show real code from the repo. Use when asked to make an explanation, walkthrough, or lesson with the interactive Mermaid page.
---

# Interactive explainer

A Mermaid diagram on its own is a flat picture: the reader cannot ask what a box does, see the code behind an arrow, or step through a process. This tool adds that. You write one content file, and the page turns it into a lesson of clickable diagrams, saved as one HTML file that opens in any browser.

This skill covers how to use the tool: what the page does, what to write, how to build the file, and how to check it. [references/format.md](references/format.md) describes every field in full. What to say and draw, so the reader follows it, is in the explain-clearly skill. Use the two together.

## What the reader gets

- **Tabs** across the top. Each opens one diagram.
- **A lesson**, if the tab has one. Prev, Next, and the arrow keys walk its steps, one diagram per step.
- **A story** in the side panel. It says what the diagram shows, and links each part where it talks about it, as a link or as a card between its sentences. As the reader scrolls, the paragraph they are at lights the parts it links, and a link to a numbered sequence message shows its number. A diagram with no story lists its parts instead.
- **Colors that mean something.** A part can be marked new, changed, removed, or a problem, and the word shows with the color. A dot marks a part with more to read.
- **One color per type of thing**, such as requests, routes, and handlers, in the diagram and in the text.
- **Tables** in notes and stories, to line up what is compared.
- **A highlight** on hover over any shape or arrow you wrote a note for, with a tooltip if you wrote one. The arrows it lights flow from start to end, and so do the arrows a lesson step adds.
- **A note** on click. It can hold markdown, code from the repo, and facts.
- **An inner diagram** on double-click, for a shape or arrow that has one. A ↘ badge marks the shape. Backspace goes back up.
- **Pan and zoom** with the mouse.
- **A note that keeps the story in place.** A part opened from the story shows its note right under that card or link. A part clicked in the picture shows its note as a card by its shape. A link can choose either with its title, like `[API](#api "peek below")`.
- **A link to the diagram on screen**, so a reader can share where they are.
- **An amber ⚠ chip** by the ⋯ menu when the content has a mistake. It lists each one.

## What you write

One file, usually `diagrams.js`, that sets `window.DIAGRAMS`. This is a whole, working file:

```js
window.DIAGRAMS = {
  tabs: [
    { id: "order", label: "Checkout", lesson: ["order", "payment"] },
  ],
  views: {
    order: {
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

A note is keyed by the shape's id in the chart, `api` in `api["API"]`, not by its label. Flowchart, sequence, state, and C4 charts are clickable; other Mermaid types draw, but nothing on them is. Most arrows need only `[from, to]`, with the meaning in the chart's arrow label, as in `api -- reads --> db`. [references/format.md](references/format.md) describes every field.

## Build it

1. **Write `diagrams.js`.** Start from the file above, or from the complete example in `references/format.md`.
2. **Pack it, then put it into the page.** Run these commands from the root of the repo the code comes from, because that is where the `file=` paths start. Set `skill` to this skill's folder and `content` to your content file.

   The first command packs: it copies the content file to `packed.js` and adds every file a note names to the end, whole, as gzip and base64. So `packed.js` is the complete explanation and needs no repo. The second puts it into the page: `assets/explainer.html` is the whole page with one line, `/* DIAGRAMS */`, where the content goes, and the command copies the page with `packed.js` in place of that line.

   ```bash
   {
     cat "$content"
     echo
     sed -n 's/^[[:space:]]*~~~.*[[:space:]]file=\([^[:space:]]*\).*/\1/p' "$content" | sort -u |
     while read -r f; do
       printf 'packFile("%s", `\n' "$f"
       case "$f" in
         *:*) git show "$f" ;;
         *)   cat "$f" ;;
       esac | gzip -cn | base64
       printf '`);\n'
     done
   } > packed.js
   sed -e '/^\/\* DIAGRAMS \*\/$/r packed.js' -e '/^\/\* DIAGRAMS \*\/$/d' "$skill/assets/explainer.html" > explanation.html
   ```

   It needs a POSIX shell: Linux, macOS, or Git Bash on Windows. With no `file=` fences it packs no files. Pack from your own content file, not from `packed.js`, so the files are not added twice.
3. **Look at it.** Open `explanation.html` in a browser. It needs no server, but it loads Mermaid from the network. Walk every step and open every inner diagram, because an arrow is only checked once its diagram is drawn. Fix everything under the ⚠ chip, then run step 2 again and reload.
4. **Check it by hand** if you cannot open a browser, with [the checklist](references/format.md#check-before-handing-it-over).
5. **Hand over `explanation.html`.** Say where it and `packed.js` are. Do not commit or publish them unless asked, because this skill does not choose where they are hosted. `packed.js` is the same explanation in a smaller file: anyone can drop it on the [editor](https://overmesgit.github.io/mermaid-interactive/) to see it and export the HTML.

## Mistakes that are easy to make

A mistake does not stop the page. It leaves a shape or an arrow that does nothing on click, so it looks broken. The page lists most mistakes under the ⚠ chip, and [the checklist](references/format.md#check-before-handing-it-over) has all of them. Two more are not errors, so nothing lists them:

- **A layout that jumps between steps.** Keep the same ids from one lesson step to the next, so Mermaid draws them in the same place and only the change moves.
- **A comparison split across two steps.** To show before and after, draw both in one flowchart, as two `subgraph`s side by side. `references/format.md` shows how.

## Show code from the repo

Name a file and a line range in an empty fence, like `~~~go file=api/session.go lines=40-58`, and the page shows those lines. Do not paste code that exists as a file. Step 2 packs each named file into the content file, so the explanation works without the repo. [Code files](references/format.md#code-files) has the rest: `mark=`, git revisions, and paths.
