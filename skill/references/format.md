# Content format

One explanation is one content file. It is a classic script that sets `window.DIAGRAMS`. The engine loads before it, so `arrow()` and `md` are already defined. The engine reads nothing else from the content file.

This is the only description of the format. The repo docs link here.

Each explanation is its own file, and the page shows the one named in the link ([ADR-034](https://github.com/overmesgit/mermaid-interactive/blob/main/docs/decisions/034-pick-the-content-file.md)). [`examples/starter.js`](https://github.com/overmesgit/mermaid-interactive/blob/main/examples/starter.js) is a one-diagram file to copy. [`examples/pr-checks.js`](https://github.com/overmesgit/mermaid-interactive/blob/main/examples/pr-checks.js) explains a real commit in four steps, with code from that commit.

## Start here

1. **Write `diagrams.js`.** Usually one tab with a lesson: a view per step, and notes on the shapes and arrows that matter. The sections below describe every field. The [example](#example) is a complete file to copy from.
2. **Put it into the page.** The skill's `assets/explainer.html` is the whole page with one line, `/* DIAGRAMS */`, where the content goes. The command below copies the page with your content file in place of that line. Run it from the root of the repo the explanation is about, because that is where the `file=` paths start. Set `skill` to the skill's folder and `content` to your content file. Every file a note names is packed in whole, as gzip and base64. See [Code files](#code-files).

   ```bash
   {
     sed -e '/^\/\* DIAGRAMS \*\/$/r '"$content" -e '/^\/\* DIAGRAMS \*\/$/d' "$skill/assets/explainer.html"
     sed -n 's/^[[:space:]]*~~~.*[[:space:]]file=\([^[:space:]]*\).*/\1/p' "$content" | sort -u |
     while read -r f; do
       printf '<script type="application/gzip" data-file="%s">\n' "$f"
       case "$f" in
         *:*) git show "$f" ;;
         *)   cat "$f" ;;
       esac | gzip -cn | base64
       printf '</script>\n'
     done
   } > explanation.html
   ```

   It needs a POSIX shell: Linux, macOS, or Git Bash on Windows. With no `file=` fences it packs no files.
3. **Look at it.** Open `explanation.html` in a browser. It opens from disk and needs no server, but it loads Mermaid from the network. An amber ⚠ chip by Find means the page found mistakes. Click it for the list. Walk every lesson step and open every inner diagram, because an arrow is only checked once its diagram is drawn. After an edit, run step 2 again and reload. Skip this if you cannot open a browser.
4. **Check it** against [the checklist](#check-before-handing-it-over). If you could not open a browser, this is the only check. A mistake does not stop the page. It only leaves a shape that does nothing on click.
5. **Hand over `explanation.html`.** Publishing it somewhere is a separate step, and this skill does not choose the host.

The template is described in [ADR-037](https://github.com/overmesgit/mermaid-interactive/blob/main/docs/decisions/037-fill-a-template.md).

Inside this repo there is a quicker loop for step 3. Serve the repo folder with `python3 -m http.server 8765`, then open `http://127.0.0.1:8765/?src=` followed by the content file's path, like `?src=examples/starter.js`. Reload after each edit. No join is needed, and files named with `file=` are read from the server.

## Shape

```js
window.DIAGRAMS = {
  tabs: [ /* tab */ ],
  views: { /* viewId: view */ },
};
```

## Tab

| Field | Meaning |
| --- | --- |
| `id` | The viewId the tab opens. It must be a key in `views`. The first tab opens when the link has no hash. |
| `label` | The tab button text. |
| `lesson` | Optional. View ids in teaching order. Prev, Next, and the arrow keys walk them. |

An explanation is usually one tab with a lesson, whether it covers a concept, a subsystem, or a change. A second tab is for a second subject, not for the next step.

## View

| Field | Meaning |
| --- | --- |
| `viewId` | The same string as its key in `views`. It is the hash segment in the link. |
| `tab` | The tab id it belongs to. A drill view uses its tab's id too. |
| `parent` | The viewId this view was drilled from, or `null`. It builds the breadcrumb. Escape and Backspace go up to it. A lesson step has `parent: null`. |
| `title` | The breadcrumb text. The Next button shows the next step's title. |
| `summary` | One sentence under the title. |
| `story` | Optional. Markdown, like a note. The side panel shows it when nothing is selected, above a list of the view's shapes and arrows. Say what the diagram shows and why, so a reader can follow it without opening every shape. Put a part's card where the text talks about it, with a [link to the part](#links-to-parts). |
| `chart` | The Mermaid source. Mermaid is the only reader. |
| `nodeInteractions` | An object keyed by chartId. |
| `edgeInteractions` | An array, one entry per arrow. |

## Chart types

The first line of `chart` picks the matcher. Only these four are clickable:

| First line | chartId is |
| --- | --- |
| `flowchart` | The node id. `api` in `api["API"]`. |
| `C4Context`, `C4Container`, and the other `C4` types | The alias. `reader` in `Person(reader, "Reader")`. |
| `sequenceDiagram` | The participant id. `Web` in `participant Web as Web app`. |
| `stateDiagram-v2` | The state id. `HandedOff` in `state "Handed off" as HandedOff`. |

Any other Mermaid type still draws. Nothing on it is clickable.

In a flowchart, an image node, `a@{ img: "...", label: "..." }`, and an icon node, `a@{ icon: "fa:user", label: "..." }`, are clickable like any other node. An image can be a `data:` URI, so it needs no file next to the page. An icon only draws when the page has its icon pack, which this page does not load, so it shows a `?`.

Some ids are words Mermaid reserves, so the whole chart fails to draw. A state cannot be called `Note` in any case, because `note` starts a sticky note. A flowchart node cannot be called `end`. Give the shape another id and keep the word as its name: `state "Note" as Selected`.

## Captions

A reader should be able to follow a diagram without clicking every shape. So give each shape a short caption under its name, in the Mermaid label:

```
api["API<br><small>Loads the session before each handler</small>"]
```

The caption is part of the picture, so Mermaid sizes the box to fit it and wraps long text. The page shows it in a quieter color. Keep it to a few words that say what the shape does in this diagram. The tooltip and the note can then say more.

This works in flowcharts. A label cannot contain `"`.

## Side by side

When a step compares two things, such as the code before a change and after it, draw both in one chart, next to each other. On two steps, the reader has to keep the first in mind to see the change ([ADR-046](https://github.com/overmesgit/mermaid-interactive/blob/main/docs/decisions/046-side-by-side-in-one-chart.md)).

Use a flowchart with one `subgraph` per side, and join the two subgraphs with an invisible link, `~~~`, so Mermaid puts them next to each other. One chart cannot have two shapes with the same id, so each side uses its own ids. Mark what changed with `status`.

```
flowchart LR
  subgraph before["Before"]
    direction TB
    oldApi["API"] --> oldDb[("Postgres")]
  end
  subgraph after["After"]
    direction TB
    newApi["API"] --> redis[("Redis")]
    newApi --> newDb[("Postgres")]
  end
  before ~~~ after
```

Here `redis` would get `status: "new"` and `newApi` `status: "changed"`.

## Node interaction

The key is the chartId. Do not repeat it inside the object.

| Field | Meaning |
| --- | --- |
| `label` | The panel title. Arrows use it to name their ends. |
| `tooltip` | One sentence on hover. It is also the panel's lead line. |
| `kicker` | One word above the title, such as `Service` or `Changed`. |
| `body` | The panel note, in markdown. |
| `facts` | Rows of `[term, value]` under the note. |
| `opensView` | Optional. The viewId that double-click or the ↘ badge opens. |
| `status` | Optional. `new`, `changed`, `removed`, or `problem`. The shape is colored green, amber, gray and dashed, or red, and the word shows in the panel, on its card, and in a legend under the summary. |
| `weight` | Optional. `key` for a part that carries the point, which gets a heavy outline. `background` for a part that is only context, which gets a pale box. |

Every part looking the same tells the reader nothing, so say which parts matter ([ADR-043](https://github.com/overmesgit/mermaid-interactive/blob/main/docs/decisions/043-status-and-weight.md)). Mark the change with `status` and the point with `weight`. Leave most parts with neither.

The page adds two marks by itself. A shape whose note has a `body` or `facts` gets a small dot, so the reader can see what is worth opening. On a lesson step, a part the step adds gets `status: "new"` unless you gave it one, but only when the step shares a part with the step before.

## Edge interaction

An entry is `[from, to]`, or the object `arrow()` returns:

```js
arrow(from, to, tooltip, body, facts, more)
```

`from` and `to` are chartIds. `more` merges extra fields: `mermaidText`, `label`, `opensView`, `status`, and `weight`. Without a `label`, the panel title is `From → To`, made from the two node labels.

Say what an arrow means in its label on the picture, as in `api -- reads --> db`. Most arrows need nothing more. Write those as `[from, to]`, so hover still lights them. Give an arrow a `body` only when it has real detail, such as code. The list under the story leaves out arrows with no `body`, `facts`, `opensView`, or `status`.

How an arrow is found depends on the chart type:

- **Flowchart.** By `from` and `to`. The chart must draw that arrow as `from --> to`, with any arrow style or label. Two arrows between the same pair are taken in order. Do not give an arrow an id, as in `from e1@--> to`. Mermaid then names the arrow after the id, so the page cannot find it. The page animates lit arrows itself, so the id is not needed for that.
- **Sequence.** By `mermaidText`, which is required. The message text must equal it, or start with it. Case and spacing are ignored. Two messages with the same text are taken in source order.
- **C4.** By `mermaidText`, the same way. The text is the relationship label, `"Reads"` in `Rel(api, db, "Reads")`.
- **State.** By position. The engine finds the nearest wired state at each end of the path, so both ends need a node interaction. Write the start and end dots as `"*"`.

An arrow with `opensView` has no ↘ badge. Its tooltip should say to double-click.

## Notes

`body` is markdown. The panel renders paragraphs, headings, lists, blockquotes, code fences, inline code, bold, italic, `http`/`https` links, and [links to parts](#links-to-parts) of the view. HTML and images are dropped.

Write a note that holds code with the `md` tag and `~~~` fences. A backtick fence would end the JavaScript template. `md` strips the shared indent and does nothing else. For the same reason, inline code needs escaped backticks: write `` \`cache\` `` to show `cache`. `${` also needs escaping, as `\${`.

```js
body: md`
  The cache is checked before Postgres. A miss falls through and fills it.

  ~~~go
  if s, ok := cache.Get(id); ok {
      return s, nil
  }
  ~~~
`,
```

Code that exists as a file is named with `file=`, as in [Code files](#code-files). Write it in the note only when it is a short sketch that is in no file.

A fence like `~~~js source=show` prints a function the page has loaded. That only works for the engine's own code, which is how the How tab shows it. Code from the repo you explain is not loaded, so it would print `// name is not loaded`.

### Links to parts

A story or a note can point at a part of the same view with a link to `#` and its chartId. An arrow is `#from->to`.

```md
Every request starts in the browser.

[Web app](#web)

The [API](#api) loads the session, which costs one query per call.

[](#api->db)
```

- A line that holds only such links shows each part as a card in that place: the part's name and tooltip. The link text is not shown, so it can be empty, but the name keeps the source readable. Links on lines next to each other each get a card.
- A link inside a sentence shows as a link.
- Both open the part's note on click, and light the part in the picture on hover.
- A part shown as a card in the story is left out of the list under it.
- The view needs a note for the part. Two arrows between the same shapes are one part, and the link opens the first.

So a story can walk the picture: a sentence, the part it is about, the next sentence. On a lesson step, the arrows the step adds already flow in the picture, so the story can name them in the order they matter.

## Code files

The finished page carries its code inside it, compressed, because a page opened from disk cannot read files next to it. You do not copy or list the files. A note names a file from the repo, and the join in step 4 finds every name, reads each file, and packs it into the page whole ([ADR-030](https://github.com/overmesgit/mermaid-interactive/blob/main/docs/decisions/030-code-folder.md), [ADR-035](https://github.com/overmesgit/mermaid-interactive/blob/main/docs/decisions/035-code-from-the-repo.md)).

A note shows a file with an empty fence:

```md
~~~go file=api/session.go lines=40-58
~~~
```

- The path starts at the root of the repo, with `/` between folders. It cannot contain a space or `"`.
- `lines` is 1-based and inclusive. Leave it out to show the whole file. `grep -n` gives the numbers.
- `mark` highlights the lines that matter inside the ones shown: one line, a range, or a list, as in `mark=44-47,52`. Use it whenever the shown lines are more than the point, so the reader does not have to search ([ADR-045](https://github.com/overmesgit/mermaid-interactive/blob/main/docs/decisions/045-mark-lines-in-code.md)).
- The fence's language is used as written.

To show an older version, put a git revision and `:` before the path, as `git show` takes it: `file=main:api/session.go`. A diff cannot be shown. Show the old and the new version in two notes instead.

The lines are read when the page is joined. If the file may change before then, name the commit, as in `file=4f2c1e9:api/session.go`, so the lines stay where you wrote them.

The panel shows the lines under a header with the path and the range. Clicking the header switches to the whole file, with the range highlighted, and back. Several notes can point at the same file, and it is packed once.

While you preview with `?src=`, nothing is packed yet, so the page reads each file from the server. That works for files in the served repo. A revision path shows as missing until the join ([ADR-038](https://github.com/overmesgit/mermaid-interactive/blob/main/docs/decisions/038-code-files-in-preview-and-export.md)). The Export button packs the files too.

Do not paste the files into `diagrams.js`.

## Example

A change that adds a Redis session cache. Two lesson steps, before and after, and one drill into the new read path. The API note shows lines 12 to 24 of `api/session.go`.

```js
window.DIAGRAMS = {
  tabs: [
    { id: "before", label: "Session cache", lesson: ["before", "after"] },
  ],
  views: {
    before: {
      viewId: "before",
      tab: "before",
      parent: null,
      title: "Before",
      summary: "Every request reads the session from Postgres.",
      chart: `flowchart LR
  web["Web app"]
  api["API"]
  db[("Postgres")]
  web --> api
  api --> db`,
      nodeInteractions: {
        web: { label: "Web app", tooltip: "Sends the session cookie on every call.", kicker: "Client" },
        api: { label: "API", tooltip: "Loads the session before each handler.", kicker: "Service" },
        db: { label: "Postgres", tooltip: "Holds the sessions table.", kicker: "Store" },
      },
      edgeInteractions: [
        arrow("web", "api", "Each call carries the cookie.", "Nothing about this hop changes in the PR."),
        arrow("api", "db", "One session query per request.", "This is the load the PR removes.", [["Query", "sessions by id"]]),
      ],
    },
    after: {
      viewId: "after",
      tab: "before",
      parent: null,
      title: "After",
      summary: "The API asks Redis first. Postgres is read only on a miss.",
      chart: `flowchart LR
  web["Web app"]
  api["API"]
  redis[("Redis")]
  db[("Postgres")]
  web --> api
  api --> redis
  api -- miss --> db`,
      nodeInteractions: {
        web: { label: "Web app", tooltip: "Unchanged.", kicker: "Client" },
        api: {
          label: "API",
          tooltip: "Reads the session through the cache. Double-click for the read path.",
          kicker: "Changed",
          body: md`
            loadSession now checks Redis first.

            ~~~go file=api/session.go lines=12-24
            ~~~
          `,
          facts: [["File", "api/session.go"]],
          opensView: "read-path",
        },
        redis: { label: "Redis", tooltip: "New. Caches sessions for 15 minutes.", kicker: "New" },
        db: { label: "Postgres", tooltip: "Still the source of truth.", kicker: "Store" },
      },
      edgeInteractions: [
        arrow("web", "api", "Unchanged.", ""),
        arrow("api", "redis", "Checked first.", "A hit returns without touching Postgres.", [["TTL", "15 minutes"]]),
        arrow("api", "db", "Only on a miss.", "The result is written back to Redis.", [], { label: "API → Postgres (miss)" }),
      ],
    },
    "read-path": {
      viewId: "read-path",
      tab: "before",
      parent: "after",
      title: "Read path",
      summary: "One request, cache miss.",
      chart: `sequenceDiagram
  participant API
  participant Redis
  participant DB as Postgres
  API->>Redis: GET session
  Redis-->>API: miss
  API->>DB: SELECT session
  DB-->>API: row
  API->>Redis: SET session`,
      nodeInteractions: {
        API: { label: "API", tooltip: "Runs loadSession.", kicker: "Participant" },
        Redis: { label: "Redis", tooltip: "Empty for this id.", kicker: "Participant" },
        DB: { label: "Postgres", tooltip: "Answers the miss.", kicker: "Participant" },
      },
      edgeInteractions: [
        arrow("API", "Redis", "Cache lookup.", "", [], { mermaidText: "GET session" }),
        arrow("Redis", "API", "Not cached yet.", "", [], { mermaidText: "miss" }),
        arrow("API", "DB", "Fallback read.", "", [], { mermaidText: "SELECT session" }),
        arrow("DB", "API", "The session row.", "", [], { mermaidText: "row" }),
        arrow("API", "Redis", "Fill the cache.", "The next request is a hit.", [], { mermaidText: "SET session" }),
      ],
    },
  },
};
```

## Check before handing it over

A mistake does not stop the page. It leaves a shape or an arrow that does nothing on click. So the page checks the content, and an amber ⚠ chip by Find counts the problems. Click it for the list. The console lists them too.

1. Every `nodeInteractions` key appears as a chartId in that view's chart.
2. Every flowchart edge interaction matches an arrow drawn from `from` to `to`.
3. Every sequence and C4 edge interaction has a `mermaidText` that appears in the chart.
4. Both ends of every state edge interaction have a node interaction, or are `"*"`.
5. Every `opensView`, `parent`, tab `id`, and `lesson` entry is a viewId in `views`.
6. Every view's `viewId` equals its key.
7. `diagrams.js` does not contain `</script`. It goes into the page as the body of a script tag. Code files named with `file=` may contain it.
8. Every `file=` names a file in the repo, or a revision that has it, and its `lines` range ends inside that file.
9. Every link to a part, like `[API](#api)`, names a shape or an arrow that has a note in the same view.
10. No flowchart arrow has an id, like `e1@-->`.
11. Every `status` and `weight` is one of the values above.
12. Every `mark` is inside the lines its fence shows.

On load the page runs checks 1, 3 to 6, and 8 to 12 on every view, and tries to parse every chart. After each draw it also lists every shape and arrow it could not find in the picture, which covers check 2 for the views drawn so far. An agent that cannot open a browser checks by hand. One that can opens each step once, so every view is drawn, and reads the list ([ADR-029](https://github.com/overmesgit/mermaid-interactive/blob/main/docs/decisions/029-join-and-check-in-page.md)).
