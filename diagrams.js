function arrow(from, to, tooltip, body, facts, more) {
  return { from, to, kicker: "Arrow", tooltip, body, facts: facts || [], ...(more || {}) };
}

function md(strings, ...values) {
  const text = strings.reduce((acc, part, i) => acc + part + (values[i] ?? ""), "");
  const rows = text.replace(/^\n/, "").replace(/\n\s*$/, "").split("\n");
  const widths = rows.filter((row) => row.trim()).map((row) => row.match(/^ */)[0].length);
  const indent = widths.length ? Math.min(...widths) : 0;
  return rows.map((row) => row.slice(indent)).join("\n").trim();
}

const HOW_BOX = {
  chart: {
    label: "Chart text",
    tooltip: "The string stored on the view. Mermaid is the only reader.",
    kicker: "Data",
    body: md`
      A view keeps the picture and the notes apart. view.chart is the Mermaid source. The tooltip, the panel text, and opensView are siblings of that string. Mermaid never sees them. securityLevel is strict, so Mermaid's own click syntax stays off. This page binds the finished SVG so flowchart, C4, sequence, and state share one panel.

      ~~~js
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        flowchart: { htmlLabels: true, useMaxWidth: false },
      });
      ~~~
    `,
    facts: [["File", "diagrams.js"], ["Field", "view.chart"]],
  },
  mmd: {
    label: "Mermaid",
    tooltip: "Draws the SVG. It does not know about the side panel.",
    kicker: "Code",
    body: md`
      show() sends view.chart to mermaid.render and keeps a token. If the reader opens another view before this draw finishes, the token no longer matches and the late SVG is dropped. Double-click this box to walk that function.

      ~~~js
      async function show(viewId, fromInteraction) {
        const view = app.views[viewId];
        if (!view) return;
        if (app.view) app.cams[app.view.viewId] = { ...app.cam };
        const origin = wiredElements(fromInteraction);
        app.view = view;
        app.stack = pathTo(view);
        closePanel();
        const token = ++app.renderToken;
        const [{ svg }] = await Promise.all([
          mermaid.render(\`diagram-\${token}\`, view.chart),
          leaveView(origin),
        ]);
        if (token !== app.renderToken) return;
        app.els.camera.innerHTML = svg;
        const svgEl = app.els.camera.querySelector("svg");
        enterView(app.cams[viewId]);
        bindNodeInteractions(svgEl);
        bindEdgeInteractions(svgEl);
        applySearch();
      }
      ~~~
    `,
    opensView: "how-show",
    facts: [["Function", "show"], ["File", "js/nav.js"]],
  },
  picture: {
    label: "Picture",
    tooltip: "The SVG that lands in #camera.",
    kicker: "DOM",
    body: md`
      The page copies the SVG into #camera and sets its width and height from the viewBox, so later scaling uses the real size. bindNodeInteractions and bindEdgeInteractions run after that. They are what make the shapes and arrows clickable.

      ~~~js
      async function show(viewId, fromInteraction) {
        const view = app.views[viewId];
        if (!view) return;
        if (app.view) app.cams[app.view.viewId] = { ...app.cam };
        const origin = wiredElements(fromInteraction);
        app.view = view;
        app.stack = pathTo(view);
        closePanel();
        const token = ++app.renderToken;
        const [{ svg }] = await Promise.all([
          mermaid.render(\`diagram-\${token}\`, view.chart),
          leaveView(origin),
        ]);
        if (token !== app.renderToken) return;
        app.els.camera.innerHTML = svg;
        const svgEl = app.els.camera.querySelector("svg");
        enterView(app.cams[viewId]);
        bindNodeInteractions(svgEl);
        bindEdgeInteractions(svgEl);
        applySearch();
      }
      ~~~
    `,
    facts: [["Element", "#camera"], ["Then", "bindNodeInteractions, bindEdgeInteractions"]],
  },
  notes: {
    label: "Notes",
    tooltip: "Node interactions and edge interactions, keyed like the chart.",
    kicker: "Data",
    body: md`
      The map key is the chartId. The node interaction does not store chartId itself. nodeInteractions() copies the key on before matching. opensView is the viewId of the inner diagram. arrow() builds an edge interaction from the two chartIds plus the panel text. An arrow can have opensView too. Checkout's New card arrow and the login POST /login arrow both open another diagram.

      ~~~js
      browser: {
        label: "Browser",
        tooltip: "The reader's browser.",
        kicker: "Client",
        body: "Renders the pages and stores the session cookie.",
        facts: [["Calls", "Web app"]],
      }

      arrow("browser", "cdn", "The browser loads files from the CDN.", "This path is cacheable.")
      ~~~
    `,
    facts: [["File", "diagrams.js"], ["Helper", "arrow()"]],
  },
  app: {
    label: "Scripts",
    tooltip: "Finds each note in the SVG, then listens. The matcher is js/bind.js.",
    kicker: "Code",
    body: md`
      The first line of the chart picks the pattern. A flowchart node api is a g.node whose id ends in flowchart-api-3, after the render prefix diagram-2-. A C4 alias is a g.node.c4-shape whose id ends in -reader. A sequence actor is the name on the top and bottom boxes. A state Draft is a g.node whose id ends in state-Draft-1. A box under 8 by 8 pixels is ignored.

      ~~~js
      function findMermaidShapes(svg, node) {
        const kind = chartKind(app.view.chart);
        const id = escapeRegExp(node.id);
        if (kind === "flowchart") {
          const pattern = new RegExp(\`(?:^|-)flowchart-\${chartId}-\\\\d+$\`);
          svg.querySelectorAll("g.node").forEach((el) => {
            if (pattern.test(el.id)) groups.add(el);
          });
        } else if (kind === "c4") {
          const pattern = new RegExp(\`(?:^|-)\${chartId}$\`);
          svg.querySelectorAll("g.node.c4-shape").forEach((el) => {
            if (pattern.test(el.id)) groups.add(el);
          });
        }
      }
      ~~~
    `,
    facts: [["Function", "findMermaidShapes"], ["File", "js/bind.js"]],
  },
  hover: {
    label: "Hover",
    tooltip: "Neighbors stay solid. The rest fade a little.",
    kicker: "Input",
    body: md`
      highlightAround() keeps this shape and every arrow that touches it. The others get is-dim. Leaving the shape calls applySearch(), so a click does not leave the highlight stuck. Search uses the same dim and also looks through arrow text. The opacity is 0.72. It used to be 0.28, which hid the rest of the picture too hard.

      ~~~js
      function highlightAround(interaction) {
        // hot: this node and every edge that touches it
        el.classList.toggle("is-dim", active && !on);
        el.classList.toggle("is-hot", active && on);
      }

      .is-dim { opacity: 0.72; }
      ~~~
    `,
    facts: [["Function", "highlightAround"], ["CSS", ".is-dim"]],
  },
  tap: {
    label: "Click",
    tooltip: "Opens the side panel.",
    kicker: "Input",
    body: md`
      The panel opens on the first click. The green ↘ badge calls show() instead. openPanel fills the title, the lead, this note, and the facts. The note is markdown, so the code below is part of that text. markSelected puts is-selected on the shape or arrow, so the picture shows what the panel is about. The camera keeps its pan and zoom. reveal() only pans when the panel now covers the selected shape. renderLinks lists the two ends of an arrow, or every arrow in and out of a shape. Each link opens that note's panel.

      ~~~js
      function onInteractionClick(event, interaction) {
        if (event.target.closest(".zoom-badge")) {
          show(interaction.opensView);
          return;
        }
        openPanel(interaction);
      }

      function openPanel(interaction) {
        panel.title.textContent = interaction.label;
        renderNote(panel.body, interaction.body || "");
        const selected = markSelected(interaction);
        requestAnimationFrame(() => reveal(selected));
      }
      ~~~
    `,
    facts: [["Function", "onInteractionClick"], ["Camera", "kept, reveal() pans if needed"]],
  },
  another: {
    label: "Another chart",
    tooltip: "show() swaps in a different view.",
    kicker: "Next",
    body: md`
      This is a new SVG, not a closer look at the same one. While Mermaid draws it, leaveView() zooms the old picture toward the shape you opened and fades it out. Each view keeps its own camera in app.cams, so stepping back up restores the pan and zoom you left. pathTo() walks view.parent to build the breadcrumb. The hash becomes #parent/child through replaceState, so the browser Back button leaves the page instead of stepping up. Escape closes the panel first, then steps up. Backspace steps up when you are not typing in the search box.

      ~~~js
      function onInteractionDblClick(event, interaction) {
        window.getSelection()?.removeAllRanges();
        if (interaction.opensView) show(interaction.opensView);
        else openPanel(interaction);
      }

      #camera, #camera * { user-select: none; }
      ~~~
    `,
    facts: [["Function", "show"], ["Hash", "replaceState"]],
  },
  cam: {
    label: "Scale",
    tooltip: "The wheel and the + / - buttons change cam.s.",
    kicker: "Camera",
    body: md`
      cam is x, y, and s. applyCam writes that as a CSS transform on #camera. Dragging empty space changes x and y. The drag ignores nodes, arrows, labels, and the wide hit stroke. Fit recomputes all three so the picture sits in the viewport. Double-click does not use this camera. It calls show().

      ~~~js
      app.cam = { x: 40, y: 32, s: 1 };

      // The + / - buttons zoom at the center. The wheel zooms at the pointer.
      function zoomAt(px, py, factor) {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, app.cam.s * factor));
        const k = next / app.cam.s;
        app.cam.x = px - (px - app.cam.x) * k;
        app.cam.y = py - (py - app.cam.y) * k;
        app.cam.s = next;
        applyCam();
      }

      function applyCam() {
        app.els.camera.style.transform = \`translate(\${app.cam.x}px, \${app.cam.y}px) scale(\${app.cam.s})\`;
      }
      ~~~
    `,
    facts: [["Function", "zoomAt"], ["Range", "0.35 to 2.6"]],
  },
};

