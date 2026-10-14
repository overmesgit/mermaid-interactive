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
      summary: "The panel tells the diagram's story, shows one note, or is hidden.",
      story: md`
        A reader should not have to click every shape to follow a diagram, so the panel opens on the diagram's story. The story says what the picture shows, then lists its shapes and arrows.

        Clicking a shape or an arrow swaps the story for that part's note. Back returns to the story, so the reader never loses their place.

        Double-click Note to see which field of the content file fills which part of a note.
      `,
      chart: `stateDiagram-v2
  state "Note" as Selected
  [*] --> Story
  Story --> Selected: click a part
  Selected --> Story: Back or Esc
  Story --> Hidden: Close
  Hidden --> Story: Story button
  Hidden --> Selected: click a part`,
      nodeInteractions: {
        Story: {
          label: "Story",
          tooltip: "Shown when nothing is selected: the diagram's story and a list of its parts.",
          kicker: "Mode",
          body: md`
            The story comes from the view's \`story\` field, in markdown. Under it, every shape and then every arrow is listed with its tooltip, in the order the content file lists them.

            Pointing at a part in the list lights it in the picture. Clicking it opens its note. On a lesson step, the parts that step adds are marked New.
          `,
          facts: [["Field", "story"], ["Title", "the view's title"], ["Kicker", "Diagram, or Step n of m"]],
        },
        Selected: {
          label: "Note",
          tooltip: "One shape or arrow: its note, facts, and links. Double-click to see what fills it.",
          kicker: "Mode",
          body: md`
            A note explains one part of the picture. It opens on click, and the picture keeps its zoom and position, so the reader sees the part and its note together.

            The links at the bottom jump to the connected parts. A shape lists its arrows as In and Out. An arrow lists its From and To shapes.
          `,
          facts: [["Opens on", "click, Tab and Enter, or a link"], ["Leaves with", "Back or Esc"]],
          opensView: "note",
        },
        Hidden: {
          label: "Hidden",
          tooltip: "The reader closed the story. It stays closed on the next diagrams too.",
          kicker: "Mode",
          body: md`
            Some diagrams are wide, and the panel takes space from them. So Close on the story hides the panel, and it stays hidden while the reader moves to other diagrams.

            A click on a part still opens its note. Close on that note hides the panel again instead of going back to the story.
          `,
          facts: [["Back with", "the Story button"]],
        },
      },
      edgeInteractions: [
        arrow("*", "Story", "Every diagram opens on its story.", "Unless the reader hid the panel earlier."),
        arrow("Story", "Selected", "Click a shape, an arrow, or a row in the list.", "The panel title becomes the part's label, and its tooltip becomes the lead line."),
        arrow("Selected", "Story", "Back or Esc returns to the story.", "Esc on the story then steps up to the parent diagram, if there is one.", [["Keys", "Esc"]]),
        arrow("Story", "Hidden", "Close hides the panel.", "The diagram gets the full width."),
        arrow("Hidden", "Story", "The Story button brings it back.", ""),
        arrow("Hidden", "Selected", "A click still opens a note.", "Its button says Close instead of Back, because there is no story to go back to."),
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

        The links are the one part nobody writes, because the page works them out from the view's arrows.
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
    pKicker["Kicker<br><small>Small text above the title</small>"]
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
        pKicker: { label: "Kicker", tooltip: "Small text above the title.", kicker: "Panel" },
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
