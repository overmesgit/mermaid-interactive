const HOW_BOX = {
  writer: {
    label: "Author or agent",
    caption: "Writes the explanation",
    tooltip: "Whoever writes the explanation: a person by hand, or an agent.",
    kicker: "Who",
    body: md`
      Someone has to decide what the reader should see, in what order, and what each shape means. That is the only part that changes from one explanation to the next, because the page that draws it is the same every time.

      A person edits the file and reloads the page. An agent cannot see the page, so it works from the written format instead. That is why the format lives in one file that both can read.
    `,
    facts: [["Format", "skill/references/format.md"]],
  },
  content: {
    label: "Content file",
    caption: "Every diagram and every note, in one script",
    tooltip: "One script that holds every diagram and every note.",
    kicker: "Data",
    body: md`
      An explanation needs two things for each diagram: the picture, and what to say about each part of it. Both live in one file, so the explanation can be written, reviewed, and handed over as one thing.

      The file sets window.DIAGRAMS. It lists tabs and views. A view is one diagram: its Mermaid text, plus notes for its shapes and arrows. A note is keyed by the id written in the Mermaid text, so the page can find which shape it belongs to. For example, the shape web["Web app"] gets the note under the key web:

      ~~~js
      chart: \`flowchart LR
        web["Web app"] --> api["API"]\`,
      nodeInteractions: {
        web: { label: "Web app", tooltip: "Sends the session cookie.", kicker: "Client" },
      },
      edgeInteractions: [
        arrow("web", "api", "Each call carries the cookie.", "Nothing here changes in the PR."),
      ],
      ~~~

      The two helpers, arrow() and md, are part of the page, so a content file holds only the explanation. The page you are reading is drawn from diagrams.js. A link with ?src= and another file's path draws that file instead.
    `,
    facts: [["File", "diagrams.js"], ["Format", "skill/references/format.md"]],
  },
  mmd: {
    label: "Mermaid",
    caption: "Turns each diagram's text into a picture",
    tooltip: "Turns the Mermaid text into a picture. It never sees the notes.",
    kicker: "Library",
    body: md`
      Drawing boxes and arrows by hand would be a lot of work, so the page lets Mermaid do it. Mermaid only gets the diagram's text. Mermaid's own click handling is turned off (securityLevel is strict), so the page adds its clicks to the finished picture instead. That way flowcharts, C4, sequence, and state diagrams all get the same panel.

      Double-click this box to walk the function that draws one view.

      ~~~js
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        flowchart: { htmlLabels: true, useMaxWidth: false },
      });
      ~~~
    `,
    opensView: "how-show",
    facts: [["Function", "show"], ["File", "js/nav.js"], ["Setup", "js/boot.js"]],
  },
  picture: {
    label: "Picture",
    caption: "The SVG Mermaid drew",
    tooltip: "The SVG Mermaid drew, placed in the page.",
    kicker: "DOM",
    body: md`
      Mermaid returns the picture as SVG text. The page puts it on screen and sizes it from its own dimensions, so later zooming starts from the real size. At this point nothing in it reacts to the mouse. The next step adds that.

      ~~~js source=show
      ~~~
    `,
    facts: [["Element", "#camera"]],
  },
  app: {
    label: "Matcher",
    caption: "Finds each note's shape, then listens on it",
    tooltip: "Finds the shape Mermaid drew for each note, then listens on it.",
    kicker: "Code",
    body: md`
      A note says "web", but the picture only has the shapes Mermaid drew, under Mermaid's own names. So the page has to find the right shape for each note before anything can be clicked.

      Mermaid names shapes differently in each chart type, so the first line of the Mermaid text picks one rule. For example, in a flowchart the note api matches the shape whose id ends in flowchart-api-3. A shape smaller than 8 by 8 pixels is skipped. Arrows are harder, and have their own rules.

      ~~~js source=findMermaidShapes
      ~~~
    `,
    facts: [["Shapes", "js/mermaid-svg.js"], ["Listeners", "js/bind.js"]],
  },
  hover: {
    label: "Hover",
    caption: "Lights what the shape connects to",
    tooltip: "Shows the tooltip and keeps the neighbors solid.",
    kicker: "Input",
    body: md`
      When you point at a shape, the shapes and arrows it connects to stay solid and the rest fade a little. This shows what a shape talks to without opening anything.

      The fade is light on purpose, because a heavy fade hid the rest of the picture. Moving away puts back the search filter, if there is one, because search uses the same fade.

      ~~~js source=highlightAround
      ~~~
    `,
    facts: [["Function", "highlightAround"], ["Fade", "opacity 0.72"]],
  },
  tap: {
    label: "Panel",
    caption: "Shows the full note on click",
    tooltip: "A click opens the side panel with this shape's notes.",
    kicker: "Input",
    body: md`
      A tooltip holds one sentence. Most shapes need more, so a click opens a side panel with the full note, the facts, and links to the connected shapes and arrows.

      The picture stays where it is, because jumping would lose your place. It only slides when the panel would cover the shape you clicked. The clicked shape is outlined, so you can see what the panel is about.

      With nothing selected, the panel shows the story of the whole diagram and a list of its parts. From a note, Back returns to it.

      ~~~js source=onInteractionClick,openPanel,openStory
      ~~~
    `,
    facts: [["Function", "openPanel"], ["File", "js/panel.js"]],
  },
  another: {
    label: "Inner diagram",
    caption: "Double-click draws a different diagram",
    tooltip: "A different diagram, drawn from scratch.",
    kicker: "Drill",
    body: md`
      Some shapes are too big to explain in one picture. For example, the API box can have its own diagram of the parts inside it. The content file says so with opensView, and the shape gets a ↘ badge.

      A double-click, or the badge, draws that diagram. While Mermaid draws, the old picture zooms toward the shape and fades, so you see where the new one came from. Each diagram keeps its own zoom, so stepping back up puts you where you were. Escape and Backspace step up.

      ~~~js source=onInteractionDblClick
      ~~~
    `,
    facts: [["Field", "opensView"], ["Function", "show"]],
  },
  cam: {
    label: "Camera",
    caption: "The wheel zooms this picture only",
    tooltip: "The wheel, + and −, and dragging move over the same picture.",
    kicker: "Camera",
    body: md`
      Zooming in on a picture and opening another diagram are different jobs. So the wheel and the + and − buttons only scale this picture. They never open an inner diagram. Dragging empty space moves it. Fit puts the whole picture back in the window.

      The scale stays between 0.35 and 2.6, and it grows around the pointer, so the spot under the mouse stays put.

      ~~~js source=zoomAt,applyCam
      ~~~
    `,
    facts: [["Function", "zoomAt"], ["Range", "0.35 to 2.6"], ["File", "js/camera.js"]],
  },
  lesson: {
    label: "Lesson",
    caption: "The order to read the diagrams in",
    tooltip: "The order to read the diagrams in.",
    kicker: "Path",
    body: md`
      A reader who opens the link cold needs a path, not a pile of diagrams. So a tab can list its diagrams in reading order. Prev, Next, and the ← and → keys step through them.

      Each step usually redraws the one before and adds one piece, as this tab does. Opening an inner diagram keeps your place, so Next continues from the step you left.

      ~~~js
      { id: "how", label: "How", lesson: ["how", "how-draw", "how-match", ...] }
      ~~~

      ~~~js source=lessonStep,showLesson
      ~~~
    `,
    facts: [["Field", "tab.lesson"], ["File", "js/nav.js"]],
  },
  file: {
    label: "One HTML file",
    caption: "Export saves it all as one file",
    tooltip: "Export HTML saves the whole explanation as one file.",
    kicker: "Output",
    body: md`
      An explanation is meant to be shared, for example as a link in a pull request. One file is easy to attach or host, so Export HTML copies the styles, the content file, and the page's scripts into a single page. The file opens on the diagram you were looking at.

      Export reads those files over HTTP, so it needs the local server. Mermaid and marked still load from the network.

      ~~~js source=exportHtml
      ~~~
    `,
    facts: [["Function", "exportHtml"], ["File", "js/export.js"]],
  },
};