const HOW_ARROW = {
  draw: arrow(
    "chart",
    "mmd",
    "Only the chart string is passed to Mermaid.",
    md`
      mermaid.render gets view.chart and a fresh id. The notes stay in JavaScript.

      ~~~js
      async function show(viewId, fromInteraction) {
        const view = app.views[viewId];
        if (!view) return;
        if (app.view) app.cams[app.view.viewId] = { ...app.cam };
        const origin = wiredElements(fromInteraction);
        app.view = view;
        app.stack = pathTo(view);
        closePanel();
        const token = ++app.renderToken;
        const [{ svg }] = await Promise.all([
          mermaid.render(\`diagram-\${token}\`, view.chart),
          leaveView(origin),
        ]);
        if (token !== app.renderToken) return;
        app.els.camera.innerHTML = svg;
        const svgEl = app.els.camera.querySelector("svg");
        enterView(app.cams[viewId]);
        bindNodeInteractions(svgEl);
        bindEdgeInteractions(svgEl);
        applySearch();
      }
      ~~~
    `,
    [["Call", "mermaid.render"]],
  ),
  drawn: arrow(
    "mmd",
    "picture",
    "The return value is an SVG string.",
    md`
      show() inserts that string into #camera. A stale render is ignored when app.renderToken has already moved on.

      ~~~js
      async function show(viewId, fromInteraction) {
        const view = app.views[viewId];
        if (!view) return;
        if (app.view) app.cams[app.view.viewId] = { ...app.cam };
        const origin = wiredElements(fromInteraction);
        app.view = view;
        app.stack = pathTo(view);
        closePanel();
        const token = ++app.renderToken;
        const [{ svg }] = await Promise.all([
          mermaid.render(\`diagram-\${token}\`, view.chart),
          leaveView(origin),
        ]);
        if (token !== app.renderToken) return;
        app.els.camera.innerHTML = svg;
        const svgEl = app.els.camera.querySelector("svg");
        enterView(app.cams[viewId]);
        bindNodeInteractions(svgEl);
        bindEdgeInteractions(svgEl);
        applySearch();
      }
      ~~~
    `,
    [["Guard", "token !== app.renderToken"]],
  ),
  beside: arrow(
    "chart",
    "notes",
    "The notes use the same ids as the chart.",
    md`
      Nothing in this arrow is drawn by Mermaid. It is here so you can see that the notes sit next to the chart instead of inside it.

      ~~~js
      browser: {
        label: "Browser",
        tooltip: "The reader's browser.",
        kicker: "Client",
        body: "Renders the pages and stores the session cookie.",
        facts: [["Calls", "Web app"]],
      }

      arrow("browser", "cdn", "The browser loads files from the CDN.", "This path is cacheable.")
      ~~~
    `,
    [["Ids", "Map keys"]],
  ),
  toApp: arrow(
    "notes",
    "app",
    "bind.js reads the notes after the SVG exists.",
    md`
      bindNodeInteractions walks the node interactions on app.view. bindEdgeInteractions walks the edge interactions. Both run inside show(), after the SVG is in the page.

      ~~~js
      function wireShape(shape, interaction) {
        shape.classList.add("is-node");
        shape.dataset.chartId = interaction.chartId;
        makeInteractive(shape, interaction, true);
        if (interaction.opensView) addBadge(shape);
      }

      // Arrows call the same function, so a shape and an arrow listen the same way.
      function makeInteractive(el, interaction, keyboardButton) {
        if (keyboardButton) el.setAttribute("role", "button");
        el.addEventListener("pointerenter", (event) => showTooltip(event, interaction));
        el.addEventListener("click", (event) => onInteractionClick(event, interaction));
        el.addEventListener("dblclick", (event) => onInteractionDblClick(event, interaction));
      }
      ~~~
    `,
    [["Order", "render, then bind"]],
  ),
  fromPic: arrow(
    "picture",
    "app",
    "The SVG is the other input to the match.",
    md`
      findMermaidShapes uses the chart type. Flowchart and state match a g.node id. C4 matches a g.node.c4-shape id. Sequence matches the name on the actor boxes.

      ~~~js
      function chartKind(chart) {
        const line = chart.trim().split("\\n")[0].trim();
        if (line.startsWith("flowchart")) return "flowchart";
        if (line.startsWith("C4")) return "c4";
        if (line.startsWith("sequenceDiagram")) return "sequence";
        if (line.startsWith("stateDiagram")) return "state";
      }
      ~~~
    `,
    [["Function", "findMermaidShapes"]],
  ),
  toHover: arrow(
    "app",
    "hover",
    "pointerenter calls showTooltip, which calls highlightAround.",
    md`
      The tooltip is a fixed div. It is not a Mermaid tooltip. It follows the pointer and flips when it would leave the window.

      ~~~js
      function highlightAround(interaction) {
        // hot: this node and every edge that touches it
        el.classList.toggle("is-dim", active && !on);
        el.classList.toggle("is-hot", active && on);
      }

      .is-dim { opacity: 0.72; }
      ~~~
    `,
    [["Function", "showTooltip"]],
  ),
  toTap: arrow(
    "app",
    "tap",
    "click and dblclick are both attached in wireShape().",
    md`
      Arrows use the same two handlers. watchEdge registers them on the hit stroke and on the label.

      ~~~js
      function onInteractionClick(event, interaction) {
        if (event.target.closest(".zoom-badge")) {
          show(interaction.opensView);
          return;
        }
        openPanel(interaction);
      }

      function openPanel(interaction) {
        panel.title.textContent = interaction.label;
        renderNote(panel.body, interaction.body || "");
        const selected = markSelected(interaction);
        requestAnimationFrame(() => reveal(selected));
      }
      ~~~
    `,
    [["Shared", "onInteractionClick"]],
  ),
  toNext: arrow(
    "tap",
    "another",
    "Double-click calls show(opensView), which closes the panel.",
    md`
      The first click of a double-click has already opened the panel. The double-click clears the text selection and draws the next view. show() closes the panel on the way.

      ~~~js
      function onInteractionDblClick(event, interaction) {
        window.getSelection()?.removeAllRanges();
        if (interaction.opensView) show(interaction.opensView);
        else openPanel(interaction);
      }

      #camera, #camera * { user-select: none; }
      ~~~
    `,
    [["Function", "onInteractionDblClick"]],
  ),
  toCam: arrow(
    "picture",
    "cam",
    "The scroll wheel scales this SVG. It does not load another chart.",
    md`
      zoomAt multiplies cam.s around one point: the viewport center for the buttons, the pointer for the wheel. The limits are 0.35 and 2.6.

      ~~~js
      app.cam = { x: 40, y: 32, s: 1 };

      // The + / - buttons zoom at the center. The wheel zooms at the pointer.
      function zoomAt(px, py, factor) {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, app.cam.s * factor));
        const k = next / app.cam.s;
        app.cam.x = px - (px - app.cam.x) * k;
        app.cam.y = py - (py - app.cam.y) * k;
        app.cam.s = next;
        applyCam();
      }

      function applyCam() {
        app.els.camera.style.transform = \`translate(\${app.cam.x}px, \${app.cam.y}px) scale(\${app.cam.s})\`;
      }
      ~~~
    `,
    [["Function", "zoomAt"]],
  ),
};
function box(id, extra) {
  return { ...HOW_BOX[id], ...(extra || {}) };
}

