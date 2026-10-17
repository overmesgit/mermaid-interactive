// A PR-style explanation of commit 4c92d28, which made the page check its own content.
// Written with skill/SKILL.md, as an agent would. Pack it from the repo root, because its code notes name files at that commit.
// examples/pr-checks.packed.js is this file packed, so the editor can show its code. Pack it again after editing this file.

window.DIAGRAMS = {
  tabs: [
    { id: "problem", label: "Page checks", lesson: ["problem", "two-checks", "run", "answer"] },
  ],
  views: {
    problem: {
      tab: "problem",
      parent: null,
      title: "A dead shape says nothing",
      summary: "A mistake in the content leaves a shape that does nothing on click, and nobody is told.",
      story: md`
        **The question:** why did a typo in an explanation go unnoticed until a reader clicked a shape and nothing happened?

        An [agent](#writer) writes the [content file](#content), and the [page](#page) draws it. If a note names a shape the chart does not have, the page still draws the diagram. That shape simply has no note, so a click does nothing. Nothing on the page or in the console says why, so the agent cannot know, and the reader thinks the page is broken.

        It is natural to think "the page loaded, so the explanation is fine." Loading only proves the JavaScript runs. It says nothing about whether each note found its shape.

        This change makes the page check its own content and list every mistake.
      `,
      chart: `flowchart LR
  writer["Agent<br><small>Writes the content file</small>"] --> content["diagrams.js<br><small>Notes keyed by shape id</small>"]
  content --> page["Page<br><small>Draws each chart</small>"]
  page --> reader["Reader<br><small>Clicks a shape</small>"]`,
      nodeInteractions: {
        writer: {
          label: "Agent",
          kicker: "Who",
          tooltip: "Writes the explanation, usually without a browser.",
          body: md`
            Most agents cannot open the page, so they never see a shape that does nothing. Whatever the page knows about a mistake has to be written down where the agent, or the next person, can read it.
          `,
        },
        content: {
          label: "diagrams.js",
          kicker: "File",
          tooltip: "The content: charts, and notes keyed by the ids in each chart.",
          body: md`
            A note is joined to its shape only by an id. Here the note says \`cache\`, but the chart never draws a \`cache\`:

            ~~~js
            nodeInteractions: {
              api: { label: "API" },
              cache: { label: "Cache" }, // no cache in the chart
            }
            ~~~

            Nothing in JavaScript fails, because the object is valid. The mistake is only visible when the two are compared.
          `,
        },
        page: {
          label: "Page",
          kicker: "Engine",
          tooltip: "Draws each chart with Mermaid, then wires a click to each shape it can find.",
          body: md`
            Before this change, a note whose shape was not found was skipped silently.
          `,
        },
        reader: {
          label: "Reader",
          kicker: "Who",
          tooltip: "Finds the mistake by clicking a shape that does nothing.",
        },
      },
      edgeInteractions: [
        arrow("writer", "content", "The agent writes notes keyed by shape id."),
        arrow("content", "page", "The page reads the content and draws each chart."),
        arrow("page", "reader", "The reader clicks. A shape whose note was not found does nothing."),
      ],
    },

    "two-checks": {
      tab: "problem",
      parent: null,
      title: "Why there are two checks",
      summary: "Only drawing proves a shape exists, but a step nobody opens is never drawn.",
      story: md`
        **This is the hard part.** Only Mermaid's picture can say for sure whether a shape or an arrow exists. But the page draws one diagram at a time, so a step nobody opened is never drawn, and its mistakes would never show.

        So there are two checks:

        - **[The content check](#contentCheck)** runs once on load and reads every view as text. It catches most mistakes in steps nobody has opened yet. Because it reads text, it can only guess whether Mermaid will draw a given shape.
        - **[The draw check](#drawCheck)** runs after each diagram is drawn and asks what could not be found in the picture. It is certain, but only for the diagrams drawn so far.

        Once a view is drawn, its draw result replaces the content check's guesses about shapes and arrows in that view, so one mistake is not listed twice in the [problem list](#list).

        Click either check for an example of what only it can catch.
      `,
      chart: `flowchart LR
  content["diagrams.js<br><small>Every view, as text</small>"] --> contentCheck["Content check<br><small>On load. Guesses from text</small>"]
  content --> page["Page<br><small>Draws one view at a time</small>"]
  page --> drawCheck["Draw check<br><small>After each draw. Certain</small>"]
  contentCheck --> list["Problem list<br><small>Behind the ⚠ chip</small>"]
  drawCheck --> list`,
      nodeInteractions: {
        content: {
          label: "diagrams.js",
          kicker: "File",
          tooltip: "Every view, available as text from the start.",
        },
        contentCheck: {
          label: "Content check",
          kicker: "On load",
          tooltip: "Reads every view as text, so it covers steps nobody has opened.",
          body: md`
            It checks what text can prove: every \`opensView\`, \`parent\`, and lesson step names a real view, sequence arrows have a \`mermaidText\`, and each id appears somewhere in its chart. It also asks Mermaid to parse every chart, so a step that would fail to draw is reported before anyone reaches it.

            **Only this check catches** a broken chart in step 5 while the reader is still on step 1.

            ~~~js file=4c92d28:js/check.js lines=44-66
            ~~~
          `,
        },
        page: {
          label: "Page",
          kicker: "Engine",
          tooltip: "Draws one view at a time, when the reader opens it.",
        },
        drawCheck: {
          label: "Draw check",
          kicker: "After each draw",
          tooltip: "Lists the shapes and arrows the page could not find in the picture just drawn.",
          body: md`
            The wiring code already searches the picture for each note's shape. Now it returns the notes it could not place, and the check lists them.

            **Only this check catches** an arrow between two shapes that both exist, but that the chart never draws, such as \`db → api\` when the chart has only \`api --> db\`. The text check sees both ids and is satisfied.

            ~~~js file=4c92d28:js/check.js lines=96-109
            ~~~
          `,
        },
        list: {
          label: "Problem list",
          kicker: "Output",
          tooltip: "One list from both checks, behind the amber ⚠ chip, and in the console.",
          body: md`
            A drawn view's results replace the content check's guesses for that view. The \`match\` flag marks which guesses the draw check can replace.

            ~~~js file=4c92d28:js/check.js lines=111-132
            ~~~
          `,
        },
      },
      edgeInteractions: [
        arrow("content", "contentCheck", "Every view is read on load."),
        arrow("content", "page", "One view is drawn at a time."),
        arrow("page", "drawCheck", "After each draw, the missed shapes and arrows are reported."),
        arrow("contentCheck", "list", "Guesses for views not yet drawn, and facts text can prove."),
        arrow("drawCheck", "list", "Certain results for each view drawn so far."),
      ],
    },

    run: {
      tab: "problem",
      parent: null,
      title: "What runs, in order",
      summary: "The content check runs once at boot. The draw check runs inside every draw.",
      story: md`
        Follow one page load with a mistake in step 3.

        At boot [the content check runs](#Boot->Check), so the chip can show a count before anything is clicked. Mermaid then [parses every chart](#Check->Mermaid), which takes a moment, so the list updates a second time.

        Each time a view is drawn, [the wiring code returns what it could not place](#Bind->Nav), and [the draw check stores that](#Nav->Check) under the view's id. Opening step 3 adds its certain result, and the list is drawn again.

        This picture leaves out the dedupe and the console output. Click the arrows for the code.
      `,
      chart: `sequenceDiagram
  participant Boot
  participant Check
  participant Mermaid
  participant Nav
  participant Bind
  Boot->>Check: runChecks
  Check->>Mermaid: parse every chart
  Mermaid-->>Check: errors, if any
  Nav->>Mermaid: render the view
  Nav->>Bind: wire the shapes and arrows
  Bind-->>Nav: what was not found
  Nav->>Check: reportDrawn`,
      nodeInteractions: {
        Boot: { label: "Boot", kicker: "Script", tooltip: "Starts the page: tabs, camera, panel, then the checks." },
        Check: { label: "Check", kicker: "Script", tooltip: "Holds both checks and draws the problem list." },
        Mermaid: { label: "Mermaid", kicker: "Library", tooltip: "Parses and draws the charts." },
        Nav: { label: "Nav", kicker: "Script", tooltip: "show() is the only way to change the diagram." },
        Bind: { label: "Bind", kicker: "Script", tooltip: "Finds each note's shape in the picture and adds the click." },
      },
      edgeInteractions: [
        arrow("Boot", "Check", "At boot, before the first diagram is drawn.", md`
          The content check is quick, so the list shows at once. The chart parse is slower and updates it a second time.

          ~~~js file=4c92d28:js/check.js lines=89-94
          ~~~
        `, [], { mermaidText: "runChecks" }),
        arrow("Check", "Mermaid", "Every chart is parsed, not only the one on screen.", md`
          ~~~js file=4c92d28:js/check.js lines=77-87
          ~~~
        `, [], { mermaidText: "parse every chart" }),
        arrow("Mermaid", "Check", "A parse error becomes one line in the list.", "", [], { mermaidText: "errors, if any" }),
        arrow("Nav", "Mermaid", "show() draws the view the reader opened.", "", [], { mermaidText: "render the view" }),
        arrow("Nav", "Bind", "The wiring searches the picture for each note's shape.", "", [], { mermaidText: "wire the shapes" }),
        arrow("Bind", "Nav", "The notes it could not place come back, instead of being skipped silently.", md`
          This is the whole change to the wiring: collect the misses and return them.

          ~~~js file=4c92d28:js/bind.js lines=43-56
          ~~~
        `, [], { mermaidText: "what was not found" }),
        arrow("Nav", "Check", "Each draw replaces that view's draw result.", md`
          ~~~js file=4c92d28:js/nav.js lines=71-71
          ~~~
        `, [], { mermaidText: "reportDrawn" }),
      ],
    },

    answer: {
      tab: "problem",
      parent: null,
      title: "The mistake is listed",
      summary: "The page now tells whoever opens it what is wrong.",
      story: md`
        **The answer:** the typo went unnoticed because the page skipped a note it could not place and said nothing. Now both checks feed one list behind an amber [⚠ chip](#chip) by Find, and the console prints each problem once.

        An agent with a browser opens the file, walks every step, and fixes everything in the list. An agent without one still goes through the checklist in the format by hand, because nothing can show it the chip.

        **Check yourself:** an arrow names two shapes that both exist, but the chart has no arrow between them. Which check finds it, and when?
      `,
      chart: `flowchart LR
  writer["Agent<br><small>Writes the content file</small>"] --> content["diagrams.js<br><small>Notes keyed by shape id</small>"]
  content --> page["Page<br><small>Draws and checks</small>"]
  page --> chip["⚠ chip<br><small>Lists each mistake</small>"]
  chip --> writer`,
      nodeInteractions: {
        writer: { label: "Agent", kicker: "Who", tooltip: "Reads the list and fixes the content." },
        content: { label: "diagrams.js", kicker: "File", tooltip: "The content, fixed until the list is empty." },
        page: { label: "Page", kicker: "Engine", tooltip: "Runs both checks." },
        chip: {
          label: "⚠ chip",
          kicker: "New",
          tooltip: "Shows only when there is a problem, with a count.",
          body: md`
            The answer to the question in the story: only the draw check finds it, and only once that step has been drawn. Text alone shows both ids exist, so the content check is satisfied.
          `,
        },
      },
      edgeInteractions: [
        arrow("writer", "content", "The agent writes the content."),
        arrow("content", "page", "The page draws it and runs the checks."),
        arrow("page", "chip", "Every problem goes to one list."),
        arrow("chip", "writer", "The agent reads the list and fixes the content."),
      ],
    },
  },
};

packFile("4c92d28:js/bind.js", `
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
uRcAAA==
`);
packFile("4c92d28:js/check.js", `
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
AA==
`);
packFile("4c92d28:js/nav.js", `
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
`);
