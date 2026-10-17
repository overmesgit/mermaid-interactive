// A PR-style explanation of commit 4c92d28, which made the page check its own content.
// Written with skill/SKILL.md, as an agent would. Pack it from the repo root, because its code notes name files at that commit.
// examples/pr-checks.packed.js is this file packed, so the preview page can show its code. Pack it again after editing this file.

window.DIAGRAMS = {
  tabs: [
    { id: "problem", label: "Page checks", lesson: ["problem", "two-checks", "run", "answer"] },
  ],
  views: {
    problem: {
      viewId: "problem",
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
      viewId: "two-checks",
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
      viewId: "run",
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
      viewId: "answer",
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