const HOW_ARROW = {
  write: arrow(
    "writer",
    "content",
    "Everything about one explanation goes in this file.",
    md`
      The page is the same for every explanation, so this file is the only thing a writer touches. A person reloads the page to see a change. An agent follows the written format.
    `,
    [["Format", "skill/references/format.md"]],
  ),
  draw: arrow(
    "content",
    "mmd",
    "Only the Mermaid text is passed to Mermaid.",
    md`
      Each view's Mermaid text goes to mermaid.render. The notes stay in JavaScript, because Mermaid has no place for a panel note.

      ~~~js source=show
      ~~~
    `,
    [["Call", "mermaid.render"]],
  ),
  drawn: arrow(
    "mmd",
    "picture",
    "Mermaid returns the picture as SVG text.",
    md`
      Drawing takes a moment. If you move to another diagram before it finishes, the late picture is thrown away, so it cannot cover the diagram you are now on.

      ~~~js source=show
      ~~~
    `,
    [["Guard", "app.renderToken"]],
  ),
  toApp: arrow(
    "content",
    "app",
    "The notes say which ids to look for.",
    md`
      The matcher reads the notes of the diagram on screen. Shapes come first, then arrows, because state diagram arrows are found by the positions of shapes already matched.

      ~~~js source=bindNodeInteractions
      ~~~
    `,
    [["Order", "shapes, then arrows"]],
  ),
  fromPic: arrow(
    "picture",
    "app",
    "The picture is where they are looked for.",
    md`
      The matcher only runs once the picture is on screen and the camera is placed, because some arrows are matched by where they sit on screen.

      ~~~js source=chartKind
      ~~~
    `,
    [["Function", "findMermaidShapes"]],
  ),
  toHover: arrow(
    "app",
    "hover",
    "Each matched shape listens for the pointer.",
    md`
      The tooltip is the page's own box, not Mermaid's. It follows the pointer and flips to the other side near the edge of the window.

      ~~~js source=showTooltip,placeTooltip
      ~~~
    `,
    [["Function", "showTooltip"]],
  ),
  toTap: arrow(
    "app",
    "tap",
    "Shapes and arrows share one click handler.",
    md`
      An arrow can have a note too, so it gets the same listeners as a shape. Tab moves between shapes and arrows, and Enter opens the panel, so the page also works without a mouse.

      ~~~js source=makeInteractive
      ~~~
    `,
    [["Function", "makeInteractive"]],
  ),
  toNext: arrow(
    "tap",
    "another",
    "A double-click opens the inner diagram instead.",
    md`
      The first click of a double-click has already opened the panel. The double-click then draws the inner diagram, which closes the panel on the way. If the shape has no inner diagram, the double-click just opens the panel.

      ~~~js source=onInteractionDblClick
      ~~~
    `,
    [["Function", "onInteractionDblClick"]],
  ),
  toCam: arrow(
    "picture",
    "cam",
    "The wheel scales this picture. It does not open another one.",
    md`
      The wheel and the buttons change the scale around one point: the pointer for the wheel, the middle of the window for the buttons.

      ~~~js source=zoomAt,zoomBy
      ~~~
    `,
    [["Function", "zoomAt"]],
  ),
  toLesson: arrow(
    "content",
    "lesson",
    "The tab's lesson field lists the steps in order.",
    md`
      A lesson step is a normal view with no parent. Prev and Next sit at the bottom of the diagram, and Next shows the title of the step it goes to.

      ~~~js source=renderLesson
      ~~~
    `,
    [["Field", "tab.lesson"]],
  ),
  toFile: arrow(
    "content",
    "file",
    "The content file is copied into the export.",
    md`
      Export copies every local script the page loaded, in page order, and the content file is one of them. So the exported file holds the same explanation you see.

      ~~~js source=localScripts
      ~~~
    `,
    [["List", "the script list in index.html"]],
  ),
  appToFile: arrow(
    "app",
    "file",
    "The page's own scripts are copied in too.",
    md`
      The matcher and the rest of the page go into the file with the content. So the exported file works on its own, without the repo next to it.
    `,
    [["Folder", "js/"]],
  ),
};

// A How box drawn with its caption under the name, so the picture reads without opening every box.
function howNode(id) {
  const { label, caption } = HOW_BOX[id];
  return `${id}["${label}<br><small>${caption}</small>"]`;
}

function box(id, extra) {
  return { ...HOW_BOX[id], ...(extra || {}) };
}

// A lesson step's newest box opens the next step.
function nextBox(id, viewId, tooltip) {
  return box(id, { kicker: "Next", opensView: viewId, tooltip });
}

// From the step that explains them, these boxes open a code walk.
const HOW_CODE = {
  content: { kicker: "Code", opensView: "how-bind", tooltip: "Holds the notes. Open it to see how a note finds its shape." },
  picture: { kicker: "Code", opensView: "how-edges", tooltip: "The SVG. Open it to see how an arrow is found." },
  tap: { kicker: "Code", opensView: "how-panel", tooltip: "The side panel. Open it to see how a note becomes the panel." },
};

