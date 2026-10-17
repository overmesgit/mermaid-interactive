// How the side panel works: what it shows, and what moves it from one mode to the next.
// Open it with ?src=examples/side-panel.js. The format is skill/references/format.md.

window.DIAGRAMS = {
  tabs: [
    { id: "panel", label: "Side panel" },
  ],
  views: {
    panel: {
      viewId: "panel",
      tab: "panel",
      parent: null,
      title: "Side panel",
      summary: "The panel shows the diagram's story. A part's note opens inside it, or as a card by the part's shape.",
      story: md`
        A reader should not have to click every shape to follow a diagram, so the panel opens on the diagram's [story](#Story). The story says what the picture shows, and links each part where it talks about it.

        [Clicking a part in the story](#Story->Inline) opens its note [right under the link or card](#Inline). The story flows around it and stays where the reader left it. [×, Esc, or the link again](#Inline->Story) closes the note.

        [Clicking a part in the picture](#Story->Peek) opens its note as [a card by the shape](#Peek "peek below"), because that is where the reader is looking.

        Close on the story [hides the panel](#Hidden). A part clicked in the picture [still opens its card](#Hidden->Peek).

        Double-click Inline note to see which field of the content file fills which part of a note.
      `,
      chart: `stateDiagram-v2
  state "Inline note" as Inline
  [*] --> Story
  Story --> Inline: click a part in the story
  Inline --> Story: ×, Esc, or the link again
  Story --> Peek: click a part in the picture
  Peek --> Story: × or Esc
  Story --> Hidden: Close
  Hidden --> Story: Story button
  Hidden --> Peek: click a part in the picture`,
      nodeInteractions: {
        Story: {
          label: "Story",
          tooltip: "Shown when nothing is selected: the diagram's story, with a link to each part.",
          kicker: "Mode",
          body: md`
            The story comes from the view's \`story\` field, in markdown. It links each part where it talks about it, and a line of only links shows those parts as cards. A view with no story lists its parts instead.

            Pointing at a link lights its part in the picture. Clicking it opens its note. On a lesson step, the parts that step adds are marked New.
          `,
          facts: [["Field", "story"], ["Title", "the view's title"], ["Kicker", "Diagram, or Step n of m"]],
        },
        Inline: {
          label: "Inline note",
          tooltip: "The note opens inside the story, right under the card or link that was clicked. Double-click to see what fills a note.",
          kicker: "Mode",
          body: md`
            A note explains one part of the picture. Opened from the story, it sits right under the card or the paragraph that opened it, and the story flows around it. The picture keeps its zoom and position, so the reader sees the part and its note together.

            Under a card the note shows only its text and code. The card already names the part and says what it is, and the picture shows what it connects to.

            A link's title can send its note to a card on the canvas instead: \`[API](#api "peek")\`.
          `,
          facts: [["Opens on", "a card or link in the story"], ["Leaves with", "×, Esc, or the link again"]],
          opensView: "note",
        },
        Peek: {
          label: "Peek",
          tooltip: "The note is a card on the canvas, held against its shape.",
          kicker: "Mode",
          body: md`
            A click on the picture opens the note as a card by the shape, because that is where the reader is looking. The card sits beside the shape, below it, or in the corner. Its buttons let the reader move it, and the view's \`notePlace\` sets where it starts.

            The card follows its shape as the reader pans and zooms. It shows the whole note: the header, the facts, and the links to connected parts.
          `,
          facts: [["Opens on", "a click on the picture, or a link titled peek"], ["Places", "beside, below, corner"]],
        },
        Hidden: {
          label: "Hidden",
          tooltip: "The reader closed the story. It stays closed on the next diagrams too.",
          kicker: "Mode",
          body: md`
            Some diagrams are wide, and the panel takes space from them. So Close on the story hides it, and it stays hidden while the reader moves to other diagrams.

            A click on a part in the picture still opens its note as a card by the shape.
          `,
          facts: [["Back with", "the Story button"]],
        },
      },
      edgeInteractions: [
        ["*", "Story"],
        arrow("Story", "Inline", "Click a card or a link in the story.", "The note opens under it. A link titled peek opens a card on the canvas instead."),
        arrow("Inline", "Story", "×, Esc, or a second click on the link closes the note.", "Esc on the story then steps up to the parent diagram, if there is one.", [["Keys", "Esc"]]),
        arrow("Story", "Peek", "Click a shape or an arrow in the picture.", "The camera pans so the shape and its card both fit."),
        ["Peek", "Story"],
        ["Story", "Hidden"],
        ["Hidden", "Story"],
        arrow("Hidden", "Peek", "Click a shape or an arrow in the picture.", "The card opens on the canvas. The panel stays hidden."),
      ],
    },
    note: {
      viewId: "note",
      tab: "panel",
      parent: "panel",
      title: "What fills a note",
      summary: "Each field of a shape or arrow fills one part of the panel.",
      story: md`
        A note is built only from what the content file says about one shape or arrow. The left column is those fields. The right column is the panel, top to bottom.

        The [body](#body) is markdown, and the [facts](#facts) are a short table. The [links](#edges->pLinks) are the one part nobody writes, because the page works them out from the view's arrows.
      `,
      chart: `flowchart LR
  subgraph fields["Content file"]
    direction TB
    kicker["kicker<br><small>One word, like Service</small>"]
    label["label<br><small>The shape's name</small>"]
    tooltip["tooltip<br><small>One sentence</small>"]
    body["body<br><small>Markdown</small>"]
    facts["facts<br><small>Term and value pairs</small>"]
    edges["edgeInteractions<br><small>The view's arrows</small>"]
    opens["opensView<br><small>An inner diagram</small>"]
  end
  subgraph shown["Side panel"]
    direction TB
    pKicker["Kicker<br><small>Small text after the title</small>"]
    pTitle["Title"]
    pLead["Lead line<br><small>Also the hover tooltip</small>"]
    pNote["Note<br><small>Paragraphs, lists, code</small>"]
    pFacts["Facts<br><small>A short table</small>"]
    pLinks["Links<br><small>In, Out, From, To</small>"]
    pZoom["Open inner diagram<br><small>A button</small>"]
  end
  kicker --> pKicker
  label --> pTitle
  tooltip --> pLead
  body --> pNote
  facts --> pFacts
  edges --> pLinks
  opens --> pZoom`,
      nodeInteractions: {
        kicker: { label: "kicker", tooltip: "One word that says what kind of thing this is.", kicker: "Field" },
        label: { label: "label", tooltip: "The name. Arrows also use it to name their ends.", kicker: "Field" },
        tooltip: { label: "tooltip", tooltip: "One sentence, shown on hover and as the lead line.", kicker: "Field" },
        body: {
          label: "body",
          tooltip: "The note itself, in markdown.",
          kicker: "Field",
          body: md`
            Write it with the md tag, so the indent is stripped. Use ~~~ fences for code, because a backtick fence would end the JavaScript template.

            Links work for http and https. HTML and images are dropped, so a note cannot inject anything into the page.
          `,
        },
        facts: { label: "facts", tooltip: "Rows of [term, value].", kicker: "Field", facts: [["Example", "[\"File\", \"api/session.go\"]"]] },
        edges: { label: "edgeInteractions", tooltip: "The view's arrows. The page reads them to build the links.", kicker: "Field" },
        opens: { label: "opensView", tooltip: "The viewId that double-click or the button opens.", kicker: "Field" },
        pKicker: { label: "Kicker", tooltip: "Small gray text after the title, on the same line.", kicker: "Panel" },
        pTitle: { label: "Title", tooltip: "The label, or From → To for an arrow without one.", kicker: "Panel" },
        pLead: { label: "Lead line", tooltip: "The tooltip again, so the panel starts with the short version.", kicker: "Panel" },
        pNote: { label: "Note", tooltip: "The body, rendered from markdown.", kicker: "Panel" },
        pFacts: { label: "Facts", tooltip: "A two-column table under the note.", kicker: "Panel" },
        pLinks: { label: "Links", tooltip: "Buttons to the connected shapes and arrows.", kicker: "Panel" },
        pZoom: { label: "Open inner diagram", tooltip: "Shown only when the part has an opensView.", kicker: "Panel" },
      },
      edgeInteractions: [
        arrow("kicker", "pKicker", "Shown as written.", ""),
        arrow("label", "pTitle", "Shown as written.", ""),
        arrow("tooltip", "pLead", "The same sentence as on hover.", ""),
        arrow("body", "pNote", "Rendered from markdown.", ""),
        arrow("facts", "pFacts", "One row per pair.", ""),
        arrow("edges", "pLinks", "Worked out, not written.", "A shape gets one In or Out link per arrow that touches it. An arrow gets From and To."),
        arrow("opens", "pZoom", "The button appears only with an opensView.", ""),
      ],
    },
  },
};
