# Content format

One explanation is one content file. It is a classic script that sets `window.DIAGRAMS`. The engine loads before it, so `arrow()` and `md` are already defined. The engine reads nothing else from the content file.

This is the only description of the format. The repo docs link here.

Each explanation is its own file, and the page shows the one named in the link ([ADR-034](../../docs/decisions/034-pick-the-content-file.md)). [`examples/starter.js`](../../examples/starter.js) is a one-diagram file to copy.

## Start here

1. **Write `diagrams.js`.** Usually one tab with a lesson: a view per step, and notes on the shapes and arrows that matter. The sections below describe every field. The [example](#example) is a complete file to copy from.
2. **Put the code the notes show in `code/`,** next to `diagrams.js`. See [Code files](#code-files). Skip this if the notes show no code from files.
3. **Look at it.** Serve the repo folder with `python3 -m http.server 8765`, then open `http://127.0.0.1:8765/?src=` followed by the file's path from the repo folder, like `?src=examples/starter.js`. Reload after each edit. Skip this if you cannot open a browser.
4. **Check it** against [the checklist](#check-before-handing-it-over). A mistake does not stop the page. It only leaves a shape that does nothing on click.
5. **Join it into one HTML file.** Without a `code/` folder:

   ```bash
   cat skill/assets/head.html diagrams.js skill/assets/tail.html > explanation.html
   ```

   With a `code/` folder, each file is also packed in, as gzip and base64:

   ```bash
   {
     cat skill/assets/head.html diagrams.js skill/assets/tail.html
     (cd code && find . -type f | sort | while read -r f; do
       printf '<script type="application/gzip" data-file="%s">\n' "${f#./}"
       gzip -cn "$f" | base64
       printf '</script>\n'
     done)
   } > explanation.html
   ```

   Both need a POSIX shell: Linux, macOS, or Git Bash on Windows.
6. **Hand over `explanation.html`.** Publishing it somewhere is a separate step, and this skill does not choose the host.

Step 5 does not work yet. Until it does, the page's Export HTML button saves the file you are looking at as one HTML file. `head.html` and `tail.html` are not built ([ADR-029](../../docs/decisions/029-join-and-check-in-page.md)).

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

A PR explanation is usually one tab with a lesson. A second tab is for a second subject, not for the next step.

## View

| Field | Meaning |
| --- | --- |
| `viewId` | The same string as its key in `views`. It is the hash segment in the link. |
| `tab` | The tab id it belongs to. A drill view uses its tab's id too. |
| `parent` | The viewId this view was drilled from, or `null`. It builds the breadcrumb. Escape and Backspace go up to it. A lesson step has `parent: null`. |
| `title` | The breadcrumb text. The Next button shows the next step's title. |
| `summary` | One sentence under the title. |
| `story` | Optional. Markdown, like a note. The side panel shows it when nothing is selected, above a list of the view's shapes and arrows. Say what the diagram shows and why, so a reader can follow it without opening every shape. |
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

Some ids are words Mermaid reserves, so the whole chart fails to draw. A state cannot be called `Note` in any case, because `note` starts a sticky note. A flowchart node cannot be called `end`. Give the shape another id and keep the word as its name: `state "Note" as Selected`.

## Captions

A reader should be able to follow a diagram without clicking every shape. So give each shape a short caption under its name, in the Mermaid label:

```
api["API<br><small>Loads the session before each handler</small>"]
```

The caption is part of the picture, so Mermaid sizes the box to fit it and wraps long text. The page shows it in a quieter color. Keep it to a few words that say what the shape does in this diagram. The tooltip and the note can then say more.

This works in flowcharts. A label cannot contain `"`.

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

## Edge interaction

An entry is `[from, to]`, or the object `arrow()` returns:

```js
arrow(from, to, tooltip, body, facts, more)
```

`from` and `to` are chartIds. `more` merges extra fields: `mermaidText`, `label`, and `opensView`. Without a `label`, the panel title is `From → To`, made from the two node labels.

How an arrow is found depends on the chart type:

- **Flowchart.** By `from` and `to`. The chart must draw that arrow as `from --> to`, with any arrow style or label. Two arrows between the same pair are taken in order.
- **Sequence.** By `mermaidText`, which is required. The message text must equal it, or start with it. Case and spacing are ignored. Two messages with the same text are taken in source order.
- **C4.** By `mermaidText`, the same way. The text is the relationship label, `"Reads"` in `Rel(api, db, "Reads")`.
- **State.** By position. The engine finds the nearest wired state at each end of the path, so both ends need a node interaction. Write the start and end dots as `"*"`.

An arrow with `opensView` has no ↘ badge. Its tooltip should say to double-click.

## Notes

`body` is markdown. The panel renders paragraphs, headings, lists, blockquotes, code fences, inline code, bold, italic, and `http`/`https` links. HTML and images are dropped.

Write a note that holds code with the `md` tag and `~~~` fences. A backtick fence would end the JavaScript template. `md` strips the shared indent and does nothing else.

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

Code that exists as a file comes from the code folder. Write it in the note only when it is a short sketch that is in no file.

A fence like `~~~js source=show` prints a function the page has loaded. That only works for the engine's own code, which is how the How tab shows it. Code from a PR is not loaded, so it would print `// name is not loaded`.

## Code files

Put the files the explanation needs in a `code/` folder next to `diagrams.js`. The layout is yours. A file can be a whole source file, the part that matters, an older version, or a `.diff`.

```
code/
  api/session.go
  api/session.go.diff
  old/session.go
```

A note shows a file with an empty fence:

```md
~~~go file=api/session.go lines=40-58
~~~
```

- The path is relative to `code/`, with `/` between folders, and no `"`.
- `lines` is 1-based and inclusive. Leave it out to show the whole file. `grep -n` gives the numbers.
- The fence's language is used as written. Use `diff` for a `.diff` file.

The panel shows the snippet under a header with the path and the lines. Clicking the header opens the whole file, with that range highlighted. Several notes can point at the same file.

The files are packed into the page when it is joined ([ADR-030](../../docs/decisions/030-code-folder.md)). Do not paste them into `diagrams.js`.

## Example

A change that adds a Redis session cache. Two lesson steps, before and after, and one drill into the new read path. The API note shows lines 12 to 24 of `code/api/session.go`.

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

Today a miss is silent. The shape draws, and nothing happens on click.

1. Every `nodeInteractions` key appears as a chartId in that view's chart.
2. Every flowchart edge interaction matches an arrow drawn from `from` to `to`.
3. Every sequence and C4 edge interaction has a `mermaidText` that appears in the chart.
4. Both ends of every state edge interaction have a node interaction, or are `"*"`.
5. Every `opensView`, `parent`, tab `id`, and `lesson` entry is a viewId in `views`.
6. Every view's `viewId` equals its key.
7. `diagrams.js` does not contain `</script`. It is joined into the page as the body of a script tag. Files in `code/` may contain it.
8. Every `file=` names a file in `code/`, and its `lines` range ends inside that file.

[ADR-029](../../docs/decisions/029-join-and-check-in-page.md) and [ADR-030](../../docs/decisions/030-code-folder.md) make the page run checks 1 to 6 and 8 on load, and list every interaction it could not wire after each draw. A problem shows as a warning on the page. Until that is built, check by hand. An agent that cannot open a browser always checks by hand.
