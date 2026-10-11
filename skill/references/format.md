# Content format

One explanation is one content file. It is a classic script that sets `window.DIAGRAMS`. The engine loads before it, so `arrow()` and `md` are already defined. The engine reads nothing else from the content file.

This is the only description of the format. The repo docs link here.

Status: [ADR-026](../../docs/decisions/026-content-file.md) moves the helpers into the engine and gives each explanation its own file. That split is not built yet. Today the sample content and the helpers both live in `diagrams.js`. The fields below are the ones the engine reads today.

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

Paste the code into the note. A fence like `~~~js source=show` prints a function the page has loaded. That only works for the engine's own code, which is how the How tab shows it. Code from a PR is not loaded, so it would print `// name is not loaded`.

## Example

A change that adds a Redis session cache. Two lesson steps, before and after, and one drill into the new read path.

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

            ~~~go
            if s, ok := cache.Get(id); ok {
                return s, nil
            }
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

A miss here is silent. The shape draws, and nothing happens on click.

1. Every `nodeInteractions` key appears as a chartId in that view's chart.
2. Every flowchart edge interaction matches an arrow drawn from `from` to `to`.
3. Every sequence and C4 edge interaction has a `mermaidText` that appears in the chart.
4. Both ends of every state edge interaction have a node interaction, or are `"*"`.
5. Every `opensView`, `parent`, tab `id`, and `lesson` entry is a viewId in `views`.
6. Every view's `viewId` equals its key.

[ADR-027](../../docs/decisions/027-one-file-from-a-template.md) makes `scripts/build.py` run these checks. Until it exists, check by hand.