window.DIAGRAMS = {
  tabs: [
    { id: "architecture", label: "Architecture" },
    { id: "c4", label: "C4" },
    { id: "checkout", label: "Flow" },
    { id: "login", label: "Sequence" },
    { id: "order", label: "State" },
    { id: "how", label: "How", lesson: ["how", "how-draw", "how-match", "how-hover", "how-click", "how-drill", "how-lesson", "how-export"] },
  ],
  views: {
    architecture: {
      viewId: "architecture",
      tab: "architecture",
      parent: null,
      title: "Web app",
      summary: "How a browser reaches the Go API, the database, and the worker.",
      chart: `flowchart LR
  browser["Browser"]
  cdn["CDN"]
  web["Web app"]
  api["API"]
  db[("Postgres")]
  redis[("Redis")]
  worker["Worker"]
  mail["Mail provider"]
  browser --> cdn
  cdn --> web
  browser --> web
  web --> api
  api --> db
  api --> redis
  worker --> redis
  worker --> db
  worker --> mail`,
      edgeInteractions: [
        arrow("browser", "cdn", "The browser loads HTML, CSS, and images from the CDN.", "This path is cacheable. It never carries the session cookie.", [["Carries", "Static files"]]),
        arrow("cdn", "web", "The CDN returns the static web app.", "The files are the pages, not API data.", [["Cached", "Yes"]]),
        arrow("browser", "web", "API calls go to the web origin, not the CDN.", "The session cookie is sent only on this path.", [["Carries", "Cookie and JSON"]]),
        arrow("web", "api", "The page calls the Go API.", "Catalog reads and checkout writes both use this hop.", [["Format", "JSON"]]),
        arrow("api", "db", "The API reads and writes books, users, and orders.", "Postgres is the system of record.", [["Protocol", "SQL"]]),
        arrow("api", "redis", "The API stores the session and pushes a job.", "Redis is safe to lose. The order row is already in Postgres.", [["Uses", "Cache and queue"]]),
        arrow("worker", "redis", "The worker pulls the next job.", "Payment capture and mail wait here until a worker is free.", [["Pattern", "Queue"]]),
        arrow("worker", "db", "The worker updates payment and fulfillment columns.", "It does not create the order. The API did that.", [["Writes", "Order status"]]),
        arrow("worker", "mail", "The worker sends the receipt.", "The mail provider is outside the system.", [["Protocol", "SMTP"]]),
      ],
      nodeInteractions: {
        browser: {
          label: "Browser",
          tooltip: "The reader's browser. Static files come from the CDN. API calls go to the web origin.",
          kicker: "Client",
          body: "Renders the pages and stores the session cookie. It never talks to Postgres.",
          facts: [["Calls", "Web app"], ["Cookie", "HttpOnly session"]],
        },
        cdn: {
          label: "CDN",
          tooltip: "Caches HTML, CSS, and images close to the reader.",
          kicker: "Edge",
          body: "Serves the static web app. API requests are not cached here.",
          facts: [["Holds", "Static files"], ["Skips", "POST and cookies"]],
        },
        web: {
          label: "Web app",
          tooltip: "Static pages for the catalog, cart, and checkout.",
          kicker: "Frontend",
          body: "A small multi-page front end. It calls the API with the session cookie.",
          facts: [["Runs as", "Static files"], ["Talks to", "API"]],
          opensView: "architecture-web",
        },
        api: {
          label: "API",
          tooltip: "Go service for accounts, catalog, and orders.",
          kicker: "Backend",
          body: "The only component that writes orders. It enqueues mail and payment work in Redis.",
          facts: [["Runtime", "Go"], ["Listens", "HTTPS"], ["Writes", "Postgres"]],
          opensView: "architecture-api",
        },
        db: {
          label: "Postgres",
          tooltip: "System of record for users, books, and orders.",
          kicker: "Data",
          body: "Orders and catalog live here. The worker updates fulfillment columns.",
          facts: [["Engine", "Postgres"], ["Written by", "API and worker"]],
        },
        redis: {
          label: "Redis",
          tooltip: "Short-lived session cache and the job queue.",
          kicker: "Data",
          body: "Holds session lookups and the queue the worker consumes.",
          facts: [["Uses", "Cache and list"], ["Lost data", "Safe to rebuild"]],
        },
        worker: {
          label: "Worker",
          tooltip: "Background Go process for mail and payment follow-up.",
          kicker: "Backend",
          body: "Pulls jobs from Redis, updates Postgres, and calls the mail provider.",
          facts: [["Runtime", "Go"], ["Reads", "Redis"], ["Calls", "Mail provider"]],
        },
        mail: {
          label: "Mail provider",
          tooltip: "External SMTP service that sends receipts.",
          kicker: "External",
          body: "Outside the system. The worker is the only caller.",
          facts: [["Protocol", "SMTP"], ["Called by", "Worker"]],
        },
      },
    },
    "architecture-web": {
      viewId: "architecture-web",
      tab: "architecture",
      parent: "architecture",
      title: "Web app",
      summary: "Pages inside the static web app.",
      chart: `flowchart LR
  shell["App shell"]
  catalog["Catalog"]
  cart["Cart"]
  checkout["Checkout"]
  shell --> catalog
  shell --> cart
  cart --> checkout
  catalog --> cart`,
      edgeInteractions: [
        arrow("shell", "catalog", "The shell opens the catalog.", "Search and book pages sit inside the shared frame.", [["Page", "Catalog"]]),
        arrow("shell", "cart", "The shell opens the cart.", "The header cart link lands here.", [["Page", "Cart"]]),
        arrow("cart", "checkout", "A priced cart continues to checkout.", "An empty cart cannot take this step.", [["Next", "Address and payment"]]),
        arrow("catalog", "cart", "Add a book from the catalog.", "The server cart is updated before checkout.", [["API", "PUT /cart"]]),
      ],
      nodeInteractions: {
        shell: {
          label: "App shell",
          tooltip: "Shared header, session check, and page frame.",
          kicker: "Page",
          body: "Loads on every page and reads the session before showing account links.",
          facts: [["Owns", "Header and nav"]],
        },
        catalog: {
          label: "Catalog",
          tooltip: "Search and book pages. Read-only against the API.",
          kicker: "Page",
          body: "Fetches books from the API and links each title into the cart.",
          facts: [["API", "GET /books"]],
        },
        cart: {
          label: "Cart",
          tooltip: "Holds the current selection in the browser and on the server.",
          kicker: "Page",
          body: "The server cart is the source of truth at checkout.",
          facts: [["API", "PUT /cart"]],
        },
        checkout: {
          label: "Checkout",
          tooltip: "Address and payment. Posts the order to the API.",
          kicker: "Page",
          body: "Does not charge the card itself. The API owns that step.",
          facts: [["API", "POST /orders"]],
        },
      },
    },
    "architecture-api": {
      viewId: "architecture-api",
      tab: "architecture",
      parent: "architecture",
      title: "API",
      summary: "Handlers behind the Go API.",
      chart: `flowchart LR
  router["Router"]
  auth["Auth"]
  catalog["Catalog"]
  orders["Orders"]
  router --> auth
  router --> catalog
  router --> orders
  orders --> auth`,
      edgeInteractions: [
        arrow("router", "auth", "Login and session routes go to auth.", "The router matches the path, then auth owns the cookie.", [["Routes", "/login"]]),
        arrow("router", "catalog", "Public book routes go to catalog.", "No session is required to browse.", [["Routes", "GET /books"]]),
        arrow("router", "orders", "Checkout routes go to orders.", "Orders asks auth before it writes.", [["Routes", "POST /orders"]]),
        arrow("orders", "auth", "Orders checks the session before writing.", "A missing session stops the order.", [["Needs", "Session cookie"]]),
      ],
      nodeInteractions: {
        router: {
          label: "Router",
          tooltip: "net/http routes and the request log.",
          kicker: "Handler",
          body: "Matches the path, applies the session middleware, and calls one handler.",
          facts: [["Package", "net/http"]],
        },
        auth: {
          label: "Auth",
          tooltip: "Checks the session and password hashes.",
          kicker: "Handler",
          body: "Login creates the session. Other handlers ask auth before writing.",
          facts: [["Cookie", "Session id"], ["Store", "Redis and Postgres"]],
        },
        catalog: {
          label: "Catalog",
          tooltip: "Read-only book search.",
          kicker: "Handler",
          body: "Queries Postgres and returns JSON. No worker jobs.",
          facts: [["Method", "GET"]],
        },
        orders: {
          label: "Orders",
          tooltip: "Creates the order and enqueues payment work.",
          kicker: "Handler",
          body: "Writes the order, then pushes a job so the worker can capture payment and send mail.",
          facts: [["Writes", "Postgres"], ["Enqueues", "Redis"]],
        },
      },
    },
    c4: {
      viewId: "c4",
      tab: "c4",
      parent: null,
      title: "System context",
      summary: "C4 level 1. The bookshop, the reader, and two external systems.",
      chart: `C4Context
title Bookshop system context
Person(reader, "Reader", "Buys and reads books")
System(shop, "Bookshop", "Catalog, cart, and checkout")
System_Ext(pay, "Card processor", "Charges the saved card")
System_Ext(mail, "Mail service", "Sends receipts")
Rel(reader, shop, "Uses")
Rel(shop, pay, "Charges", "HTTPS")
Rel(shop, mail, "Sends mail", "SMTP")
UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")`,
      edgeInteractions: [
        arrow("reader", "shop", "The reader browses and checks out.", "People do not call the card processor themselves.", [["C4", "Uses"]], { mermaidText: "Uses" }),
        arrow("shop", "pay", "The bookshop charges the card.", "Only a paid order continues to fulfillment.", [["Protocol", "HTTPS"]], { mermaidText: "Charges" }),
        arrow("shop", "mail", "The bookshop sends the receipt.", "Mail is delivered by an external system.", [["Protocol", "SMTP"]], { mermaidText: "Sends mail" }),
      ],
      nodeInteractions: {
        reader: {
          label: "Reader",
          tooltip: "A person using a browser. They are outside the software system.",
          kicker: "Person",
          body: "Browses the catalog and checks out. They do not talk to the card processor directly.",
          facts: [["C4", "Person"], ["Sees", "Bookshop"]],
        },
        shop: {
          label: "Bookshop",
          tooltip: "The software system under design.",
          kicker: "System",
          body: "Open the container diagram to see the web app, API, database, and worker.",
          facts: [["C4", "Software system"], ["Next", "Containers"]],
          opensView: "c4-containers",
        },
        pay: {
          label: "Card processor",
          tooltip: "External system that captures card payments.",
          kicker: "External system",
          body: "The bookshop sends a charge and stores the processor reference on the order.",
          facts: [["C4", "External"], ["Protocol", "HTTPS"]],
        },
        mail: {
          label: "Mail service",
          tooltip: "External system that delivers receipt email.",
          kicker: "External system",
          body: "The bookshop sends one receipt after payment is captured.",
          facts: [["C4", "External"], ["Protocol", "SMTP"]],
        },
      },
    },
    "c4-containers": {
      viewId: "c4-containers",
      tab: "c4",
      parent: "c4",
      title: "Containers",
      summary: "C4 level 2. Deployable pieces inside the bookshop.",
      chart: `C4Container
title Bookshop containers
Person(reader, "Reader", "Buys books")
System_Boundary(shop, "Bookshop") {
  Container(web, "Web app", "HTML, CSS", "Catalog, cart, and checkout pages")
  Container(api, "API", "Go", "Accounts, catalog, and orders")
  ContainerDb(db, "Database", "Postgres", "Users, books, and orders")
  Container(worker, "Worker", "Go", "Payment follow-up and mail")
}
System_Ext(pay, "Card processor", "Charges cards")
Rel(reader, web, "Uses", "HTTPS")
Rel(web, api, "Calls", "JSON")
Rel(api, db, "SQL")
Rel(api, worker, "Enqueues")
Rel(worker, db, "Updates", "SQL")
Rel(worker, pay, "Captures", "HTTPS")
UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")`,
      edgeInteractions: [
        arrow("reader", "web", "The reader uses the web app in a browser.", "Static pages only. Rules stay in the API.", [["Protocol", "HTTPS"]], { mermaidText: "Uses" }),
        arrow("web", "api", "The web app calls the API.", "JSON in, JSON out. The browser does not open a database connection.", [["Format", "JSON"]], { mermaidText: "Calls" }),
        arrow("api", "db", "The API reads and writes the system of record.", "Users, books, and orders live here.", [["Protocol", "SQL"]], { mermaidText: "SQL" }),
        arrow("api", "worker", "The API enqueues payment and mail.", "Checkout can return before the receipt is sent.", [["Pattern", "Queue"]], { mermaidText: "Enqueues" }),
        arrow("worker", "db", "The worker updates the order after the API created it.", "Capture and fulfillment columns change here.", [["Protocol", "SQL"]], { mermaidText: "Updates" }),
        arrow("worker", "pay", "The worker captures an approved charge.", "The raw card number never reaches the worker.", [["Protocol", "HTTPS"]], { mermaidText: "Captures" }),
      ],
      nodeInteractions: {
        reader: {
          label: "Reader",
          tooltip: "Same person as on the context diagram.",
          kicker: "Person",
          body: "Uses the web app in a browser.",
          facts: [["C4", "Person"]],
        },
        web: {
          label: "Web app",
          tooltip: "Static container served to the browser.",
          kicker: "Container",
          body: "Pages only. Business rules stay in the API.",
          facts: [["Tech", "HTML, CSS"], ["Calls", "API"]],
        },
        api: {
          label: "API",
          tooltip: "Go container that owns the use cases.",
          kicker: "Container",
          body: "Open the component diagram for auth, catalog, and orders.",
          facts: [["Tech", "Go"], ["Next", "Components"]],
          opensView: "c4-api",
        },
        db: {
          label: "Database",
          tooltip: "Postgres container. System of record.",
          kicker: "Container",
          body: "Users, books, and orders. Both the API and the worker connect.",
          facts: [["Tech", "Postgres"], ["C4", "Database"]],
        },
        worker: {
          label: "Worker",
          tooltip: "Go process that finishes payment and sends mail.",
          kicker: "Container",
          body: "Consumes jobs created by the API. Calls the card processor.",
          facts: [["Tech", "Go"], ["Calls", "Card processor"]],
        },
        pay: {
          label: "Card processor",
          tooltip: "External system from the context diagram.",
          kicker: "External system",
          body: "Only the worker captures money.",
          facts: [["C4", "External"]],
        },
      },
    },
    "c4-api": {
      viewId: "c4-api",
      tab: "c4",
      parent: "c4-containers",
      title: "API components",
      summary: "C4 level 3. Components inside the API container.",
      chart: `C4Component
title API components
Container_Boundary(api, "API") {
  Component(auth, "Auth", "Go", "Sessions and passwords")
  Component(catalog, "Catalog", "Go", "Book search")
  Component(orders, "Orders", "Go", "Checkout")
  ComponentDb(db, "Database", "Postgres", "Shared tables")
}
Rel(orders, auth, "Checks session")
Rel(auth, db, "Reads", "SQL")
Rel(catalog, db, "Reads", "SQL")
Rel(orders, db, "Writes", "SQL")
UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")`,
      edgeInteractions: [
        arrow("orders", "auth", "Orders asks auth whether the session is valid.", "Catalog does not take this hop.", [["Needs", "Session"]], { mermaidText: "Checks session" }),
        arrow("auth", "db", "Auth reads the user row.", "The password hash stays in the database.", [["Protocol", "SQL"]], { mermaidText: "Reads" }),
        arrow("catalog", "db", "Catalog reads books.", "This path is read-only.", [["Protocol", "SQL"]], { mermaidText: "Reads" }),
        arrow("orders", "db", "Orders inserts the order row.", "The worker updates that row later.", [["Protocol", "SQL"]], { mermaidText: "Writes" }),
      ],
      nodeInteractions: {
        auth: {
          label: "Auth",
          tooltip: "Password checks and session lookup.",
          kicker: "Component",
          body: "Orders calls auth before creating an order. Catalog is public.",
          facts: [["C4", "Component"], ["Reads", "Database"]],
        },
        catalog: {
          label: "Catalog",
          tooltip: "Search and book detail. Read-only.",
          kicker: "Component",
          body: "No session required for browsing.",
          facts: [["C4", "Component"], ["Reads", "Database"]],
        },
        orders: {
          label: "Orders",
          tooltip: "Checkout use case. Writes the order row.",
          kicker: "Component",
          body: "Requires a session from auth, then inserts the order.",
          facts: [["C4", "Component"], ["Writes", "Database"]],
        },
        db: {
          label: "Database",
          tooltip: "The same Postgres container, seen from inside the API.",
          kicker: "Component",
          body: "Shown here as the database the components share.",
          facts: [["Tech", "Postgres"]],
        },
      },
    },
    checkout: {
      viewId: "checkout",
      tab: "checkout",
      parent: null,
      title: "Checkout",
      summary: "Flow from the cart to a placed order or a payment error.",
      chart: `flowchart TD
  cart["Cart"]
  address["Shipping address"]
  pay{"Payment method"}
  card["Card payment"]
  saved["Saved card"]
  fail["Show error"]
  placed["Order placed"]
  cart --> address
  address --> pay
  pay -->|new card| card
  pay -->|saved card| saved
  card -->|approved| placed
  card -->|declined| fail
  saved -->|approved| placed
  saved -->|declined| fail
  fail --> pay`,
      edgeInteractions: [
        arrow("cart", "address", "A priced cart moves to the address step.", "Stock is checked again here.", [["From", "Cart"]]),
        arrow("address", "pay", "A valid address unlocks payment.", "The address is stored on the draft order.", [["Next", "Payment method"]]),
        arrow("pay", "card", "The reader pays with a new card.", "Double-click this arrow to open the token, charge, and capture steps.", [["Branch", "New card"]], { label: "New card", opensView: "checkout-card" }),
        arrow("pay", "saved", "The reader pays with a card stored at the processor.", "Our server sends the processor customer id, not the card number.", [["Branch", "Saved card"]]),
        arrow("card", "placed", "The new card was approved.", "The order becomes paid and the worker can capture it.", [["Result", "Approved"]]),
        arrow("card", "fail", "The new card was declined.", "The draft order stays unpaid.", [["Result", "Declined"]]),
        arrow("saved", "placed", "The saved card was approved.", "Same paid state as a new card.", [["Result", "Approved"]]),
        arrow("saved", "fail", "The saved card was declined.", "The reader can pick another method.", [["Result", "Declined"]]),
        arrow("fail", "pay", "A decline returns to the payment choice.", "Nothing has been captured.", [["Retry", "Yes"]]),
      ],
      nodeInteractions: {
        cart: {
          label: "Cart",
          tooltip: "The server cart is priced again before payment.",
          kicker: "Step",
          body: "Confirms line items and stock. Empty carts never reach the address step.",
          facts: [["API", "GET /cart"]],
        },
        address: {
          label: "Shipping address",
          tooltip: "Required before any charge.",
          kicker: "Step",
          body: "Validated for country and postal code. Stored on the draft order.",
          facts: [["Writes", "Draft order"]],
        },
        pay: {
          label: "Payment method",
          tooltip: "The reader pays with a new card or a saved card.",
          kicker: "Decision",
          body: "Both branches can be declined. A decline returns here.",
          facts: [["Branches", "New card, saved card"]],
        },
        card: {
          label: "Card payment",
          tooltip: "Collects a new card and sends it to the processor.",
          kicker: "Step",
          body: "Open the inner diagram for the token, charge, and capture steps.",
          facts: [["Next", "Payment steps"]],
          opensView: "checkout-card",
        },
        saved: {
          label: "Saved card",
          tooltip: "Charges a card already stored at the processor.",
          kicker: "Step",
          body: "Uses the processor customer reference. The raw card number is not on our server.",
          facts: [["Sends", "Processor customer id"]],
        },
        fail: {
          label: "Show error",
          tooltip: "The charge was declined. The order is not placed.",
          kicker: "Step",
          body: "The draft order stays unpaid. The reader can pick another method.",
          facts: [["Order", "Still a draft"]],
        },
        placed: {
          label: "Order placed",
          tooltip: "Payment was approved and the order is paid.",
          kicker: "Step",
          body: "The API writes the order and the worker sends the receipt.",
          facts: [["State", "Paid"]],
        },
      },
    },
    "checkout-card": {
      viewId: "checkout-card",
      tab: "checkout",
      parent: "checkout",
      title: "Card payment",
      summary: "What happens inside the card payment step.",
      chart: `flowchart TD
  token["Create payment token"]
  charge["Charge card"]
  decision{"Processor response"}
  capture["Capture payment"]
  decline["Decline"]
  token --> charge
  charge --> decision
  decision -->|approved| capture
  decision -->|declined| decline`,
      edgeInteractions: [
        arrow("token", "charge", "The token is what our API is allowed to charge.", "The browser created it with the processor. We never see the card number.", [["Sends", "Token"]]),
        arrow("charge", "decision", "The API asks the processor to authorize that token.", "The amount is the repriced cart total.", [["Caller", "API"]]),
        arrow("decision", "capture", "An approval can be captured.", "The worker captures it after checkout returns.", [["Result", "Approved"]]),
        arrow("decision", "decline", "A decline captures nothing.", "A timeout is treated the same way.", [["Result", "Declined"]]),
      ],
      nodeInteractions: {
        token: {
          label: "Create payment token",
          tooltip: "The browser sends card data to the processor, not to our API.",
          kicker: "Step",
          body: "Our server receives only the token.",
          facts: [["Sees the card", "Processor"]],
        },
        charge: {
          label: "Charge card",
          tooltip: "The API asks the processor to authorize the token.",
          kicker: "Step",
          body: "The amount is the repriced cart total.",
          facts: [["Caller", "API"]],
        },
        decision: {
          label: "Processor response",
          tooltip: "Approved or declined. No other branch.",
          kicker: "Decision",
          body: "A timeout is treated as a decline and can be retried.",
          facts: [["Outcomes", "Approved, declined"]],
        },
        capture: {
          label: "Capture payment",
          tooltip: "The worker captures an approved authorization.",
          kicker: "Step",
          body: "Capture is asynchronous so checkout can return as soon as the auth succeeds.",
          facts: [["Caller", "Worker"]],
        },
        decline: {
          label: "Decline",
          tooltip: "Nothing is captured. The reader sees the error on the previous diagram.",
          kicker: "Step",
          body: "The draft order stays unpaid.",
          facts: [["Order", "Draft"]],
        },
      },
    },
    login: {
      viewId: "login",
      tab: "login",
      parent: null,
      title: "Login",
      summary: "Sequence for a password login. Click API to open the check inside that call.",
      chart: `sequenceDiagram
  actor Reader
  participant Web as Web app
  participant API
  participant DB as Postgres
  Reader->>Web: Submit email and password
  Web->>API: POST /login
  API->>DB: Find user by email
  DB-->>API: User row
  API-->>Web: Session cookie
  Web-->>Reader: Redirect home`,
      edgeInteractions: [
        arrow("Reader", "Web", "The reader submits the login form.", "The password is typed into the web app.", [["Sends", "Email and password"]], { mermaidText: "Submit email and password" }),
        arrow("Web", "API", "The web app asks the API to start a session.", "Double-click this arrow to open the password check.", [["Call", "POST /login"]], { mermaidText: "POST /login", label: "POST /login", opensView: "login-api" }),
        arrow("API", "DB", "The API looks up the user by email.", "Postgres returns the hash, not a yes or no.", [["Query", "Users by email"]], { mermaidText: "Find user by email" }),
        arrow("DB", "API", "Postgres returns the user row.", "The hash is compared in the API, not in the database.", [["Returns", "User row"]], { mermaidText: "User row" }),
        arrow("API", "Web", "The API sets the session cookie.", "No cookie is set when the password is wrong.", [["Cookie", "Session id"]], { mermaidText: "Session cookie" }),
        arrow("Web", "Reader", "The web app sends the reader home.", "The cookie stays in the browser for the next call.", [["Next", "Home"]], { mermaidText: "Redirect home" }),
      ],
      nodeInteractions: {
        Reader: {
          label: "Reader",
          tooltip: "Types an email and password into the web app.",
          kicker: "Actor",
          body: "The password leaves the browser only over HTTPS to our API.",
          facts: [["Sends", "Email and password"]],
        },
        Web: {
          label: "Web app",
          tooltip: "Posts the form and stores nothing except the cookie the API sets.",
          kicker: "Participant",
          body: "The web app does not hash the password. It forwards the form.",
          facts: [["Call", "POST /login"]],
        },
        API: {
          label: "API",
          tooltip: "Looks up the user and decides whether to create a session.",
          kicker: "Participant",
          body: "Open the inner diagram for the lookup, hash check, and session write.",
          facts: [["Next", "Password check"]],
          opensView: "login-api",
        },
        DB: {
          label: "Postgres",
          tooltip: "Returns the user row, including the password hash.",
          kicker: "Participant",
          body: "The hash is compared in the API process. Postgres does not see the plaintext password.",
          facts: [["Returns", "User row"]],
        },
      },
    },
    "login-api": {
      viewId: "login-api",
      tab: "login",
      parent: "login",
      title: "Password check",
      summary: "The work inside the POST /login call.",
      chart: `flowchart TD
  lookup["Look up user"]
  missing{"User found?"}
  hash{"Hash matches?"}
  session["Create session"]
  reject["Return 401"]
  lookup --> missing
  missing -->|yes| hash
  missing -->|no| reject
  hash -->|yes| session
  hash -->|no| reject`,
      edgeInteractions: [
        arrow("lookup", "missing", "The lookup result decides the next step.", "Unknown emails and bad passwords stay indistinguishable.", [["Next", "Found or 401"]]),
        arrow("missing", "hash", "A found user continues to the hash check.", "The plaintext password is still only in this request.", [["When", "User exists"]], { label: "Yes" }),
        arrow("missing", "reject", "An unknown email returns 401.", "The response does not say that the account is missing.", [["When", "No user"]], { label: "No" }),
        arrow("hash", "session", "A matching hash creates a session.", "The cookie is HttpOnly and Secure.", [["When", "Match"]], { label: "Yes" }),
        arrow("hash", "reject", "A bad password returns the same 401.", "No session cookie is set.", [["When", "No match"]], { label: "No" }),
      ],
      nodeInteractions: {
        lookup: {
          label: "Look up user",
          tooltip: "Select the user by email. The email is stored in lowercase.",
          kicker: "Step",
          body: "A missing user and a bad password return the same 401.",
          facts: [["Query", "Users by email"]],
        },
        missing: {
          label: "User found?",
          tooltip: "Unknown emails do not reveal that the account is missing.",
          kicker: "Decision",
          body: "The response stays generic so the form cannot be used to enumerate accounts.",
          facts: [["On no", "401"]],
        },
        hash: {
          label: "Hash matches?",
          tooltip: "Compares the password with the stored hash.",
          kicker: "Decision",
          body: "The plaintext password is dropped after the comparison.",
          facts: [["Stored", "Hash only"]],
        },
        session: {
          label: "Create session",
          tooltip: "Writes a session id in Redis and sets the cookie.",
          kicker: "Step",
          body: "The cookie is HttpOnly and Secure.",
          facts: [["Cookie", "Session id"], ["Store", "Redis"]],
        },
        reject: {
          label: "Return 401",
          tooltip: "Same response for an unknown user and a bad password.",
          kicker: "Step",
          body: "No session cookie is set.",
          facts: [["Status", "401"]],
        },
      },
    },
    order: {
      viewId: "order",
      tab: "order",
      parent: null,
      title: "Order",
      summary: "States of an order from draft to delivered or cancelled.",
      chart: `stateDiagram-v2
  [*] --> Draft
  Draft --> Placed
  Placed --> Paid
  Placed --> Cancelled
  Paid --> Fulfilling
  Fulfilling --> Shipped
  Shipped --> Delivered
  Delivered --> [*]
  Cancelled --> [*]`,
      edgeInteractions: [
        arrow("*", "Draft", "Checkout creates the order in this state.", "Nothing is charged yet.", [["From", "Start"]], { label: "Start → Draft" }),
        arrow("Draft", "Placed", "The reader submitted checkout.", "Payment is now in flight.", [["Next", "Paid or Cancelled"]]),
        arrow("Placed", "Paid", "The processor authorized the charge.", "Fulfillment can start.", [["Money", "Authorized"]]),
        arrow("Placed", "Cancelled", "Payment failed, so the order stops.", "No warehouse work starts.", [["Money", "Not taken"]]),
        arrow("Paid", "Fulfilling", "A paid order enters the warehouse.", "Double-click the Fulfilling state for the inner steps.", [["Next", "Picking"]]),
        arrow("Fulfilling", "Shipped", "The carrier scanned the parcel.", "Tracking is stored on the order.", [["Has", "Tracking number"]]),
        arrow("Shipped", "Delivered", "The carrier confirmed delivery.", "This is the successful path.", [["Next", "End"]]),
        arrow("Delivered", "*", "Delivery closes the order.", "This is the successful end state.", [["Terminal", "Yes"]], { label: "Delivered → End" }),
        arrow("Cancelled", "*", "A cancelled order ends here.", "No shipment is sent.", [["Terminal", "Yes"]], { label: "Cancelled → End" }),
      ],
      nodeInteractions: {
        Draft: {
          label: "Draft",
          tooltip: "Cart has started checkout. No charge yet.",
          kicker: "State",
          body: "Address can still change. Stock is not reserved.",
          facts: [["Money", "Not taken"]],
        },
        Placed: {
          label: "Placed",
          tooltip: "The reader submitted checkout. Payment is in flight.",
          kicker: "State",
          body: "Can move to Paid or Cancelled. A decline returns the order to a retry, still unpaid.",
          facts: [["Next", "Paid or Cancelled"]],
        },
        Paid: {
          label: "Paid",
          tooltip: "The processor authorized the charge.",
          kicker: "State",
          body: "Fulfillment can start. Refunds are a separate path not shown here.",
          facts: [["Money", "Authorized"]],
        },
        Cancelled: {
          label: "Cancelled",
          tooltip: "Stopped before fulfillment. No shipment.",
          kicker: "State",
          body: "A placed order that fails payment ends here.",
          facts: [["Terminal", "Yes"]],
        },
        Fulfilling: {
          label: "Fulfilling",
          tooltip: "The warehouse is picking and packing the order.",
          kicker: "State",
          body: "Open the inner diagram for picking, packed, and handoff.",
          facts: [["Next", "Warehouse states"]],
          opensView: "order-fulfilling",
        },
        Shipped: {
          label: "Shipped",
          tooltip: "Handed to the carrier. Tracking is stored on the order.",
          kicker: "State",
          body: "The reader gets a second email with the tracking link.",
          facts: [["Has", "Tracking number"]],
        },
        Delivered: {
          label: "Delivered",
          tooltip: "Carrier confirmed delivery.",
          kicker: "State",
          body: "This is the successful end state.",
          facts: [["Terminal", "Yes"]],
        },
      },
    },
    "order-fulfilling": {
      viewId: "order-fulfilling",
      tab: "order",
      parent: "order",
      title: "Fulfilling",
      summary: "States inside warehouse fulfillment.",
      chart: `stateDiagram-v2
  [*] --> Picking
  state "Handed off" as HandedOff
  Picking --> Packed
  Picking --> Backordered
  Backordered --> Picking
  Packed --> HandedOff
  HandedOff --> [*]`,
      edgeInteractions: [
        arrow("*", "Picking", "Fulfillment starts when staff pull books.", "The parent order is already paid.", [["From", "Fulfilling"]], { label: "Start → Picking" }),
        arrow("Picking", "Packed", "Every title was found and the parcel is sealed.", "The next step is the carrier.", [["When", "In stock"]]),
        arrow("Picking", "Backordered", "A title is missing, so packing waits.", "The reader is emailed. The order stays paid.", [["When", "Missing title"]]),
        arrow("Backordered", "Picking", "Stock arrived, so picking starts again.", "This can happen more than once.", [["When", "Restocked"]]),
        arrow("Packed", "HandedOff", "The carrier scanned the parcel.", "The parent order becomes Shipped.", [["Next", "Shipped"]]),
        arrow("HandedOff", "*", "Handoff leaves this inner diagram.", "The parent state is now Shipped.", [["Parent", "Shipped"]], { label: "Handed off → End" }),
      ],
      nodeInteractions: {
        Picking: {
          label: "Picking",
          tooltip: "Staff are pulling books from shelves.",
          kicker: "State",
          body: "A missing title moves the order to backordered instead of packed.",
          facts: [["Can become", "Packed or Backordered"]],
        },
        Packed: {
          label: "Packed",
          tooltip: "The parcel is sealed and labeled.",
          kicker: "State",
          body: "Waiting for the carrier pickup.",
          facts: [["Next", "Handed off"]],
        },
        Backordered: {
          label: "Backordered",
          tooltip: "A title is out of stock. Picking resumes when it arrives.",
          kicker: "State",
          body: "The reader is emailed. The order stays paid.",
          facts: [["Money", "Still captured"]],
        },
        HandedOff: {
          label: "Handed off",
          tooltip: "The carrier scanned the parcel. The parent order becomes Shipped.",
          kicker: "State",
          body: "Leaving this diagram returns the order to the Shipped state.",
          facts: [["Parent state", "Shipped"]],
        },
      },
    },
    how: {
      viewId: "how",
      tab: "how",
      parent: null,
      title: "1. One file holds the explanation",
      summary: "Start here. An explanation is one file: the Mermaid text for each diagram, and notes for its shapes and arrows. Click either box.",
      story: md`
        An explanation needs a picture and words about each part of it. Here both live in one file, so the person or agent who writes it has one thing to write and hand over.

        The file holds tabs and diagrams. Each diagram is Mermaid text plus a note for each shape and arrow. A note is filed under the id its shape has in the Mermaid text, which is how the page later finds the shape it belongs to.

        Each step of this lesson adds one piece to the picture. The list below shows what is in this one.
      `,
      chart: `flowchart LR
  ${howNode("writer")} --> ${howNode("content")}`,
      nodeInteractions: {
        writer: box("writer"),
        content: nextBox("content", "how-draw", "One script that holds every diagram and every note. The next picture draws it."),
      },
      edgeInteractions: [HOW_ARROW.write],
    },
    "how-draw": {
      viewId: "how-draw",
      tab: "how",
      parent: null,
      title: "2. Mermaid draws each picture",
      summary: "Mermaid turns each diagram's text into a picture. It never sees the notes. Double-click Mermaid to walk the code that draws a view.",
      story: md`
        The page does not draw boxes itself. It hands each diagram's Mermaid text to Mermaid, which returns the picture as SVG.

        Only the Mermaid text goes in. The notes stay behind, because Mermaid has no place for a side panel. So the picture that comes back looks right but does nothing when clicked.

        Double-click Mermaid to walk through the code that draws one diagram.
      `,
      chart: `flowchart LR
  ${howNode("writer")} --> ${howNode("content")}
  content --> ${howNode("mmd")} --> ${howNode("picture")}`,
      nodeInteractions: {
        writer: box("writer"),
        content: box("content"),
        mmd: box("mmd"),
        picture: nextBox("picture", "how-match", "The SVG in the page. The next picture makes it clickable."),
      },
      edgeInteractions: [HOW_ARROW.write, HOW_ARROW.draw, HOW_ARROW.drawn],
    },
    "how-match": {
      viewId: "how-match",
      tab: "how",
      parent: null,
      title: "3. The page finds each note's shape",
      summary: "The page finds the shape Mermaid drew for each note. Double-click Content file to see how a box is found, or Picture for arrows.",
      story: md`
        A note says "web", but the picture only has the shapes Mermaid drew, under Mermaid's own names. So before anything can be clicked, the page has to find the right shape for each note.

        Shapes are found by their id, and each chart type builds that id differently. Arrows are harder, because some chart types do not name an arrow's ends at all. Those are matched by their text, or by where they start and end.

        Double-click Content file to see how a shape is found, or Picture to see how an arrow is found.
      `,
      chart: `flowchart LR
  ${howNode("writer")} --> ${howNode("content")}
  content --> ${howNode("mmd")} --> ${howNode("picture")}
  content --> ${howNode("app")}
  picture --> app`,
      nodeInteractions: {
        writer: box("writer"),
        content: box("content", HOW_CODE.content),
        mmd: box("mmd"),
        picture: box("picture", HOW_CODE.picture),
        app: nextBox("app", "how-hover", "Finds each note's shape. The next picture adds hover."),
      },
      edgeInteractions: [HOW_ARROW.write, HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.toApp, HOW_ARROW.fromPic],
    },
    "how-hover": {
      viewId: "how-hover",
      tab: "how",
      parent: null,
      title: "4. Hover lights the neighbors",
      summary: "Pointing at a shape shows its tooltip and keeps what it connects to solid. Try it on any box here.",
      story: md`
        Once a shape is found, it listens for the pointer. Pointing at it shows its one-line tooltip and fades everything it does not connect to.

        This lets a reader see what a shape talks to before reading anything. Try it on Matcher: Content file, Picture, and Hover stay solid.
      `,
      chart: `flowchart LR
  ${howNode("writer")} --> ${howNode("content")}
  content --> ${howNode("mmd")} --> ${howNode("picture")}
  content --> ${howNode("app")}
  picture --> app
  app --> ${howNode("hover")}`,
      nodeInteractions: {
        writer: box("writer"),
        content: box("content", HOW_CODE.content),
        mmd: box("mmd"),
        picture: box("picture", HOW_CODE.picture),
        app: box("app"),
        hover: nextBox("hover", "how-click", "Pointer enter. The next picture adds click."),
      },
      edgeInteractions: [HOW_ARROW.write, HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover],
    },
    "how-click": {
      viewId: "how-click",
      tab: "how",
      parent: null,
      title: "5. Click opens the notes",
      summary: "A click opens the side panel with that shape's note, its facts, and links to what it connects to.",
      story: md`
        One line is rarely enough, so a click opens the side panel with the shape's full note, its facts, and links to what it connects to.

        With nothing selected, the panel shows the story of the whole diagram, as it does now, and a list of its parts. From a note, Back returns here.
      `,
      chart: `flowchart LR
  ${howNode("writer")} --> ${howNode("content")}
  content --> ${howNode("mmd")} --> ${howNode("picture")}
  content --> ${howNode("app")}
  picture --> app
  app --> ${howNode("hover")}
  app --> ${howNode("tap")}`,
      nodeInteractions: {
        writer: box("writer"),
        content: box("content", HOW_CODE.content),
        mmd: box("mmd"),
        picture: box("picture", HOW_CODE.picture),
        app: box("app"),
        hover: box("hover"),
        tap: nextBox("tap", "how-drill", "Opens this panel. The next picture shows double-click."),
      },
      edgeInteractions: [HOW_ARROW.write, HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap],
    },
    "how-drill": {
      viewId: "how-drill",
      tab: "how",
      parent: null,
      title: "6. Double-click opens another diagram",
      summary: "A double-click draws a different diagram. The wheel only zooms this one. Double-click Panel to see how a note becomes the panel.",
      story: md`
        Some shapes are too big for one picture. A shape can name an inner diagram, and a double-click or its ↘ badge draws that diagram in place of this one.

        That is different from zooming. The wheel and the + and − buttons only scale this picture, and never open another one. Keeping the two apart means a reader always knows whether they are looking closer or going deeper.

        Escape or Backspace steps back up, and the picture is where you left it.
      `,
      chart: `flowchart LR
  ${howNode("writer")} --> ${howNode("content")}
  content --> ${howNode("mmd")} --> ${howNode("picture")}
  content --> ${howNode("app")}
  picture --> app
  app --> ${howNode("hover")}
  app --> ${howNode("tap")}
  tap --> ${howNode("another")}
  picture --> ${howNode("cam")}`,
      nodeInteractions: {
        writer: box("writer"),
        content: box("content", HOW_CODE.content),
        mmd: box("mmd"),
        picture: box("picture", HOW_CODE.picture),
        app: box("app"),
        hover: box("hover"),
        tap: box("tap", HOW_CODE.tap),
        another: nextBox("another", "how-lesson", "A different diagram, drawn from scratch. The next picture adds the lesson."),
        cam: box("cam"),
      },
      edgeInteractions: [HOW_ARROW.write, HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap, HOW_ARROW.toNext, HOW_ARROW.toCam],
    },
    "how-lesson": {
      viewId: "how-lesson",
      tab: "how",
      parent: null,
      title: "7. Prev and Next walk the lesson",
      summary: "A tab can list its diagrams in reading order. Prev and Next, or the arrow keys, step through them, like this tab.",
      story: md`
        A reader who opens a link cold needs a path through the diagrams, not a pile of them. So a tab can list its diagrams in reading order, and Prev and Next step through them. This tab is one.

        Opening an inner diagram keeps your place, so Next continues from the step you left. The arrow keys work too, while no note is open.
      `,
      chart: `flowchart LR
  ${howNode("writer")} --> ${howNode("content")}
  content --> ${howNode("mmd")} --> ${howNode("picture")}
  content --> ${howNode("app")}
  picture --> app
  app --> ${howNode("hover")}
  app --> ${howNode("tap")}
  tap --> ${howNode("another")}
  picture --> ${howNode("cam")}
  content --> ${howNode("lesson")}`,
      nodeInteractions: {
        writer: box("writer"),
        content: box("content", HOW_CODE.content),
        mmd: box("mmd"),
        picture: box("picture", HOW_CODE.picture),
        app: box("app"),
        hover: box("hover"),
        tap: box("tap", HOW_CODE.tap),
        another: box("another"),
        cam: box("cam"),
        lesson: nextBox("lesson", "how-export", "The order to read the diagrams in. The next picture adds export."),
      },
      edgeInteractions: [HOW_ARROW.write, HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap, HOW_ARROW.toNext, HOW_ARROW.toCam, HOW_ARROW.toLesson],
    },
    "how-export": {
      viewId: "how-export",
      tab: "how",
      parent: null,
      title: "8. Export makes one HTML file",
      summary: "Export HTML saves the content and the page together as one file to share. Click any box for its code.",
      story: md`
        An explanation is meant to be shared, for example as a link in a pull request. So Export HTML saves everything as one file: the content, the page's scripts, and the styles.

        The file opens on the diagram you exported from, and it works without the repo. Mermaid still loads from the internet. Export needs the page to be served over HTTP, because a browser does not let a page opened as a file read its own scripts.
      `,
      chart: `flowchart LR
  ${howNode("writer")} --> ${howNode("content")}
  content --> ${howNode("mmd")} --> ${howNode("picture")}
  content --> ${howNode("app")}
  picture --> app
  app --> ${howNode("hover")}
  app --> ${howNode("tap")}
  tap --> ${howNode("another")}
  picture --> ${howNode("cam")}
  content --> ${howNode("lesson")}
  content --> ${howNode("file")}
  app --> file`,
      nodeInteractions: {
        writer: box("writer"),
        content: box("content", HOW_CODE.content),
        mmd: box("mmd"),
        picture: box("picture", HOW_CODE.picture),
        app: box("app"),
        hover: box("hover"),
        tap: box("tap", HOW_CODE.tap),
        another: box("another"),
        cam: box("cam"),
        lesson: box("lesson"),
        file: box("file"),
      },
      edgeInteractions: [HOW_ARROW.write, HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap, HOW_ARROW.toNext, HOW_ARROW.toCam, HOW_ARROW.toLesson, HOW_ARROW.toFile, HOW_ARROW.appToFile],
    },
    "how-show": {
      viewId: "how-show",
      tab: "how",
      parent: "how-draw",
      title: "show() draws one view",
      summary: "Every way of changing the diagram ends in show(). This is what it does, in order. Click a box for that part of the code.",
      story: md`
        Every way of changing the diagram, from a tab to Prev and Next, ends in one function, show(). So they all behave the same.

        This is what it does, top to bottom. The old picture fades out while Mermaid draws the new one, and the two run at the same time.
      `,
      chart: `flowchart TD
  hash["Link<br><small>Names the diagram to draw</small>"] --> showFn["show(viewId)<br><small>Every change of diagram goes through here</small>"]
  showFn --> leave["Fade out the old picture<br><small>Zooms toward the shape you opened</small>"]
  showFn --> render["mermaid.render<br><small>Mermaid draws the SVG</small>"]
  leave --> token["Drop a late result<br><small>A newer draw wins</small>"]
  render --> token
  token --> camBox["Place the camera<br><small>Saved zoom, or fit to the window</small>"]
  camBox --> bindN["Wire the shapes<br><small>Each note finds its shape</small>"]
  bindN --> bindE["Wire the arrows<br><small>Each arrow note finds its line</small>"]`,
      nodeInteractions: {
        hash: {
          label: "Link",
          tooltip: "The end of the link names the diagram to draw.",
          kicker: "Entry",
          body: md`
            Every diagram has an id, so a link can open any of them, not just the first tab. The page reads the last part of the hash. For example, #how/how-draw opens step 2 of this tab.

            The hash is replaced, not added to the browser history, so the browser's Back button leaves the page instead of stepping through diagrams.

            ~~~js source=openFromHash
            ~~~
          `,
          facts: [["Function", "openFromHash"], ["File", "js/nav.js"]],
        },
        showFn: {
          label: "show(viewId)",
          tooltip: "The only way the diagram on screen changes.",
          kicker: "Function",
          body: md`
            Tabs, the breadcrumb, a double-click, Prev and Next, and the link all change the diagram. They all call show(), so they all behave the same way.

            It first saves the zoom of the diagram being left, puts the panel back to the story of the new diagram, and redraws the tabs, the breadcrumb, and Prev and Next.

            ~~~js source=show
            ~~~
          `,
          facts: [["File", "js/nav.js"]],
        },
        leave: {
          label: "Fade out the old picture",
          tooltip: "The old picture zooms toward the shape you opened and fades.",
          kicker: "Motion",
          body: md`
            A diagram that just swaps is hard to follow, because you lose where the new one came from. So while Mermaid draws, the old picture zooms toward the shape you double-clicked and fades out, over 200 ms. It is skipped when the system asks for reduced motion.

            ~~~js source=leaveView
            ~~~
          `,
          facts: [["Function", "leaveView"], ["Time", "200 ms"]],
        },
        render: {
          label: "mermaid.render",
          tooltip: "Mermaid returns the SVG as text. It adds no clicks.",
          kicker: "Draw",
          body: md`
            Mermaid gets the view's Mermaid text and a fresh id. It runs at the same time as the fade, so the wait is not added up.

            ~~~js source=show
            ~~~
          `,
          facts: [["CDN", "mermaid@11"]],
        },
        token: {
          label: "Drop a late result",
          tooltip: "A slow draw must not cover a diagram you have already moved to.",
          kicker: "Guard",
          body: md`
            Drawing takes time, and the reader may not wait. For example, pressing Next twice quickly starts two draws. Each call to show() takes a new number. After the draw, if a newer call has started, this result is thrown away.

            ~~~js source=show
            ~~~
          `,
          facts: [["Variable", "app.renderToken"]],
        },
        camBox: {
          label: "Place the camera",
          tooltip: "A diagram seen before gets its zoom back. A new one is fitted.",
          kicker: "Camera",
          body: md`
            Coming back to a diagram should put you where you were, so each diagram keeps its own pan and zoom. A diagram you have not seen yet is fitted to the window instead.

            This happens before the shapes are wired, because some arrows are matched by where they sit on screen.

            ~~~js source=enterView,fit
            ~~~
          `,
          facts: [["Saved in", "app.cams"], ["Also", "the Fit button"]],
        },
        bindN: {
          label: "Wire the shapes",
          tooltip: "Each note finds its shape and the shape becomes a button.",
          kicker: "Bind",
          body: md`
            This is where a box becomes clickable. Double-click to see how a note finds its shape.

            ~~~js source=bindNodeInteractions
            ~~~
          `,
          opensView: "how-bind",
          facts: [["Function", "bindNodeInteractions"], ["File", "js/bind.js"]],
        },
        bindE: {
          label: "Wire the arrows",
          tooltip: "Each arrow note finds its line.",
          kicker: "Bind",
          body: md`
            Arrows are harder than shapes, because each chart type draws lines differently. Double-click to see the matchers.

            After the arrows, labels that Mermaid cut short are given room, and the search filter is applied to the new picture.

            ~~~js source=bindEdgeInteractions
            ~~~
          `,
          opensView: "how-edges",
          facts: [["Function", "bindEdgeInteractions"], ["File", "js/bind.js"]],
        },
      },
      edgeInteractions: [
        arrow("hash", "showFn", "The link picks the diagram.", "Only the last part of the hash is used.", [["Function", "openFromHash"]]),
        arrow("showFn", "leave", "The old picture starts to leave.", "Only when another diagram was on screen.", [["Function", "leaveView"]]),
        arrow("showFn", "render", "Mermaid starts drawing at the same time.", "The notes are not part of this call.", [["Arg", "view.chart"]]),
        arrow("leave", "token", "The fade finishes.", "show() waits for both the fade and the draw.", [["Call", "Promise.all"]]),
        arrow("render", "token", "The draw finishes, maybe late.", "A newer show() wins.", [["Check", "token !== app.renderToken"]]),
        arrow("token", "camBox", "The new picture is placed.", "Saved zoom, or fit.", [["Function", "enterView"]]),
        arrow("camBox", "bindN", "Shapes are wired on the placed picture.", "Each note looks for its shape.", [["Function", "bindNodeInteractions"]]),
        arrow("bindN", "bindE", "Arrows come after shapes.", "State arrows need the shape positions from the step before.", [["Function", "bindEdgeInteractions"]]),
      ],
    },
    "how-bind": {
      viewId: "how-bind",
      tab: "how",
      parent: "how-match",
      title: "Finding a shape",
      summary: "The chart type picks one rule for finding a note's shape. Click a box for that rule.",
      story: md`
        Mermaid gives each shape its own id, and builds it differently in each chart type. So the first line of the Mermaid text picks one rule, and the note's id is looked for with that rule.

        What the rule finds becomes a button, unless it is too small to be a real shape.
      `,
      chart: `flowchart TD
  kind["Chart type<br><small>The first line picks one rule</small>"] --> flowId["Flowchart id<br><small>Id ends in flowchart-api-3</small>"]
  kind --> c4Id["C4 alias<br><small>Id ends in -reader</small>"]
  kind --> seqName["Sequence name<br><small>The name attribute</small>"]
  kind --> stateId["State id<br><small>Id ends in state-Draft-1</small>"]
  flowId --> size["Skip tiny shapes<br><small>Under 8 by 8 px is skipped</small>"]
  c4Id --> size
  seqName --> size
  stateId --> size
  size --> wire["Make it a button<br><small>Hover, click, keyboard, and the ↘ badge</small>"]`,
      nodeInteractions: {
        kind: {
          label: "Chart type",
          tooltip: "The first line of the Mermaid text picks the rule.",
          kicker: "Rule",
          body: md`
            Mermaid names shapes differently in each chart type, so one rule cannot find them all. The first line, such as flowchart or sequenceDiagram, picks one rule. If that rule finds nothing, no other rule is tried, so a note cannot land on the wrong shape by accident.

            Other chart types still draw. Nothing on them is clickable.

            ~~~js source=chartKind
            ~~~
          `,
          facts: [["Function", "chartKind"]],
        },
        flowId: {
          label: "Flowchart id",
          tooltip: "The shape's id contains the id you wrote.",
          kicker: "Flowchart",
          body: md`
            In a flowchart, Mermaid builds the shape's id from the id you wrote. The note api matches the shape diagram-2-flowchart-api-3. The rule checks the end of the id, so the note api does not also catch api2.

            ~~~js
            const id = escapeRegExp(chartId);
            const pattern = new RegExp(\`(?:^|-)flowchart-\${id}-\\\\d+$\`);
            svg.querySelectorAll("g.node").forEach((el) => {
              if (pattern.test(el.id)) groups.add(el);
            });
            ~~~
          `,
          facts: [["Element", "g.node"]],
        },
        c4Id: {
          label: "C4 alias",
          tooltip: "The shape's id ends with the alias.",
          kicker: "C4",
          body: md`
            In C4, the shape's id ends with the alias you wrote. The note reader matches diagram-5-reader. Only C4 shapes are looked at, so an arrowhead with a similar id never becomes a button.

            ~~~js
            const id = escapeRegExp(chartId);
            const pattern = new RegExp(\`(?:^|-)\${id}$\`);
            svg.querySelectorAll("g.node.c4-shape").forEach((el) => {
              if (pattern.test(el.id)) groups.add(el);
            });
            ~~~
          `,
          facts: [["Element", "g.node.c4-shape"]],
        },
        seqName: {
          label: "Sequence name",
          tooltip: "The name attribute on the participant boxes.",
          kicker: "Sequence",
          body: md`
            In a sequence diagram, Mermaid's ids do not contain the participant id you wrote, but the name attribute does. A participant has a box at the top and at the bottom. Both match, so the same note opens from either one.

            ~~~js
            svg.querySelectorAll("rect.actor, g.actor-man").forEach((el) => {
              if (el.getAttribute("name") === chartId) groups.add(shapeGroup(el));
            });
            ~~~
          `,
          facts: [["Attribute", "name"]],
        },
        stateId: {
          label: "State id",
          tooltip: "The state name sits in the middle of the id.",
          kicker: "State",
          body: md`
            In a state diagram, the state name sits in the middle of the shape's id. The note Draft matches diagram-1-state-Draft-1. The start and end dots are named root_start and root_end, so they never match a note.

            ~~~js
            const id = escapeRegExp(chartId);
            const pattern = new RegExp(\`(?:^|-)state-\${id}-\\\\d+$\`);
            svg.querySelectorAll("g.node").forEach((el) => {
              if (pattern.test(el.id)) groups.add(el);
            });
            ~~~
          `,
          facts: [["Element", "g.node"]],
        },
        size: {
          label: "Skip tiny shapes",
          tooltip: "Anything under 8 by 8 pixels is not made clickable.",
          kicker: "Size",
          body: md`
            Some matches are not boxes a reader can see. Sequence lifelines carry the participant's name too, but they are tall and almost zero wide. They used to become invisible click targets, so anything under 8 by 8 pixels is skipped.

            ~~~js source=visibleShape
            ~~~
          `,
          facts: [["Function", "visibleShape"], ["Minimum", "8 by 8 px"]],
        },
        wire: {
          label: "Make it a button",
          tooltip: "The shape gets the hover, click, and keyboard listeners.",
          kicker: "Listen",
          body: md`
            A matched shape gets the listeners for hover, click, and double-click. It also becomes a Tab stop with a name a screen reader can say, and Enter or Space opens its panel. If it has an inner diagram, it gets the ↘ badge.

            ~~~js source=wireShape,makeInteractive
            ~~~
          `,
          facts: [["Function", "wireShape"], ["Badge", "addBadge"]],
        },
      },
      edgeInteractions: [
        arrow("kind", "flowId", "A flowchart uses the id you wrote.", "Mermaid adds a prefix and a number around it.", [["Ends", "flowchart-id-n"]]),
        arrow("kind", "c4Id", "C4 uses the alias.", "Only C4 shapes count.", [["Ends", "-alias"]]),
        arrow("kind", "seqName", "Sequence uses the name attribute.", "Top and bottom boxes both match.", [["Attribute", "name"]]),
        arrow("kind", "stateId", "A state diagram uses the state name.", "The start and end dots are separate.", [["Ends", "state-name-n"]]),
        arrow("flowId", "size", "Tiny shapes are dropped.", "The same check for every chart type.", [["Minimum", "8px"]]),
        arrow("c4Id", "size", "The same size check.", "C4 shapes pass.", [["Minimum", "8px"]]),
        arrow("seqName", "size", "Participant boxes pass.", "Lifelines do not.", [["Minimum", "8px"]]),
        arrow("stateId", "size", "State boxes pass.", "The start dot is not a note.", [["Minimum", "8px"]]),
        arrow("size", "wire", "What is left becomes clickable.", "A shape with an inner diagram also gets the ↘ badge.", [["Function", "wireShape"]]),
      ],
    },
    "how-edges": {
      viewId: "how-edges",
      tab: "how",
      parent: "how-match",
      title: "Finding an arrow",
      summary: "Each arrow note is taken by the first matcher that finds its line, and no later matcher can use it. Click a box for that matcher.",
      story: md`
        Arrows are harder to find than shapes, because most chart types do not put an arrow's ends in its id.

        So the page tries four matchers in order, and each arrow note is taken by the first one that finds its line. No later matcher can take it again.
      `,
      chart: `flowchart TD
  listed["Read the arrow notes<br><small>Each gets a key from its two ends</small>"] --> flowBox["Flowchart id<br><small>The line's id names both ends</small>"]
  flowBox --> seqBox["Sequence text<br><small>Matched by the message text</small>"]
  seqBox --> c4Box["C4 text<br><small>Matched by the relationship label</small>"]
  c4Box --> geoBox["State position<br><small>Matched by where it starts and ends</small>"]
  geoBox --> hitBox["Wide hit stroke<br><small>A wide invisible copy takes the pointer</small>"]`,
      nodeInteractions: {
        listed: {
          label: "Read the arrow notes",
          tooltip: "Each arrow note becomes a record with its two ends.",
          kicker: "0",
          body: md`
            Two arrows can join the same two shapes, so the ends alone do not tell them apart. Each arrow note gets a key made of its two ends and its place in the list, such as api-db-1. The panel title is the two shape labels joined by an arrow, unless the note sets its own label.

            ~~~js source=edgeInteractions
            ~~~
          `,
          facts: [["Function", "edgeInteractions"]],
        },
        flowBox: {
          label: "Flowchart id",
          tooltip: "The line's id names both ends.",
          kicker: "1",
          body: md`
            Flowchart arrows are the easy case, because Mermaid puts both ends in the line's id. The arrow from api to db ends in L_api_db_0. Two arrows between the same shapes are taken in order.

            The label is a separate element, so the page takes the nearest label that no other arrow has taken, within 160 diagram units of the middle of the line.

            ~~~js source=findFlowchartArrow,nearestFlowchartLabel
            ~~~
          `,
          facts: [["Function", "findFlowchartArrow"], ["Label", "nearestFlowchartLabel"]],
        },
        seqBox: {
          label: "Sequence text",
          tooltip: "Matched by the message text.",
          kicker: "2",
          body: md`
            Sequence arrows do not name their ends, so the page tells them apart by their text. The note must set mermaidText to the message. Case and spacing are ignored.

            Every note tries an exact match before any note falls back to "starts with". So a note for Pay does not take the line Pay refund from the note written for it. Each message is used once.

            ~~~js source=sequenceMessages,textMatches
            ~~~
          `,
          facts: [["Needs", "mermaidText"], ["Function", "sequenceMessages"]],
        },
        c4Box: {
          label: "C4 text",
          tooltip: "Matched by the relationship label.",
          kicker: "3",
          body: md`
            C4 arrows are also matched by their text, the label in Rel(api, db, "Reads"). C4 puts every relationship in one group: a line, then the text that belongs to it. Two arrows that both say Reads are taken in the order they were written.

            ~~~js source=c4Relations
            ~~~
          `,
          facts: [["Function", "c4Relations"], ["Order", "Source order"]],
        },
        geoBox: {
          label: "State position",
          tooltip: "Matched by which shapes the line starts and ends at.",
          kicker: "4",
          body: md`
            State arrows name neither end in their id, so they are matched by where they start and end. Each end of the line is compared with the centers of the shapes already wired, and the closest pairs win. That is why shapes are wired before arrows. The start and end dots are written as *.

            ~~~js source=matchStateArrows,shapeCentersOnScreen
            ~~~
          `,
          facts: [["Function", "matchStateArrows"], ["Start and end", "*"]],
        },
        hitBox: {
          label: "Wide hit stroke",
          tooltip: "The visible line is too thin to point at.",
          kicker: "5",
          body: md`
            A one-pixel line is hard to hover or click. So every matched line gets a transparent 18 px copy on top, and that copy takes the pointer. Only the stroke counts, so the empty space between lines is still a miss.

            The first stroke is the Tab stop. The label listens too, but it is not a second Tab stop.

            ~~~js source=addWideHitStroke
            ~~~

            ~~~css
            .edge-hit {
              fill: none;
              stroke: transparent;
              stroke-width: 18px;
              pointer-events: stroke;
            }
            ~~~
          `,
          facts: [["Class", "edge-hit"], ["Width", "18px"]],
        },
      },
      edgeInteractions: [
        arrow("listed", "flowBox", "Flowchart arrows are tried first.", "Their ids already name both ends.", [["Pattern", "L_from_to_n"]]),
        arrow("flowBox", "seqBox", "Notes not yet taken try sequence text.", "The note needs mermaidText.", [["Pair", "message text and line"]]),
        arrow("seqBox", "c4Box", "Then C4 relationships.", "Repeated labels are taken in order.", [["Flag", "wired"]]),
        arrow("c4Box", "geoBox", "State arrows are what remain.", "They are matched by position.", [["Class", "path.transition"]]),
        arrow("geoBox", "hitBox", "Every matched line gets a wide hit target.", "The visible line stays thin.", [["Class", "edge-hit"]]),
      ],
    },
    "how-panel": {
      viewId: "how-panel",
      tab: "how",
      parent: "how-click",
      title: "A note becomes the panel",
      summary: "What a click puts in the side panel. Click a box for that part of the code.",
      story: md`
        A note is written in markdown, but markdown turned into HTML could carry anything into the page.

        So the page only uses marked to split the note into pieces, and builds each piece itself, as text. Code is shown as written, or filled in from the page's own functions.
      `,
      chart: `flowchart TD
  note["Note<br><small>Markdown in the body field</small>"] --> lex["Split into pieces<br><small>marked splits it, the page builds it</small>"]
  lex --> build["Build as text<br><small>Set as text, never as HTML</small>"]
  lex --> fence["Code fence<br><small>Code shown as written</small>"]
  fence --> src["Print a loaded function<br><small>source=name fills in the code</small>"]
  links["Facts and links<br><small>Short rows, then the neighbors</small>"]`,
      nodeInteractions: {
        note: {
          label: "Note",
          tooltip: "The body field, written in markdown.",
          kicker: "Data",
          body: md`
            A note needs more than plain text: paragraphs, lists, and code. So the body is markdown. A note that holds code is written with the md tag and ~~~ fences, because a backtick fence would end the JavaScript string. md only removes the shared indent.

            ~~~~js
            body: md\`
              The cache is checked first.

              ~~~go
              if s, ok := cache.Get(id); ok { return s, nil }
              ~~~
            \`,
            ~~~~
          `,
          facts: [["Field", "body"], ["Helper", "md"]],
        },
        lex: {
          label: "Split into pieces",
          tooltip: "marked splits the markdown into paragraphs, lists, and code.",
          kicker: "Parse",
          body: md`
            The page uses marked only to split the note into pieces. It does not use marked's HTML, because then a note could put any HTML into the page.

            ~~~js source=renderNote
            ~~~
          `,
          facts: [["Call", "marked.lexer"], ["CDN", "marked@15"]],
        },
        build: {
          label: "Build as text",
          tooltip: "Each piece becomes an element with plain text in it.",
          kicker: "Safe",
          body: md`
            Each piece becomes an element, and its text is set as text, never as HTML. HTML written in a note is dropped, and so are images. A link must be http or https, and it opens in a new tab.

            ~~~js source=safeHref
            ~~~
          `,
          facts: [["Function", "appendBlock"], ["Links", "http and https only"]],
        },
        fence: {
          label: "Code fence",
          tooltip: "Code in the note is shown as written.",
          kicker: "Code",
          body: md`
            Code that is in no file, such as a config or a short sketch, is written straight into the note. The language after ~~~ is kept, so the reader can tell Go from SQL.
          `,
          facts: [["Fence", "~~~lang"]],
        },
        src: {
          label: "Print a loaded function",
          tooltip: "source=name shows that function as the page loaded it.",
          kicker: "Code",
          body: md`
            Copies of code in notes go stale, because nobody updates every copy when the code changes. So a fence written as ~~~js source=show has no body. The page fills it with the show function as it is loaded right now. A renamed function shows "is not loaded", so a stale note is visible.

            This only reaches the page's own functions. It is how this tab shows its code.

            ~~~js source=codeText
            ~~~
          `,
          facts: [["Function", "codeText"], ["Reads", "Function.prototype.toString"]],
        },
        links: {
          label: "Facts and links",
          tooltip: "Short rows, then links to what this shape connects to.",
          kicker: "Panel",
          body: md`
            Facts are short term and value rows from the note. Links move around the picture without hunting for small arrows: an arrow links to its two ends, and a shape links to every arrow in and out. Each link opens that note.

            ~~~js source=renderLinks
            ~~~
          `,
          facts: [["Field", "facts"], ["Function", "renderLinks"]],
        },
      },
      edgeInteractions: [
        arrow("note", "lex", "The markdown is split, not turned into HTML.", "Only the pieces are used.", [["Call", "marked.lexer"]]),
        arrow("lex", "build", "Text pieces become elements.", "Their text is set as text.", [["Function", "appendBlock"]]),
        arrow("lex", "fence", "Code pieces become code blocks.", "The text is shown as written.", [["Element", "pre"]]),
        arrow("fence", "src", "A source= fence is filled from the page.", "Only the page's own functions.", [["Function", "codeText"]]),
      ],
    },
  },
};