window.DIAGRAMS = {
  tabs: [
    { id: "architecture", label: "Architecture" },
    { id: "c4", label: "C4" },
    { id: "checkout", label: "Flow" },
    { id: "login", label: "Sequence" },
    { id: "order", label: "State" },
    { id: "how", label: "How", lesson: ["how", "how-notes", "how-match", "how-hover", "how-click", "how-twozoom", "how-camera"] },
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
      title: "1. Mermaid draws",
      summary: "Start here. Mermaid turns the chart string into a picture. Double-click Picture to add the notes. Double-click Mermaid to read show().",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]`,
      nodeInteractions: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", {
          kicker: "Next",
          opensView: "how-notes",
          tooltip: "The SVG in the page. The next picture adds the notes.",
        }),
      },
      edgeInteractions: [HOW_ARROW.draw, HOW_ARROW.drawn],
    },
    "how-notes": {
      viewId: "how-notes",
      tab: "how",
      parent: null,
      title: "2. Notes sit beside the chart",
      summary: "Same picture, plus the notes. Double-click Notes to add the matcher. Double-click Picture to read how arrows are found.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]`,
      nodeInteractions: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", {
          kicker: "Code",
          opensView: "how-edges",
          tooltip: "The SVG. Open it to read how an arrow is matched.",
        }),
        notes: box("notes", {
          kicker: "Next",
          opensView: "how-match",
          tooltip: "The node and edge interactions. The next picture adds the matcher.",
        }),
      },
      edgeInteractions: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside],
    },
    "how-match": {
      viewId: "how-match",
      tab: "how",
      parent: null,
      title: "3. Scripts match them",
      summary: "The notes and the picture both go into the page scripts. Double-click Scripts to add hover. Double-click Notes to read the box matcher.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]
  notes --> app["Scripts"]
  picture --> app`,
      nodeInteractions: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", {
          kicker: "Code",
          opensView: "how-edges",
          tooltip: "The SVG. Open it to read how an arrow is matched.",
        }),
        notes: box("notes", {
          kicker: "Code",
          opensView: "how-bind",
          tooltip: "The notes. Open them to read how a box is found.",
        }),
        app: box("app", {
          kicker: "Next",
          opensView: "how-hover",
          tooltip: "The matcher. The next picture adds hover.",
        }),
      },
      edgeInteractions: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic],
    },
    "how-hover": {
      viewId: "how-hover",
      tab: "how",
      parent: null,
      title: "4. Hover lights the neighbors",
      summary: "Hover is the new piece. Double-click Hover to add click. The other ↘ boxes open the code for drawing, boxes, and arrows.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]
  notes --> app["Scripts"]
  picture --> app
  app --> hover["Hover"]`,
      nodeInteractions: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", { kicker: "Code", opensView: "how-edges", tooltip: "The SVG. Open it to read how an arrow is matched." }),
        notes: box("notes", { kicker: "Code", opensView: "how-bind", tooltip: "The notes. Open them to read how a box is found." }),
        app: box("app"),
        hover: box("hover", {
          kicker: "Next",
          opensView: "how-click",
          tooltip: "Pointer enter. The next picture adds click.",
        }),
      },
      edgeInteractions: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover],
    },
    "how-click": {
      viewId: "how-click",
      tab: "how",
      parent: null,
      title: "5. Click opens the panel",
      summary: "Click is the new piece. Double-click Click to see what a double-click does instead.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]
  notes --> app["Scripts"]
  picture --> app
  app --> hover["Hover"]
  app --> tap["Click"]`,
      nodeInteractions: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", { kicker: "Code", opensView: "how-edges", tooltip: "The SVG. Open it to read how an arrow is matched." }),
        notes: box("notes", { kicker: "Code", opensView: "how-bind", tooltip: "The notes. Open them to read how a box is found." }),
        app: box("app"),
        hover: box("hover"),
        tap: box("tap", {
          kicker: "Next",
          opensView: "how-twozoom",
          tooltip: "Opens this panel. The next picture shows double-click.",
        }),
      },
      edgeInteractions: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap],
    },
    "how-twozoom": {
      viewId: "how-twozoom",
      tab: "how",
      parent: null,
      title: "6. Double-click draws another chart",
      summary: "Another chart is the new piece. It replaces the SVG. Double-click it to add the camera, which only scales this picture.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]
  notes --> app["Scripts"]
  picture --> app
  app --> hover["Hover"]
  app --> tap["Click"]
  tap --> another["Another chart"]`,
      nodeInteractions: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", { kicker: "Code", opensView: "how-edges", tooltip: "The SVG. Open it to read how an arrow is matched." }),
        notes: box("notes", { kicker: "Code", opensView: "how-bind", tooltip: "The notes. Open them to read how a box is found." }),
        app: box("app"),
        hover: box("hover"),
        tap: box("tap"),
        another: box("another", {
          kicker: "Next",
          opensView: "how-camera",
          tooltip: "A different view, drawn from scratch. The next picture adds the camera.",
        }),
      },
      edgeInteractions: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap, HOW_ARROW.toNext],
    },
    "how-camera": {
      viewId: "how-camera",
      tab: "how",
      parent: null,
      title: "7. The wheel only scales",
      summary: "Scale is the last piece. The wheel changes cam.s. It does not call show(). Click any box for the code.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]
  notes --> app["Scripts"]
  picture --> app
  app --> hover["Hover"]
  app --> tap["Click"]
  tap --> another["Another chart"]
  picture --> cam["Scale"]`,
      nodeInteractions: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", { kicker: "Code", opensView: "how-edges", tooltip: "The SVG. Open it to read how an arrow is matched." }),
        notes: box("notes", { kicker: "Code", opensView: "how-bind", tooltip: "The notes. Open them to read how a box is found." }),
        app: box("app"),
        hover: box("hover"),
        tap: box("tap"),
        another: box("another"),
        cam: box("cam"),
      },
      edgeInteractions: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap, HOW_ARROW.toNext, HOW_ARROW.toCam],
    },
    "how-show": {
      viewId: "how-show",
      tab: "how",
      parent: "how",
      title: "show() draws one view",
      summary: "What show() does, in order. Click a box for that step's code. Back returns to the first picture.",
      chart: `flowchart TD
  hash["Hash"] --> showFn["show(viewId)"]
  showFn --> render["mermaid.render"]
  render --> token["Drop a stale SVG"]
  token --> bindN["bindNodeInteractions"]
  bindN --> bindE["bindEdgeInteractions"]
  bindE --> fitBox["fit"]`,
      nodeInteractions: {
        hash: {
          label: "Hash",
          tooltip: "The last viewId in the hash is the view to draw.",
          kicker: "Entry",
          body: md`
            openFromHash splits location.hash on slashes and keeps the last viewId. #how/how-notes opens the notes picture. The hash is updated with replaceState, so moving between views does not push browser history.

            ~~~js
            function openFromHash() {
              const ids = location.hash.replace(/^#/, "").split("/").filter(Boolean);
              const viewId = ids[ids.length - 1];
              show(app.views[viewId] ? viewId : DIAGRAMS.tabs[0].id);
            }
            ~~~
          `,
          facts: [["Function", "openFromHash"], ["File", "js/nav.js"]],
        },
        showFn: {
          label: "show(viewId)",
          tooltip: "Looks up the view and clears the panel.",
          kicker: "Function",
          body: md`
            app.views is DIAGRAMS.views. pathTo walks parent links for the breadcrumb. closePanel runs first so the old detail does not sit on top of the new picture.

            ~~~js
            async function show(viewId, fromInteraction) {
              const view = app.views[viewId];
              if (!view) return;
              if (app.view) app.cams[app.view.viewId] = { ...app.cam };
              const origin = wiredElements(fromInteraction);
              app.view = view;
              app.stack = pathTo(view);
              closePanel();
              const token = ++app.renderToken;
              const [{ svg }] = await Promise.all([
                mermaid.render(\`diagram-\${token}\`, view.chart),
                leaveView(origin),
              ]);
              if (token !== app.renderToken) return;
              app.els.camera.innerHTML = svg;
              const svgEl = app.els.camera.querySelector("svg");
              enterView(app.cams[viewId]);
              bindNodeInteractions(svgEl);
              bindEdgeInteractions(svgEl);
              applySearch();
            }
            ~~~
          `,
          facts: [["File", "js/nav.js"]],
        },
        render: {
          label: "mermaid.render",
          tooltip: "Mermaid returns an SVG string. It does not bind clicks.",
          kicker: "Draw",
          body: md`
            The first argument is a DOM id that must be unique per call, so it includes the token. The second argument is only view.chart. startOnLoad is false because this page calls render itself.

            ~~~js
            mermaid.initialize({
              startOnLoad: false,
              securityLevel: "strict",
              flowchart: { htmlLabels: true, useMaxWidth: false },
            });

            async function show(viewId, fromInteraction) {
              const view = app.views[viewId];
              if (!view) return;
              if (app.view) app.cams[app.view.viewId] = { ...app.cam };
              const origin = wiredElements(fromInteraction);
              app.view = view;
              app.stack = pathTo(view);
              closePanel();
              const token = ++app.renderToken;
              const [{ svg }] = await Promise.all([
                mermaid.render(\`diagram-\${token}\`, view.chart),
                leaveView(origin),
              ]);
              if (token !== app.renderToken) return;
              app.els.camera.innerHTML = svg;
              const svgEl = app.els.camera.querySelector("svg");
              enterView(app.cams[viewId]);
              bindNodeInteractions(svgEl);
              bindEdgeInteractions(svgEl);
              applySearch();
            }
            ~~~
          `,
          facts: [["CDN", "mermaid@11"]],
        },
        token: {
          label: "Drop a stale SVG",
          tooltip: "A slower draw must not overwrite a newer one.",
          kicker: "Guard",
          body: md`
            app.renderToken increments at the start of show(). After the await, the function returns if another show() has started. The same check wraps the error message.

            ~~~js
            const token = ++app.renderToken;
            const { svg } = await mermaid.render(\`diagram-\${token}\`, view.chart);
            if (token !== app.renderToken) return;
            app.els.camera.innerHTML = svg;
            ~~~
          `,
          facts: [["Variable", "app.renderToken"]],
        },
        bindN: {
          label: "bindNodeInteractions",
          tooltip: "Attaches each note to the shape Mermaid drew.",
          kicker: "Bind",
          body: md`
            This is where a box becomes a button. The next diagrams cover the match itself. From the third picture, double-click Notes.

            ~~~js
            function wireShape(shape, interaction) {
              shape.classList.add("is-node");
              shape.dataset.chartId = interaction.chartId;
              makeInteractive(shape, interaction, true);
              if (interaction.opensView) addBadge(shape);
            }

            // Arrows call the same function, so a shape and an arrow listen the same way.
            function makeInteractive(el, interaction, keyboardButton) {
              if (keyboardButton) el.setAttribute("role", "button");
              el.addEventListener("pointerenter", (event) => showTooltip(event, interaction));
              el.addEventListener("click", (event) => onInteractionClick(event, interaction));
              el.addEventListener("dblclick", (event) => onInteractionDblClick(event, interaction));
            }
            ~~~
          `,
          opensView: "how-bind",
          facts: [["Function", "bindNodeInteractions"]],
        },
        bindE: {
          label: "bindEdgeInteractions",
          tooltip: "Attaches each note to the arrow Mermaid drew.",
          kicker: "Bind",
          body: md`
            Arrows are harder than boxes because the four diagram types draw lines differently. That walk is the edges picture.

            ~~~js
            edges.forEach((edge) => {
              const path = findFlowchartArrow(svg, edge);
              if (!path || path.dataset.wired) return;
              claimEdge(edge, [path, nearestFlowchartLabel(path, labels)]);
            });

            function claimByText(items, pieces) {
              edges.forEach((edge) => {
                if (wired.has(edge) || !edge.mermaidText) return;
                const item = items.find((candidate) => !candidate.wired && textMatches(candidate.label, edge.mermaidText));
                if (!item) return;
                item.wired = true;
                claimEdge(edge, pieces(item));
              });
            }

            claimByText(sequenceMessages(svg), (message) => [message.line, message.text]);
            claimByText(c4Relations(svg), (relation) => [...relation.strokes, ...relation.texts]);
            ~~~
          `,
          opensView: "how-edges",
          facts: [["Function", "bindEdgeInteractions"]],
        },
        fitBox: {
          label: "fit",
          tooltip: "Scales the new SVG so it sits in the viewport.",
          kicker: "Camera",
          body: md`
            enterView() runs before bindNodeInteractions, so the matcher sees the picture at its final scale. A view opened before gets its saved camera from app.cams. A new view gets fit(), which sets app.cam.x, app.cam.y, and app.cam.s. Opening the panel does not call fit(). It calls reveal(), which only pans.

            ~~~js
            function fit() {
              const box = svg.viewBox.baseVal;
              const pad = 48;
              // Prev and Next sit on the top left of the diagram. Fit starts below them.
              const top = app.els.lesson.hidden ? pad / 2 : app.els.lesson.offsetTop + app.els.lesson.offsetHeight + 12;
              const height = app.els.viewport.clientHeight - top - pad / 2;
              const s = Math.min((app.els.viewport.clientWidth - pad) / box.width, height / box.height, 1.35);
              app.cam.s = Number.isFinite(s) && s > 0 ? s : 1;
              app.cam.x = (app.els.viewport.clientWidth - box.width * app.cam.s) / 2;
              app.cam.y = top + Math.max(0, (height - box.height * app.cam.s) / 2);
              applyCam();
            }
            ~~~
          `,
          facts: [["Also", "the Fit button"]],
        },
      },
      edgeInteractions: [
        arrow("hash", "showFn", "The hash selects the view.", "Only the last segment is used.", [["Function", "openFromHash"]]),
        arrow("showFn", "render", "show() asks Mermaid to draw.", "The notes are not in this call.", [["Arg", "view.chart"]]),
        arrow("render", "token", "The await can finish late.", "A newer show() wins.", [["Check", "token !== app.renderToken"]]),
        arrow("token", "bindN", "Boxes are bound after the SVG is inserted.", "findMermaidShapes runs per chartId.", [["Function", "bindNodeInteractions"]]),
        arrow("bindN", "bindE", "Arrows are bound after boxes.", "State arrows need the shape centers from this pass.", [["Function", "bindEdgeInteractions"]]),
        arrow("bindE", "fitBox", "The camera was placed before the binders ran.", "enterView() restores app.cams[viewId] or calls fit().", [["Call", "enterView"]]),
      ],
    },
    "how-bind": {
      viewId: "how-bind",
      tab: "how",
      parent: "how-match",
      title: "Finding a box",
      summary: "The chart type picks one rule. Click a box for that pattern. Back returns to the matcher picture.",
      chart: `flowchart TD
  kind["Chart type"] --> flowId["Flowchart id"]
  kind --> c4Id["C4 alias"]
  kind --> seqName["Sequence name"]
  kind --> stateId["State id"]
  flowId --> size["Skip tiny boxes"]
  c4Id --> size
  seqName --> size
  stateId --> size
  size --> wire["wireShape"]`,
      nodeInteractions: {
        kind: {
          label: "Chart type",
          tooltip: "The first line of view.chart chooses the pattern.",
          kicker: "Rule",
          body: md`
            flowchart, C4, sequenceDiagram, and stateDiagram each name the shape differently. findMermaidShapes runs only that pattern. A miss does not fall through to another one. It takes the chartId. The stored node interaction does not keep that id; nodeInteractions() adds chartId from the map key.

            ~~~js
            function chartKind(chart) {
              const line = chart.trim().split("\\n")[0].trim();
              if (line.startsWith("flowchart")) return "flowchart";
              if (line.startsWith("C4")) return "c4";
              if (line.startsWith("sequenceDiagram")) return "sequence";
              if (line.startsWith("stateDiagram")) return "state";
            }
            ~~~
          `,
          facts: [["Function", "chartKind"]],
        },
        flowId: {
          label: "Flowchart id",
          tooltip: "g.node ending in flowchart-api-3.",
          kicker: "Flowchart",
          body: md`
            Mermaid prefixes the id with the render id. The note api matches diagram-2-flowchart-api-3. The pattern is anchored at the end, and only g.node is considered.

            ~~~js
            const pattern = new RegExp(\`(?:^|-)flowchart-\${chartId}-\\\\d+$\`);
            svg.querySelectorAll("g.node").forEach((el) => {
              if (pattern.test(el.id)) groups.add(el);
            });
            ~~~
          `,
          facts: [["Element", "g.node"]],
        },
        c4Id: {
          label: "C4 alias",
          tooltip: "g.node.c4-shape ending in -reader.",
          kicker: "C4",
          body: md`
            The alias is the last piece of the shape id. reader matches diagram-5-reader. Markers such as diagram-5-arrowhead are not c4-shape groups, so they are not buttons.

            ~~~js
            const pattern = new RegExp(\`(?:^|-)\${chartId}$\`);
            svg.querySelectorAll("g.node.c4-shape").forEach((el) => {
              if (pattern.test(el.id)) groups.add(el);
            });
            ~~~
          `,
          facts: [["Element", "g.node.c4-shape"]],
        },
        seqName: {
          label: "Sequence name",
          tooltip: "name on the top and bottom actor boxes.",
          kicker: "Sequence",
          body: md`
            Sequence actor ids from Mermaid are not the names you wrote. The name attribute is. Top and bottom boxes both match, so one note is attached twice. Lifelines carry the same name and are not selected.

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
          tooltip: "g.node ending in state-Draft-1.",
          kicker: "State",
          body: md`
            The state name sits in the middle of the id. Draft matches diagram-1-state-Draft-1. The start and end dots are root_start and root_end, so they do not match a state name.

            ~~~js
            const pattern = new RegExp(\`(?:^|-)state-\${chartId}-\\\\d+$\`);
            svg.querySelectorAll("g.node").forEach((el) => {
              if (pattern.test(el.id)) groups.add(el);
            });
            ~~~
          `,
          facts: [["Element", "g.node"]],
        },
        size: {
          label: "Skip tiny boxes",
          tooltip: "Anything under 8 by 8 pixels is not a button.",
          kicker: "Size",
          body: md`
            Sequence lifelines are groups with almost no width and a lot of height. getBBox catches them. Without this check they became invisible click targets.

            ~~~js
            function visibleShape(el) {
              const box = el.getBBox();
              return box.width >= 8 && box.height >= 8;
            }
            ~~~
          `,
          facts: [["Function", "visibleShape"]],
        },
        wire: {
          label: "wireShape",
          tooltip: "The shape becomes a button.",
          kicker: "Listen",
          body: md`
            wireShape sets role, tabindex, and the aria-label. It listens for pointer enter, click, and double-click. If opensView is set, addBadge draws the green ↘ from the shape's getBBox. Enter and Space fire the same click handler.

            ~~~js
            function wireShape(shape, interaction) {
              shape.classList.add("is-node");
              shape.dataset.chartId = interaction.chartId;
              makeInteractive(shape, interaction, true);
              if (interaction.opensView) addBadge(shape);
            }

            // Arrows call the same function, so a shape and an arrow listen the same way.
            function makeInteractive(el, interaction, keyboardButton) {
              if (keyboardButton) el.setAttribute("role", "button");
              el.addEventListener("pointerenter", (event) => showTooltip(event, interaction));
              el.addEventListener("click", (event) => onInteractionClick(event, interaction));
              el.addEventListener("dblclick", (event) => onInteractionDblClick(event, interaction));
            }
            ~~~
          `,
          facts: [["Function", "wireShape"], ["Badge", "addBadge"]],
        },
      },
      edgeInteractions: [
        arrow("kind", "flowId", "A flowchart uses the node id in the group id.", "The render prefix stays in front.", [["Ends", "flowchart-id-n"]]),
        arrow("kind", "c4Id", "C4 uses the alias.", "Only c4-shape groups count.", [["Ends", "-alias"]]),
        arrow("kind", "seqName", "Sequence uses the name attribute.", "Top and bottom boxes both match.", [["Attribute", "name"]]),
        arrow("kind", "stateId", "A state uses the state name in the group id.", "Start and end dots are separate.", [["Ends", "state-name-n"]]),
        arrow("flowId", "size", "Tiny geometry is dropped.", "Lifelines fail this test.", [["Minimum", "8px"]]),
        arrow("c4Id", "size", "The same size check.", "A marker is already excluded.", [["Minimum", "8px"]]),
        arrow("seqName", "size", "Actor boxes pass.", "The lifeline line is not selected.", [["Minimum", "8px"]]),
        arrow("stateId", "size", "State boxes pass.", "The start dot is not a note.", [["Minimum", "8px"]]),
        arrow("size", "wire", "The survivors get listeners.", "A node interaction with opensView also gets a ↘ badge.", [["Function", "wireShape"]]),
      ],
    },
    "how-edges": {
      viewId: "how-edges",
      tab: "how",
      parent: "how-match",
      title: "Finding an arrow",
      summary: "bindEdgeInteractions claims each arrow once, in this order. Click a box for that matcher. The first hit wins.",
      chart: `flowchart TD
  listed["Read the notes"] --> flowBox["Flowchart id"]
  flowBox --> seqBox["Sequence text"]
  seqBox --> c4Box["C4 text"]
  c4Box --> geoBox["State geometry"]
  geoBox --> hitBox["Wide hit stroke"]`,
      nodeInteractions: {
        listed: {
          label: "Read the notes",
          tooltip: "edgeInteractions() turns the view's edge interactions into records.",
          kicker: "0",
          body: md`
            An edge can be a pair [from, to] or the object arrow() returns. edgeInteractions() copies from, to, and makes edgeId from-to-index. The label shown in the panel is the two node labels joined by an arrow.

            ~~~js
            function edgeInteractions() {
              return (app.view.edgeInteractions || []).map((edge, index) => {
                const from = Array.isArray(edge) ? edge[0] : edge.from;
                const to = Array.isArray(edge) ? edge[1] : edge.to;
                return { ...edge, from, to, edgeId: \`\${from}-\${to}-\${index}\`, kind: "edge" };
              });
            }
            ~~~
          `,
          facts: [["Function", "edgeInteractions"]],
        },
        flowBox: {
          label: "Flowchart id",
          tooltip: "The path id ends in L_from_to_0.",
          kicker: "1",
          body: md`
            Mermaid names flowchart arrows. The page builds a regex from the note's from and to. The label is a separate g.edgeLabel. nearestFlowchartLabel picks the label whose center is within 160px of the path midpoint, and the binder marks it wired so the next arrow cannot take it.

            ~~~js
            function findFlowchartArrow(svg, edge) {
              const from = edge.from.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
              const to = edge.to.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
              const pattern = new RegExp(\`(?:^|-)L_\${from}_\${to}_\\\\d+$\`);
              return [...svg.querySelectorAll("path.flowchart-link")]
                .find((path) => pattern.test(path.id));
            }

            function nearestFlowchartLabel(path, labels) {
              const mid = screenPoint(path, path.getTotalLength() / 2);
              let best = null;
              let bestDistance = 160;
              labels.forEach((label) => {
                const box = label.getBoundingClientRect();
                const distance = Math.hypot(
                  box.left + box.width / 2 - mid.x,
                  box.top + box.height / 2 - mid.y
                );
                if (distance < bestDistance) best = label;
              });
            }
            ~~~
          `,
          facts: [["Function", "findFlowchartArrow"], ["Label", "nearestFlowchartLabel"]],
        },
        seqBox: {
          label: "Sequence text",
          tooltip: "messageText, then the message line.",
          kicker: "2",
          body: md`
            Sequence arrows are not named with the endpoints. The page walks the SVG children, pairs each messageText with the following messageLine, and compares the text to edge.mermaidText. startsWith is allowed so a short mermaidText still hits. Each message is used once.

            ~~~js
            function sequenceMessages(svg) {
              [...svg.children].forEach((el) => {
                const cls = el.getAttribute("class") || "";
                if (cls.includes("messageText")) text = el;
                else if (cls.includes("messageLine")) {
                  messages.push({ line: el, text, label: norm(text ? text.textContent : "") });
                }
              });
            }

            function c4Relations(svg) {
              const relationshipGroup = [...svg.querySelectorAll("g")].find((group) => {
                const kids = [...group.children];
                return kids.some((el) => el.tagName === "line") && kids.some((el) => el.tagName === "text");
              });
              [...relationshipGroup.children].forEach((el) => {
                if (el.tagName === "line" || el.tagName === "path") {
                  rel = { strokes: [el], texts: [], wired: false };
                  rels.push(rel);
                } else if (el.tagName === "text" && rel) rel.texts.push(el);
              });
            }

            function textMatches(rendered, wanted) {
              const left = norm(rendered).toLowerCase();
              const right = norm(wanted).toLowerCase();
              return left === right || left.startsWith(right);
            }
            ~~~
          `,
          facts: [["Needs", "edge.mermaidText"], ["Function", "sequenceMessages"]],
        },
        c4Box: {
          label: "C4 text",
          tooltip: "A line or path, then the text that follows it.",
          kicker: "3",
          body: md`
            C4 puts every relationship in one group. A line or path starts a relationship. The text nodes after it belong to that relationship, until the next line. Two arrows that both say Reads are consumed in source order, because each match sets wired.

            ~~~js
            function sequenceMessages(svg) {
              [...svg.children].forEach((el) => {
                const cls = el.getAttribute("class") || "";
                if (cls.includes("messageText")) text = el;
                else if (cls.includes("messageLine")) {
                  messages.push({ line: el, text, label: norm(text ? text.textContent : "") });
                }
              });
            }

            function c4Relations(svg) {
              const relationshipGroup = [...svg.querySelectorAll("g")].find((group) => {
                const kids = [...group.children];
                return kids.some((el) => el.tagName === "line") && kids.some((el) => el.tagName === "text");
              });
              [...relationshipGroup.children].forEach((el) => {
                if (el.tagName === "line" || el.tagName === "path") {
                  rel = { strokes: [el], texts: [], wired: false };
                  rels.push(rel);
                } else if (el.tagName === "text" && rel) rel.texts.push(el);
              });
            }

            function textMatches(rendered, wanted) {
              const left = norm(rendered).toLowerCase();
              const right = norm(wanted).toLowerCase();
              return left === right || left.startsWith(right);
            }
            ~~~
          `,
          facts: [["Function", "c4Relations"], ["Order", "Source order"]],
        },
        geoBox: {
          label: "State geometry",
          tooltip: "path.transition has no from or to in the id.",
          kicker: "4",
          body: md`
            State arrows are matched by where they start and end. getPointAtLength plus getScreenCTM gives a screen point. That point is compared with the centers of the boxes already bound. Start and end dots use the id *. Their groups match root_start or root_end.

            ~~~js
            function matchStateArrows(paths, edges, svg) {
              const centers = shapeCentersOnScreen(svg);
              paths.forEach((path) => {
                const length = path.getTotalLength();
                const start = nearestPoint(centers, screenPoint(path, 1));
                const end = nearestPoint(centers, screenPoint(path, Math.max(1, length - 1)));
                edges.forEach((edge) => {
                  const forward = endpointDistance(start, end, edge);
                });
              });
            }

            function shapeCentersOnScreen(svg) {
              svg.querySelectorAll(".is-node").forEach((el) => {
                const box = el.getBoundingClientRect();
                items.push({ chartId: el.dataset.chartId, x: box.left + box.width / 2, y: box.top + box.height / 2 });
              });
              svg.querySelectorAll("g.node").forEach((el) => {
                if (!/root_start|root_end/.test(el.id)) return;
                items.push({ id: "*", x: box.left + box.width / 2, y: box.top + box.height / 2 });
              });
            }
            ~~~
          `,
          facts: [["Function", "matchStateArrows"], ["Start", "*"]],
        },
        hitBox: {
          label: "Wide hit stroke",
          tooltip: "The visible line is too thin to click.",
          kicker: "5",
          body: md`
            addWideHitStroke clones the stroke, strips the arrowhead, and puts an 18px transparent stroke on top. pointer-events is stroke, so the empty middle of the arrow is still a miss. The click has to land on that wide stroke. Only the first stroke is the keyboard button. The label listens too, but it is not a second tab stop.

            ~~~js
            function addWideHitStroke(el) {
              const hit = el.cloneNode(false);
              hit.removeAttribute("marker-end");
              hit.setAttribute("class", "edge-hit");
              el.parentNode.insertBefore(hit, el.nextSibling);
            }

            .edge-hit {
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
        arrow("listed", "flowBox", "Flowchart arrows are tried first.", "Their ids already name the endpoints.", [["Pattern", "L_from_to_n"]]),
        arrow("flowBox", "seqBox", "Unclaimed arrows try sequence text.", "edge.mermaidText has to be set.", [["Pair", "messageText + messageLine"]]),
        arrow("seqBox", "c4Box", "Then C4 relationships.", "Duplicate labels are taken in order.", [["Flag", "wired"]]),
        arrow("c4Box", "geoBox", "State arrows are what remain.", "They are matched by geometry.", [["Class", "path.transition"]]),
        arrow("geoBox", "hitBox", "Every claimed stroke gets a fat hit target.", "The visible line stays thin.", [["Class", "edge-hit"]]),
      ],
    },
  },
};
