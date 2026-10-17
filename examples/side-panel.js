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
      summary: "The panel shows the diagram's story, a part's note under it, both, or neither.",
      story: md`
        A reader should not have to click every shape to follow a diagram, so the panel opens on the diagram's [story](#Story). The story says what the picture shows, and links each part where it talks about it.

        [Clicking a part](#Story->Both) opens its note under the story: [story and note](#Both). The story stays where the reader left it, so they can read the detail and go on reading without losing their place. [× or Esc](#Both->Story) closes the note.

        Close on the story [hides the panel](#Hidden). A note opened then [fills the panel alone](#NoteOnly).

        Double-click Story and note to see which field of the content file fills which part of a note.
      `,
      chart: `stateDiagram-v2
  state "Story and note" as Both
  state "Note only" as NoteOnly
  [*] --> Story
  Story --> Both: click a part
  Both --> Story: × or Esc
  Both --> NoteOnly: Close the story
  NoteOnly --> Both: Story button
  Story --> Hidden: Close
  Hidden --> Story: Story button
  Hidden --> NoteOnly: click a part
  NoteOnly --> Hidden: × or Esc`,
      nodeInteractions: {
        Story: {
          label: "Story",
          tooltip: "Shown when nothing is selected: the diagram's story and a list of its parts.",
          kicker: "Mode",
          body: md`
            The story comes from the view's \`story\` field, in markdown. It links each part where it talks about it, and a line of only links shows those parts as cards. A view with no story lists its parts instead.

            Pointing at a link lights its part in the picture. Clicking it opens its note. On a lesson step, the parts that step adds are marked New.
          `,
          facts: [["Field", "story"], ["Title", "the view's title"], ["Kicker", "Diagram, or Step n of m"]],
        },
        Both: {
          label: "Story and note",
          tooltip: "The story on top, and one part's note under it. Double-click to see what fills a note.",
          kicker: "Mode",
          body: md`
            A note explains one part of the picture. It opens on click, and the picture keeps its zoom and position, so the reader sees the part and its note together.

            The story stays on top and keeps its scroll, so opening a detail never hides the big picture. The story's card for the open part is marked. The divider between the two can be dragged.

            The links at the bottom of the note jump to the connected parts. A shape lists its arrows as In and Out. An arrow lists its From and To shapes.
          `,
          facts: [["Opens on", "click, Tab and Enter, or a link"], ["Leaves with", "× or Esc"]],
          opensView: "note",
        },
        NoteOnly: {
          label: "Note only",
          tooltip: "The reader closed the story, then opened a part. The note fills the panel.",
          kicker: "Mode",
          body: md`
            On a narrow screen the note covers the story the same way, because the panel is too short for both. Closing the note shows the story again at the same place.
          `,
        },
        Hidden: {
          label: "Hidden",
          tooltip: "The reader closed the story. It stays closed on the next diagrams too.",
          kicker: "Mode",
          body: md`
            Some diagrams are wide, and the panel takes space from them. So Close on the story hides it, and it stays hidden while the reader moves to other diagrams.

            A click on a part still opens its note, and closing the note hides the panel again.
          `,
          facts: [["Back with", "the Story button"]],
        },
      },
      edgeInteractions: [
        ["*", "Story"],
        arrow("Story", "Both", "Click a shape, an arrow, or a row in the list.", "The note opens under the story. Its title is the part's label, and its tooltip is the lead line."),
        arrow("Both", "Story", "×, Esc, or a second click on the part in the story closes the note.", "Esc on the story then steps up to the parent diagram, if there is one.", [["Keys", "Esc"]]),
        ["Both", "NoteOnly"],
        ["NoteOnly", "Both"],
        ["Story", "Hidden"],
        ["Hidden", "Story"],
        ["Hidden", "NoteOnly"],
        ["NoteOnly", "Hidden"],
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
