// A starting point for a new explanation. Copy this file, then open the copy in the editor.
// The format is skill/references/format.md.

window.DIAGRAMS = {
  tabs: [
    { id: "start", label: "Start" },
  ],
  views: {
    start: {
      tab: "start",
      parent: null,
      title: "Start",
      summary: "A web app calls an API, and the API reads a database.",
      story: md`
        Replace this diagram with your own. Each shape's note is keyed by the id in the Mermaid text, like web in web["Web app"].

        The story links each part that has more to read, where it talks about it, like the [API](#api), [the call from the web app](#web->api), and [the session query](#api->db).
      `,
      chart: `flowchart LR
  web["Web app<br><small>Sends the session cookie</small>"]
  api["API<br><small>Loads the session</small>"]
  db[("Postgres<br><small>Holds the sessions</small>")]
  web --> api
  api --> db`,
      nodeInteractions: {
        web: { label: "Web app", tooltip: "Sends the session cookie on every call.", kicker: "Client" },
        api: { label: "API", tooltip: "Loads the session before each handler.", kicker: "Service" },
        db: { label: "Postgres", tooltip: "Holds the sessions table.", kicker: "Store" },
      },
      edgeInteractions: [
        arrow("web", "api", "Each call carries the cookie.", "A longer note for the panel, in markdown."),
        arrow("api", "db", "One session query per request.", "", [["Query", "sessions by id"]]),
      ],
    },
  },
};
