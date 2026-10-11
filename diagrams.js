function link(from, to, tooltip, body, facts, more) {
  return { from, to, kicker: "Arrow", tooltip, body, facts: facts || [], ...(more || {}) };
}

function lines(rows) {
  return rows.join("\n");
}

const HOW = {
  init: lines([
    "mermaid.initialize({",
    "  startOnLoad: false,",
    '  securityLevel: "strict",',
    "  flowchart: { htmlLabels: true, useMaxWidth: false },",
    "});",
  ]),
  show: lines([
    "async function show(id) {",
    "  const view = app.views[id];",
    "  if (!view) return;",
    "  app.current = view;",
    "  app.stack = pathTo(view);",
    "  closePanel();",
    "  const token = ++app.renderToken;",
    "  app.els.camera.innerHTML = \"\";",
    "  const { svg } = await mermaid.render(`diagram-${token}`, view.chart);",
    "  if (token !== app.renderToken) return;",
    "  app.els.camera.innerHTML = svg;",
    "  const svgEl = app.els.camera.querySelector(\"svg\");",
    "  bindNodes(svgEl);",
    "  bindEdges(svgEl);",
    "  applySearch();",
    "  requestAnimationFrame(fit);",
    "}",
  ]),
  record: lines([
    "browser: {",
    "  label: \"Browser\",",
    "  tooltip: \"The reader's browser.\",",
    "  kicker: \"Client\",",
    "  body: \"Renders the pages and stores the session cookie.\",",
    "  facts: [[\"Calls\", \"Web app\"]],",
    "}",
    "",
    "link(\"browser\", \"cdn\", \"The browser loads files from the CDN.\", \"This path is cacheable.\")",
  ]),
  hosts: lines([
    "function mermaidShapesFor(svg, node) {",
    "  const byId = [...svg.querySelectorAll(\"[id]\")]",
    "    .filter((el) => idMatches(el.id, node.id));",
    "  const named = [...svg.querySelectorAll(\"[name]\")]",
    "    .filter((el) => el.getAttribute(\"name\") === node.id);",
    "  const direct = [...byId, ...named.map(shapeGroup)];",
    "  if (direct.length) {",
    "    return direct.filter((el) => visibleShape(el) && !direct.some(",
    "      (other) => other !== el && el.contains(other)",
    "    ));",
    "  }",
    "  const wanted = new Set([norm(node.label), ...(node.match || []).map(norm)]);",
    "  const groups = new Set();",
    "  svg.querySelectorAll(\"text, tspan, span, div, p\").forEach((el) => {",
    "    if (wanted.has(norm(el.textContent))) groups.add(shapeGroup(el));",
    "  });",
    "}",
    "",
    "function idMatches(domId, nodeId) {",
    "  if (domId === nodeId) return true;",
    "  const escaped = nodeId.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\");",
    "  return new RegExp(`(?:^|-)${escaped}(?:-\\\\d+)?$`).test(domId);",
    "}",
  ]),
  visible: lines([
    "function visibleShape(el) {",
    "  const box = el.getBBox();",
    "  return box.width >= 8 && box.height >= 8;",
    "}",
  ]),
  attach: lines([
    "function attach(host, node) {",
    "  host.classList.add(\"is-node\");",
    "  host.dataset.nodeId = node.id;",
    "  host.setAttribute(\"role\", \"button\");",
    "  host.addEventListener(\"pointerenter\", (event) => showTooltip(event, node));",
    "  host.addEventListener(\"click\", (event) => onNodeClick(event, node));",
    "  host.addEventListener(\"dblclick\", (event) => onNodeDblClick(event, node));",
    "  if (node.zoom) addBadge(host);",
    "}",
  ]),
  bindEdges: lines([
    "edges.forEach((edge) => {",
    "  const path = flowchartLinkPath(svg, edge);",
    "  if (!path || path.dataset.bound) return;",
    "  claimEdge(edge, [path, nearestFlowchartLabel(path, labels)]);",
    "});",
    "",
    "edges.forEach((edge) => {",
    "  if (used.has(edge) || !edge.match) return;",
    "  const message = messages.find((item) => !item.used && textMatches(item.label, edge.match));",
    "  if (!message) return;",
    "  message.used = true;",
    "  claimEdge(edge, [message.line, message.text]);",
    "});",
  ]),
  flow: lines([
    "function flowchartLinkPath(svg, edge) {",
    "  const from = edge.from.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\");",
    "  const to = edge.to.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\");",
    "  const pattern = new RegExp(`(?:^|-)L_${from}_${to}_\\\\d+$`);",
    "  return [...svg.querySelectorAll(\"path.flowchart-link\")]",
    "    .find((path) => pattern.test(path.id));",
    "}",
    "",
    "function nearestFlowchartLabel(path, labels) {",
    "  const mid = screenPoint(path, path.getTotalLength() / 2);",
    "  let best = null;",
    "  let bestDistance = 160;",
    "  labels.forEach((label) => {",
    "    const box = label.getBoundingClientRect();",
    "    const distance = Math.hypot(",
    "      box.left + box.width / 2 - mid.x,",
    "      box.top + box.height / 2 - mid.y",
    "    );",
    "    if (distance < bestDistance) best = label;",
    "  });",
    "}",
  ]),
  sequence: lines([
    "function mermaidSequenceMessages(svg) {",
    "  [...svg.children].forEach((el) => {",
    "    const cls = el.getAttribute(\"class\") || \"\";",
    "    if (cls.includes(\"messageText\")) text = el;",
    "    else if (cls.includes(\"messageLine\")) {",
    "      messages.push({ line: el, text, label: norm(text ? text.textContent : \"\") });",
    "    }",
    "  });",
    "}",
    "",
    "function mermaidC4Rels(svg) {",
    "  const host = [...svg.querySelectorAll(\"g\")].find((group) => {",
    "    const kids = [...group.children];",
    "    return kids.some((el) => el.tagName === \"line\") && kids.some((el) => el.tagName === \"text\");",
    "  });",
    "  [...host.children].forEach((el) => {",
    "    if (el.tagName === \"line\" || el.tagName === \"path\") {",
    "      rel = { strokes: [el], texts: [], used: false };",
    "      rels.push(rel);",
    "    } else if (el.tagName === \"text\" && rel) rel.texts.push(el);",
    "  });",
    "}",
    "",
    "function textMatches(rendered, wanted) {",
    "  const left = norm(rendered).toLowerCase();",
    "  const right = norm(wanted).toLowerCase();",
    "  return left === right || left.startsWith(right);",
    "}",
  ]),
  geometry: lines([
    "function matchStateArrowsByEnds(paths, edges, svg) {",
    "  const centers = nodeCentersOnScreen(svg);",
    "  paths.forEach((path) => {",
    "    const length = path.getTotalLength();",
    "    const start = nearestPoint(centers, screenPoint(path, 1));",
    "    const end = nearestPoint(centers, screenPoint(path, Math.max(1, length - 1)));",
    "    edges.forEach((edge) => {",
    "      const forward = endpointDistance(start, end, edge);",
    "    });",
    "  });",
    "}",
    "",
    "function nodeCentersOnScreen(svg) {",
    "  svg.querySelectorAll(\".is-node\").forEach((el) => {",
    "    const box = el.getBoundingClientRect();",
    "    items.push({ id: el.dataset.nodeId, x: box.left + box.width / 2, y: box.top + box.height / 2 });",
    "  });",
    "  svg.querySelectorAll(\"g.node\").forEach((el) => {",
    "    if (!/root_start|root_end/.test(el.id)) return;",
    "    items.push({ id: \"*\", x: box.left + box.width / 2, y: box.top + box.height / 2 });",
    "  });",
    "}",
  ]),
  hit: lines([
    "function addWideHitStroke(el) {",
    "  const hit = el.cloneNode(false);",
    "  hit.removeAttribute(\"marker-end\");",
    "  hit.setAttribute(\"class\", \"edge-hit\");",
    "  el.parentNode.insertBefore(hit, el.nextSibling);",
    "}",
    "",
    ".edge-hit {",
    "  stroke: transparent;",
    "  stroke-width: 18px;",
    "  pointer-events: stroke;",
    "}",
  ]),
  paint: lines([
    "function paint(focus) {",
    "  // hot: this node and every edge that touches it",
    "  el.classList.toggle(\"is-dim\", active && !on);",
    "  el.classList.toggle(\"is-hot\", active && on);",
    "}",
    "",
    ".is-dim { opacity: 0.72; }",
  ]),
  click: lines([
    "function onNodeClick(event, node) {",
    "  if (event.target.closest(\".zoom-badge\")) {",
    "    show(node.zoom);",
    "    return;",
    "  }",
    "  const wait = node.zoom ? 220 : 0;",
    "  app.clickTimer = setTimeout(() => openPanel(node), wait);",
    "}",
    "",
    "function openPanel(node) {",
    "  panel.title.textContent = node.label;",
    "  panel.body.textContent = node.body || \"\";",
    "  panel.code.textContent = node.code || \"\";",
    "  requestAnimationFrame(fit);",
    "}",
  ]),
  dbl: lines([
    "function onNodeDblClick(event, node) {",
    "  clearTimeout(app.clickTimer);",
    "  window.getSelection()?.removeAllRanges();",
    "  if (node.zoom) show(node.zoom);",
    "  else openPanel(node);",
    "}",
    "",
    "#camera, #camera * { user-select: none; }",
  ]),
  camera: lines([
    "app.cam = { x: 40, y: 32, s: 1 };",
    "",
    "function zoomBy(factor) {",
    "  const rect = app.els.viewport.getBoundingClientRect();",
    "  const px = rect.width / 2;",
    "  const py = rect.height / 2;",
    "  const next = Math.min(2.6, Math.max(0.35, app.cam.s * factor));",
    "  const k = next / app.cam.s;",
    "  app.cam.x = px - (px - app.cam.x) * k;",
    "  app.cam.y = py - (py - app.cam.y) * k;",
    "  app.cam.s = next;",
    "  applyCam();",
    "}",
    "",
    "function applyCam() {",
    "  app.els.camera.style.transform = `translate(${app.cam.x}px, ${app.cam.y}px) scale(${app.cam.s})`;",
    "}",
  ]),
};

const HOW_BOX = {
  chart: {
    label: "Chart text",
    tooltip: "The string stored on the view. Mermaid is the only reader.",
    kicker: "Data",
    body: "A view keeps the picture and the notes apart. view.chart is the Mermaid source. The tooltip, the panel text, and zoom are siblings of that string. Mermaid never sees them. securityLevel is strict, so Mermaid's own click syntax stays off. This page binds the finished SVG so flowchart, C4, sequence, and state share one panel.",
    code: HOW.init,
    facts: [["File", "diagrams.js"], ["Field", "view.chart"]],
  },
  mmd: {
    label: "Mermaid",
    tooltip: "Draws the SVG. It does not know about the side panel.",
    kicker: "Code",
    body: "show() sends view.chart to mermaid.render and keeps a token. If the reader opens another view before this draw finishes, the token no longer matches and the late SVG is dropped. Double-click this box to walk that function.",
    code: HOW.show,
    zoom: "how-show",
    facts: [["Function", "show"], ["File", "js/nav.js"]],
  },
  picture: {
    label: "Picture",
    tooltip: "The SVG that lands in #camera.",
    kicker: "DOM",
    body: "The page copies the SVG into #camera and sets its width and height from the viewBox, so later scaling uses the real size. bindNodes and bindEdges run after that. They are what make the shapes and arrows clickable.",
    code: HOW.show,
    facts: [["Element", "#camera"], ["Then", "bindNodes, bindEdges"]],
  },
  notes: {
    label: "Notes",
    tooltip: "nodes and edges, keyed like the chart.",
    kicker: "Data",
    body: "The map key is the id. The node object does not store id itself. bindNodes copies the key onto the object before matching. zoom is another view id. link() builds an edge from the two ids plus the panel text. An arrow can have zoom too. Checkout's New card arrow and the login POST /login arrow both open another diagram.",
    code: HOW.record,
    facts: [["File", "diagrams.js"], ["Helper", "link()"]],
  },
  app: {
    label: "Scripts",
    tooltip: "Finds each note in the SVG, then listens. The matcher is js/bind.js.",
    kicker: "Code",
    body: "Flowchart shapes carry the id in the element id, like flowchart-api-0. C4 shapes look like diagram-3-reader, so the test allows a prefix. Sequence actors use a name attribute. If neither matches, the page looks for text equal to the label. A box under 8 by 8 pixels is ignored. That drops sequence lifelines, which are tall and have no width.",
    code: HOW.hosts,
    facts: [["Function", "mermaidShapesFor"], ["File", "js/bind.js"]],
  },
  hover: {
    label: "Hover",
    tooltip: "Neighbors stay solid. The rest fade a little.",
    kicker: "Input",
    body: "paint() keeps this shape and every arrow that touches it. The others get is-dim. Leaving the shape calls applySearch(), so a click does not leave the highlight stuck. Search uses the same dim and also looks through arrow text. The opacity is 0.72. It used to be 0.28, which hid the rest of the picture too hard.",
    code: HOW.paint,
    facts: [["Function", "paint"], ["CSS", ".is-dim"]],
  },
  tap: {
    label: "Click",
    tooltip: "Opens the side panel.",
    kicker: "Input",
    body: "A shape that has an inner diagram waits 220ms before the panel opens, so a double-click can cancel the click. The green + badge does not wait. It calls show() at once. openPanel fills the title, the lead, the body, this code block, and the facts. Then it calls fit(), which throws away the pan and zoom you had, because the stage just got narrower.",
    code: HOW.click,
    facts: [["Function", "onNodeClick"], ["Wait", "220ms if zoom is set"]],
  },
  another: {
    label: "Another chart",
    tooltip: "show() swaps in a different view.",
    kicker: "Next",
    body: "This is a new SVG, not a closer look at the same one. pathTo() walks view.parent to build the breadcrumb. The hash becomes #parent/child through replaceState, so the browser Back button leaves the page instead of stepping up. Escape closes the panel first, then steps up. Backspace steps up when you are not typing in the search box.",
    code: HOW.dbl,
    facts: [["Function", "show"], ["Hash", "replaceState"]],
  },
  cam: {
    label: "Scale",
    tooltip: "The wheel and the + / - buttons change cam.s.",
    kicker: "Camera",
    body: "cam is x, y, and s. applyCam writes that as a CSS transform on #camera. Dragging empty space changes x and y. The drag ignores nodes, arrows, labels, and the wide hit stroke. Fit recomputes all three so the picture sits in the viewport. Double-click does not use this camera. It calls show().",
    code: HOW.camera,
    facts: [["Function", "zoomBy"], ["Range", "0.35 to 2.6"]],
  },
};

const HOW_ARROW = {
  draw: link(
    "chart",
    "mmd",
    "Only the chart string is passed to Mermaid.",
    "mermaid.render gets view.chart and a fresh id. The notes stay in JavaScript.",
    [["Call", "mermaid.render"]],
    { code: HOW.show }
  ),
  drawn: link(
    "mmd",
    "picture",
    "The return value is an SVG string.",
    "show() inserts that string into #camera. A stale render is ignored when app.renderToken has already moved on.",
    [["Guard", "token !== app.renderToken"]],
    { code: HOW.show }
  ),
  beside: link(
    "chart",
    "notes",
    "The notes use the same ids as the chart.",
    "Nothing in this arrow is drawn by Mermaid. It is here so you can see that the notes sit next to the chart instead of inside it.",
    [["Ids", "Map keys"]],
    { code: HOW.record }
  ),
  toApp: link(
    "notes",
    "app",
    "bind.js reads the notes after the SVG exists.",
    "bindNodes walks app.current.nodes. bindEdges walks app.current.edges. Both run inside show(), after the SVG is in the page.",
    [["Order", "render, then bind"]],
    { code: HOW.attach }
  ),
  fromPic: link(
    "picture",
    "app",
    "The SVG is the other input to the match.",
    "mermaidShapesFor searches that SVG for an id, a name, or the label text.",
    [["Function", "mermaidShapesFor"]],
    { code: HOW.hosts }
  ),
  toHover: link(
    "app",
    "hover",
    "pointerenter calls showTooltip, which calls paint.",
    "The tooltip is a fixed div. It is not a Mermaid tooltip. It follows the pointer and flips when it would leave the window.",
    [["Function", "showTooltip"]],
    { code: HOW.paint }
  ),
  toTap: link(
    "app",
    "tap",
    "click and dblclick are both attached in attach().",
    "Arrows use the same two handlers. watchEdge registers them on the hit stroke and on the label.",
    [["Shared", "onNodeClick"]],
    { code: HOW.click }
  ),
  toNext: link(
    "tap",
    "another",
    "Double-click calls show(zoom) and clears the pending panel.",
    "A single click on a shape that can drill in waits 220ms. The double-click clears that timer, clears the text selection, and draws the next view.",
    [["Function", "onNodeDblClick"]],
    { code: HOW.dbl }
  ),
  toCam: link(
    "picture",
    "cam",
    "The scroll wheel scales this SVG. It does not load another chart.",
    "zoomBy multiplies cam.s and keeps the zoom centered in the viewport. The limits are 0.35 and 2.6.",
    [["Function", "zoomBy"]],
    { code: HOW.camera }
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
    { id: "how", label: "How" },
  ],
  views: {
    architecture: {
      id: "architecture",
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
      edges: [
        link("browser", "cdn", "The browser loads HTML, CSS, and images from the CDN.", "This path is cacheable. It never carries the session cookie.", [["Carries", "Static files"]]),
        link("cdn", "web", "The CDN returns the static web app.", "The files are the pages, not API data.", [["Cached", "Yes"]]),
        link("browser", "web", "API calls go to the web origin, not the CDN.", "The session cookie is sent only on this path.", [["Carries", "Cookie and JSON"]]),
        link("web", "api", "The page calls the Go API.", "Catalog reads and checkout writes both use this hop.", [["Format", "JSON"]]),
        link("api", "db", "The API reads and writes books, users, and orders.", "Postgres is the system of record.", [["Protocol", "SQL"]]),
        link("api", "redis", "The API stores the session and pushes a job.", "Redis is safe to lose. The order row is already in Postgres.", [["Uses", "Cache and queue"]]),
        link("worker", "redis", "The worker pulls the next job.", "Payment capture and mail wait here until a worker is free.", [["Pattern", "Queue"]]),
        link("worker", "db", "The worker updates payment and fulfillment columns.", "It does not create the order. The API did that.", [["Writes", "Order status"]]),
        link("worker", "mail", "The worker sends the receipt.", "The mail provider is outside the system.", [["Protocol", "SMTP"]]),
      ],
      nodes: {
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
          zoom: "architecture-web",
        },
        api: {
          label: "API",
          tooltip: "Go service for accounts, catalog, and orders.",
          kicker: "Backend",
          body: "The only component that writes orders. It enqueues mail and payment work in Redis.",
          facts: [["Runtime", "Go"], ["Listens", "HTTPS"], ["Writes", "Postgres"]],
          zoom: "architecture-api",
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
      id: "architecture-web",
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
      edges: [
        link("shell", "catalog", "The shell opens the catalog.", "Search and book pages sit inside the shared frame.", [["Page", "Catalog"]]),
        link("shell", "cart", "The shell opens the cart.", "The header cart link lands here.", [["Page", "Cart"]]),
        link("cart", "checkout", "A priced cart continues to checkout.", "An empty cart cannot take this step.", [["Next", "Address and payment"]]),
        link("catalog", "cart", "Add a book from the catalog.", "The server cart is updated before checkout.", [["API", "PUT /cart"]]),
      ],
      nodes: {
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
      id: "architecture-api",
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
      edges: [
        link("router", "auth", "Login and session routes go to auth.", "The router matches the path, then auth owns the cookie.", [["Routes", "/login"]]),
        link("router", "catalog", "Public book routes go to catalog.", "No session is required to browse.", [["Routes", "GET /books"]]),
        link("router", "orders", "Checkout routes go to orders.", "Orders asks auth before it writes.", [["Routes", "POST /orders"]]),
        link("orders", "auth", "Orders checks the session before writing.", "A missing session stops the order.", [["Needs", "Session cookie"]]),
      ],
      nodes: {
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
      id: "c4",
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
      edges: [
        link("reader", "shop", "The reader browses and checks out.", "People do not call the card processor themselves.", [["C4", "Uses"]], { match: "Uses" }),
        link("shop", "pay", "The bookshop charges the card.", "Only a paid order continues to fulfillment.", [["Protocol", "HTTPS"]], { match: "Charges" }),
        link("shop", "mail", "The bookshop sends the receipt.", "Mail is delivered by an external system.", [["Protocol", "SMTP"]], { match: "Sends mail" }),
      ],
      nodes: {
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
          zoom: "c4-containers",
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
      id: "c4-containers",
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
      edges: [
        link("reader", "web", "The reader uses the web app in a browser.", "Static pages only. Rules stay in the API.", [["Protocol", "HTTPS"]], { match: "Uses" }),
        link("web", "api", "The web app calls the API.", "JSON in, JSON out. The browser does not open a database connection.", [["Format", "JSON"]], { match: "Calls" }),
        link("api", "db", "The API reads and writes the system of record.", "Users, books, and orders live here.", [["Protocol", "SQL"]], { match: "SQL" }),
        link("api", "worker", "The API enqueues payment and mail.", "Checkout can return before the receipt is sent.", [["Pattern", "Queue"]], { match: "Enqueues" }),
        link("worker", "db", "The worker updates the order after the API created it.", "Capture and fulfillment columns change here.", [["Protocol", "SQL"]], { match: "Updates" }),
        link("worker", "pay", "The worker captures an approved charge.", "The raw card number never reaches the worker.", [["Protocol", "HTTPS"]], { match: "Captures" }),
      ],
      nodes: {
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
          zoom: "c4-api",
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
      id: "c4-api",
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
      edges: [
        link("orders", "auth", "Orders asks auth whether the session is valid.", "Catalog does not take this hop.", [["Needs", "Session"]], { match: "Checks session" }),
        link("auth", "db", "Auth reads the user row.", "The password hash stays in the database.", [["Protocol", "SQL"]], { match: "Reads" }),
        link("catalog", "db", "Catalog reads books.", "This path is read-only.", [["Protocol", "SQL"]], { match: "Reads" }),
        link("orders", "db", "Orders inserts the order row.", "The worker updates that row later.", [["Protocol", "SQL"]], { match: "Writes" }),
      ],
      nodes: {
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
      id: "checkout",
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
      edges: [
        link("cart", "address", "A priced cart moves to the address step.", "Stock is checked again here.", [["From", "Cart"]]),
        link("address", "pay", "A valid address unlocks payment.", "The address is stored on the draft order.", [["Next", "Payment method"]]),
        link("pay", "card", "The reader pays with a new card.", "Double-click this arrow to open the token, charge, and capture steps.", [["Branch", "New card"]], { label: "New card", zoom: "checkout-card" }),
        link("pay", "saved", "The reader pays with a card stored at the processor.", "Our server sends the processor customer id, not the card number.", [["Branch", "Saved card"]]),
        link("card", "placed", "The new card was approved.", "The order becomes paid and the worker can capture it.", [["Result", "Approved"]]),
        link("card", "fail", "The new card was declined.", "The draft order stays unpaid.", [["Result", "Declined"]]),
        link("saved", "placed", "The saved card was approved.", "Same paid state as a new card.", [["Result", "Approved"]]),
        link("saved", "fail", "The saved card was declined.", "The reader can pick another method.", [["Result", "Declined"]]),
        link("fail", "pay", "A decline returns to the payment choice.", "Nothing has been captured.", [["Retry", "Yes"]]),
      ],
      nodes: {
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
          zoom: "checkout-card",
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
      id: "checkout-card",
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
      edges: [
        link("token", "charge", "The token is what our API is allowed to charge.", "The browser created it with the processor. We never see the card number.", [["Sends", "Token"]]),
        link("charge", "decision", "The API asks the processor to authorize that token.", "The amount is the repriced cart total.", [["Caller", "API"]]),
        link("decision", "capture", "An approval can be captured.", "The worker captures it after checkout returns.", [["Result", "Approved"]]),
        link("decision", "decline", "A decline captures nothing.", "A timeout is treated the same way.", [["Result", "Declined"]]),
      ],
      nodes: {
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
      id: "login",
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
      edges: [
        link("Reader", "Web", "The reader submits the login form.", "The password is typed into the web app.", [["Sends", "Email and password"]], { match: "Submit email and password" }),
        link("Web", "API", "The web app asks the API to start a session.", "Double-click this arrow to open the password check.", [["Call", "POST /login"]], { match: "POST /login", label: "POST /login", zoom: "login-api" }),
        link("API", "DB", "The API looks up the user by email.", "Postgres returns the hash, not a yes or no.", [["Query", "Users by email"]], { match: "Find user by email" }),
        link("DB", "API", "Postgres returns the user row.", "The hash is compared in the API, not in the database.", [["Returns", "User row"]], { match: "User row" }),
        link("API", "Web", "The API sets the session cookie.", "No cookie is set when the password is wrong.", [["Cookie", "Session id"]], { match: "Session cookie" }),
        link("Web", "Reader", "The web app sends the reader home.", "The cookie stays in the browser for the next call.", [["Next", "Home"]], { match: "Redirect home" }),
      ],
      nodes: {
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
          zoom: "login-api",
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
      id: "login-api",
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
      edges: [
        link("lookup", "missing", "The lookup result decides the next step.", "Unknown emails and bad passwords stay indistinguishable.", [["Next", "Found or 401"]]),
        link("missing", "hash", "A found user continues to the hash check.", "The plaintext password is still only in this request.", [["When", "User exists"]], { label: "Yes" }),
        link("missing", "reject", "An unknown email returns 401.", "The response does not say that the account is missing.", [["When", "No user"]], { label: "No" }),
        link("hash", "session", "A matching hash creates a session.", "The cookie is HttpOnly and Secure.", [["When", "Match"]], { label: "Yes" }),
        link("hash", "reject", "A bad password returns the same 401.", "No session cookie is set.", [["When", "No match"]], { label: "No" }),
      ],
      nodes: {
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
      id: "order",
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
      edges: [
        link("*", "Draft", "Checkout creates the order in this state.", "Nothing is charged yet.", [["From", "Start"]], { label: "Start → Draft" }),
        link("Draft", "Placed", "The reader submitted checkout.", "Payment is now in flight.", [["Next", "Paid or Cancelled"]]),
        link("Placed", "Paid", "The processor authorized the charge.", "Fulfillment can start.", [["Money", "Authorized"]]),
        link("Placed", "Cancelled", "Payment failed, so the order stops.", "No warehouse work starts.", [["Money", "Not taken"]]),
        link("Paid", "Fulfilling", "A paid order enters the warehouse.", "Double-click the Fulfilling state for the inner steps.", [["Next", "Picking"]]),
        link("Fulfilling", "Shipped", "The carrier scanned the parcel.", "Tracking is stored on the order.", [["Has", "Tracking number"]]),
        link("Shipped", "Delivered", "The carrier confirmed delivery.", "This is the successful path.", [["Next", "End"]]),
        link("Delivered", "*", "Delivery closes the order.", "This is the successful end state.", [["Terminal", "Yes"]], { label: "Delivered → End" }),
        link("Cancelled", "*", "A cancelled order ends here.", "No shipment is sent.", [["Terminal", "Yes"]], { label: "Cancelled → End" }),
      ],
      nodes: {
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
          zoom: "order-fulfilling",
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
      id: "order-fulfilling",
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
      edges: [
        link("*", "Picking", "Fulfillment starts when staff pull books.", "The parent order is already paid.", [["From", "Fulfilling"]], { label: "Start → Picking" }),
        link("Picking", "Packed", "Every title was found and the parcel is sealed.", "The next step is the carrier.", [["When", "In stock"]]),
        link("Picking", "Backordered", "A title is missing, so packing waits.", "The reader is emailed. The order stays paid.", [["When", "Missing title"]]),
        link("Backordered", "Picking", "Stock arrived, so picking starts again.", "This can happen more than once.", [["When", "Restocked"]]),
        link("Packed", "HandedOff", "The carrier scanned the parcel.", "The parent order becomes Shipped.", [["Next", "Shipped"]]),
        link("HandedOff", "*", "Handoff leaves this inner diagram.", "The parent state is now Shipped.", [["Parent", "Shipped"]], { label: "Handed off → End" }),
      ],
      nodes: {
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
      id: "how",
      tab: "how",
      parent: null,
      title: "1. Mermaid draws",
      summary: "Start here. Mermaid turns the chart string into a picture. Double-click Picture to add the notes. Double-click Mermaid to read show().",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]`,
      nodes: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", {
          kicker: "Next",
          zoom: "how-notes",
          tooltip: "The SVG in the page. The next picture adds the notes.",
        }),
      },
      edges: [HOW_ARROW.draw, HOW_ARROW.drawn],
    },
    "how-notes": {
      id: "how-notes",
      tab: "how",
      parent: "how",
      title: "2. Notes sit beside the chart",
      summary: "Same picture, plus the notes. Double-click Notes to add the matcher. Double-click Picture to read how arrows are found.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]`,
      nodes: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", {
          kicker: "Code",
          zoom: "how-edges",
          tooltip: "The SVG. Open it to read how an arrow is matched.",
        }),
        notes: box("notes", {
          kicker: "Next",
          zoom: "how-match",
          tooltip: "The nodes and edges maps. The next picture adds the matcher.",
        }),
      },
      edges: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside],
    },
    "how-match": {
      id: "how-match",
      tab: "how",
      parent: "how-notes",
      title: "3. Scripts match them",
      summary: "The notes and the picture both go into the page scripts. Double-click Scripts to add hover. Double-click Notes to read the box matcher.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]
  notes --> app["Scripts"]
  picture --> app`,
      nodes: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", {
          kicker: "Code",
          zoom: "how-edges",
          tooltip: "The SVG. Open it to read how an arrow is matched.",
        }),
        notes: box("notes", {
          kicker: "Code",
          zoom: "how-bind",
          tooltip: "The notes. Open them to read how a box is found.",
        }),
        app: box("app", {
          kicker: "Next",
          zoom: "how-hover",
          tooltip: "The matcher. The next picture adds hover.",
        }),
      },
      edges: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic],
    },
    "how-hover": {
      id: "how-hover",
      tab: "how",
      parent: "how-match",
      title: "4. Hover lights the neighbors",
      summary: "Hover is the new piece. Double-click Hover to add click. The other + boxes open the code for drawing, boxes, and arrows.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]
  notes --> app["Scripts"]
  picture --> app
  app --> hover["Hover"]`,
      nodes: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", { kicker: "Code", zoom: "how-edges", tooltip: "The SVG. Open it to read how an arrow is matched." }),
        notes: box("notes", { kicker: "Code", zoom: "how-bind", tooltip: "The notes. Open them to read how a box is found." }),
        app: box("app"),
        hover: box("hover", {
          kicker: "Next",
          zoom: "how-click",
          tooltip: "Pointer enter. The next picture adds click.",
        }),
      },
      edges: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover],
    },
    "how-click": {
      id: "how-click",
      tab: "how",
      parent: "how-hover",
      title: "5. Click opens the panel",
      summary: "Click is the new piece. Double-click Click to see what a double-click does instead.",
      chart: `flowchart LR
  chart["Chart text"] --> mmd["Mermaid"] --> picture["Picture"]
  chart --> notes["Notes"]
  notes --> app["Scripts"]
  picture --> app
  app --> hover["Hover"]
  app --> tap["Click"]`,
      nodes: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", { kicker: "Code", zoom: "how-edges", tooltip: "The SVG. Open it to read how an arrow is matched." }),
        notes: box("notes", { kicker: "Code", zoom: "how-bind", tooltip: "The notes. Open them to read how a box is found." }),
        app: box("app"),
        hover: box("hover"),
        tap: box("tap", {
          kicker: "Next",
          zoom: "how-twozoom",
          tooltip: "Opens this panel. The next picture shows double-click.",
        }),
      },
      edges: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap],
    },
    "how-twozoom": {
      id: "how-twozoom",
      tab: "how",
      parent: "how-click",
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
      nodes: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", { kicker: "Code", zoom: "how-edges", tooltip: "The SVG. Open it to read how an arrow is matched." }),
        notes: box("notes", { kicker: "Code", zoom: "how-bind", tooltip: "The notes. Open them to read how a box is found." }),
        app: box("app"),
        hover: box("hover"),
        tap: box("tap"),
        another: box("another", {
          kicker: "Next",
          zoom: "how-camera",
          tooltip: "A different view, drawn from scratch. The next picture adds the camera.",
        }),
      },
      edges: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap, HOW_ARROW.toNext],
    },
    "how-camera": {
      id: "how-camera",
      tab: "how",
      parent: "how-twozoom",
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
      nodes: {
        chart: box("chart"),
        mmd: box("mmd"),
        picture: box("picture", { kicker: "Code", zoom: "how-edges", tooltip: "The SVG. Open it to read how an arrow is matched." }),
        notes: box("notes", { kicker: "Code", zoom: "how-bind", tooltip: "The notes. Open them to read how a box is found." }),
        app: box("app"),
        hover: box("hover"),
        tap: box("tap"),
        another: box("another"),
        cam: box("cam"),
      },
      edges: [HOW_ARROW.draw, HOW_ARROW.drawn, HOW_ARROW.beside, HOW_ARROW.toApp, HOW_ARROW.fromPic, HOW_ARROW.toHover, HOW_ARROW.toTap, HOW_ARROW.toNext, HOW_ARROW.toCam],
    },
    "how-show": {
      id: "how-show",
      tab: "how",
      parent: "how",
      title: "show() draws one view",
      summary: "What show() does, in order. Click a box for that step's code. Back returns to the first picture.",
      chart: `flowchart TD
  hash["Hash"] --> showFn["show(id)"]
  showFn --> render["mermaid.render"]
  render --> token["Drop a stale SVG"]
  token --> bindN["bindNodes"]
  bindN --> bindE["bindEdges"]
  bindE --> fitBox["fit"]`,
      nodes: {
        hash: {
          label: "Hash",
          tooltip: "The last id in the hash is the view to draw.",
          kicker: "Entry",
          body: "openFromHash splits location.hash on slashes and keeps the last id. #how/how-notes opens the notes picture. The hash is updated with replaceState, so moving between views does not push browser history.",
          code: lines([
            "function openFromHash() {",
            "  const ids = location.hash.replace(/^#/, \"\").split(\"/\").filter(Boolean);",
            "  const id = ids.length ? ids[ids.length - 1] : DIAGRAMS.tabs[0].id;",
            "  if (!app.views[id]) show(DIAGRAMS.tabs[0].id);",
            "  else show(id);",
            "}",
          ]),
          facts: [["Function", "openFromHash"], ["File", "js/nav.js"]],
        },
        showFn: {
          label: "show(id)",
          tooltip: "Looks up the view and clears the panel.",
          kicker: "Function",
          body: "app.views is DIAGRAMS.views. pathTo walks parent links for the breadcrumb. closePanel runs first so the old detail does not sit on top of the new picture.",
          code: HOW.show,
          facts: [["File", "js/nav.js"]],
        },
        render: {
          label: "mermaid.render",
          tooltip: "Mermaid returns an SVG string. It does not bind clicks.",
          kicker: "Draw",
          body: "The first argument is a DOM id that must be unique per call, so it includes the token. The second argument is only view.chart. startOnLoad is false because this page calls render itself.",
          code: HOW.init + "\n\n" + HOW.show,
          facts: [["CDN", "mermaid@11"]],
        },
        token: {
          label: "Drop a stale SVG",
          tooltip: "A slower draw must not overwrite a newer one.",
          kicker: "Guard",
          body: "app.renderToken increments at the start of show(). After the await, the function returns if another show() has started. The same check wraps the error message.",
          code: lines([
            "const token = ++app.renderToken;",
            "const { svg } = await mermaid.render(`diagram-${token}`, view.chart);",
            "if (token !== app.renderToken) return;",
            "app.els.camera.innerHTML = svg;",
          ]),
          facts: [["Variable", "app.renderToken"]],
        },
        bindN: {
          label: "bindNodes",
          tooltip: "Attaches each note to the shape Mermaid drew.",
          kicker: "Bind",
          body: "This is where a box becomes a button. The next diagrams cover the match itself. From the third picture, double-click Notes.",
          code: HOW.attach,
          zoom: "how-bind",
          facts: [["Function", "bindNodes"]],
        },
        bindE: {
          label: "bindEdges",
          tooltip: "Attaches each note to the arrow Mermaid drew.",
          kicker: "Bind",
          body: "Arrows are harder than boxes because the four diagram types draw lines differently. That walk is the edges picture.",
          code: HOW.bindEdges,
          zoom: "how-edges",
          facts: [["Function", "bindEdges"]],
        },
        fitBox: {
          label: "fit",
          tooltip: "Scales the new SVG so it sits in the viewport.",
          kicker: "Camera",
          body: "fit() runs on the next frame, after layout. It sets app.cam.x, app.cam.y, and app.cam.s. Opening the panel calls fit() again because the stage got narrower.",
          code: lines([
            "function fit() {",
            "  const box = svg.viewBox.baseVal;",
            "  const pad = 48;",
            "  const s = Math.min(",
            "    (app.els.viewport.clientWidth - pad) / box.width,",
            "    (app.els.viewport.clientHeight - pad) / box.height,",
            "    1.35",
            "  );",
            "  app.cam.s = Number.isFinite(s) && s > 0 ? s : 1;",
            "  app.cam.x = (app.els.viewport.clientWidth - box.width * app.cam.s) / 2;",
            "  app.cam.y = Math.max(24, (app.els.viewport.clientHeight - box.height * app.cam.s) / 2);",
            "  applyCam();",
            "}",
          ]),
          facts: [["Also", "openPanel calls fit()"]],
        },
      },
      edges: [
        link("hash", "showFn", "The hash selects the view.", "Only the last segment is used.", [["Function", "openFromHash"]]),
        link("showFn", "render", "show() asks Mermaid to draw.", "The notes are not in this call.", [["Arg", "view.chart"]]),
        link("render", "token", "The await can finish late.", "A newer show() wins.", [["Check", "token !== app.renderToken"]]),
        link("token", "bindN", "Boxes are bound after the SVG is inserted.", "mermaidShapesFor runs per node.", [["Function", "bindNodes"]]),
        link("bindN", "bindE", "Arrows are bound after boxes.", "State arrows need the node centers from this pass.", [["Function", "bindEdges"]]),
        link("bindE", "fitBox", "Then the camera frames the picture.", "Search is applied just before fit.", [["Call", "requestAnimationFrame(fit)"]]),
      ],
    },
    "how-bind": {
      id: "how-bind",
      tab: "how",
      parent: "how-match",
      title: "Finding a box",
      summary: "Four checks, in this order. Click each one for the code. Back returns to the matcher picture.",
      chart: `flowchart TD
  idBox["Match the id"] --> nameBox["Match the name"]
  nameBox --> words["Match the label"]
  words --> size["Skip tiny boxes"]
  size --> wire["attach"]`,
      nodes: {
        idBox: {
          label: "Match the id",
          tooltip: "flowchart-api-0 and diagram-3-reader both count.",
          kicker: "1",
          body: "idMatches allows the node id as a whole id, or as the last dash-separated piece, with an optional -number. That covers flowchart ids and C4 aliases. The first bug here was that the node object had no id field. The id lived only as the map key. bindNodes now copies the key on before matching.",
          code: HOW.hosts,
          facts: [["Function", "idMatches"]],
        },
        nameBox: {
          label: "Match the name",
          tooltip: "Sequence actors expose name=\"DB\".",
          kicker: "2",
          body: "Sequence actor ids from Mermaid are not the names you wrote. The name attribute is. Top and bottom actor boxes both match, so a sequence participant gets two buttons. That is the same note, attached twice.",
          code: lines([
            "const named = [...svg.querySelectorAll(\"[name]\")]",
            "  .filter((el) => el.getAttribute(\"name\") === node.id);",
          ]),
          facts: [["Attribute", "name"]],
        },
        words: {
          label: "Match the label",
          tooltip: "Used when id and name both miss.",
          kicker: "3",
          body: "The page looks at text, tspan, span, div, and p. The text has to equal the label, or one of the match strings. A parent is skipped when a child already has that same text, so the inner node wins.",
          code: lines([
            "const wanted = new Set([norm(node.label), ...(node.match || []).map(norm)]);",
            "svg.querySelectorAll(\"text, tspan, span, div, p\").forEach((el) => {",
            "  if (!wanted.has(norm(el.textContent))) return;",
            "  groups.add(shapeGroup(el));",
            "});",
          ]),
          facts: [["Fallback", "Visible text"]],
        },
        size: {
          label: "Skip tiny boxes",
          tooltip: "Anything under 8 by 8 pixels is not a button.",
          kicker: "4",
          body: "Sequence lifelines are groups with almost no width and a lot of height. getBBox catches them. Without this check they became invisible click targets.",
          code: HOW.visible,
          facts: [["Function", "visibleShape"]],
        },
        wire: {
          label: "attach",
          tooltip: "The shape becomes a button.",
          kicker: "5",
          body: "attach sets role, tabindex, and the aria-label. It listens for pointer enter, click, and double-click. If zoom is set, addBadge draws the green plus from the shape's getBBox. Enter and Space fire the same click handler.",
          code: HOW.attach,
          facts: [["Function", "attach"], ["Badge", "addBadge"]],
        },
      },
      edges: [
        link("idBox", "nameBox", "Name is the second try.", "Sequence actors need it.", [["Attribute", "name"]]),
        link("nameBox", "words", "Text is the third try.", "State labels often land here.", [["Equals", "node.label"]]),
        link("words", "size", "Tiny geometry is dropped.", "Lifelines fail this test.", [["Minimum", "8px"]]),
        link("size", "wire", "The survivors get listeners.", "A zoom node also gets a plus.", [["Function", "attach"]]),
      ],
    },
    "how-edges": {
      id: "how-edges",
      tab: "how",
      parent: "how-match",
      title: "Finding an arrow",
      summary: "bindEdges claims each arrow once, in this order. Click a box for that matcher. The first hit wins.",
      chart: `flowchart TD
  listed["Read the notes"] --> flowBox["Flowchart id"]
  flowBox --> seqBox["Sequence text"]
  seqBox --> c4Box["C4 text"]
  c4Box --> geoBox["State geometry"]
  geoBox --> hitBox["Wide hit stroke"]`,
      nodes: {
        listed: {
          label: "Read the notes",
          tooltip: "currentEdges() turns the view's edges into records.",
          kicker: "0",
          body: "An edge can be a pair [from, to] or the object link() returns. currentEdges copies from, to, and a stable id from-to-index. The label shown in the panel is the two node labels joined by an arrow.",
          code: lines([
            "function currentEdges() {",
            "  return (current.edges || []).map((edge, index) => {",
            "    const from = Array.isArray(edge) ? edge[0] : edge.from;",
            "    const to = Array.isArray(edge) ? edge[1] : edge.to;",
            "    return { ...edge, from, to, id: `${from}-${to}-${index}` };",
            "  });",
            "}",
          ]),
          facts: [["Function", "currentEdges"]],
        },
        flowBox: {
          label: "Flowchart id",
          tooltip: "The path id ends in L_from_to_0.",
          kicker: "1",
          body: "Mermaid names flowchart arrows. The page builds a regex from the note's from and to. The label is a separate g.edgeLabel. nearestFlowchartLabel picks the label whose center is within 160px of the path midpoint, and marks it claimed so the next arrow cannot take it.",
          code: HOW.flow,
          facts: [["Function", "flowchartLinkPath"], ["Label", "nearestFlowchartLabel"]],
        },
        seqBox: {
          label: "Sequence text",
          tooltip: "messageText, then the message line.",
          kicker: "2",
          body: "Sequence arrows are not named with the endpoints. The page walks the SVG children, pairs each messageText with the following messageLine, and compares the text to edge.match. startsWith is allowed so a short match still hits. Each message is used once.",
          code: HOW.sequence,
          facts: [["Needs", "edge.match"], ["Function", "mermaidSequenceMessages"]],
        },
        c4Box: {
          label: "C4 text",
          tooltip: "A line or path, then the text that follows it.",
          kicker: "3",
          body: "C4 puts every relationship in one group. A line or path starts a relationship. The text nodes after it belong to that relationship, until the next line. Two arrows that both say Reads are consumed in source order, because each match sets used.",
          code: HOW.sequence,
          facts: [["Function", "mermaidC4Rels"], ["Order", "Source order"]],
        },
        geoBox: {
          label: "State geometry",
          tooltip: "path.transition has no from or to in the id.",
          kicker: "4",
          body: "State arrows are matched by where they start and end. getPointAtLength plus getScreenCTM gives a screen point. That point is compared with the centers of the boxes already bound. Start and end dots use the id *. Their groups match root_start or root_end.",
          code: HOW.geometry,
          facts: [["Function", "matchStateArrowsByEnds"], ["Start", "*"]],
        },
        hitBox: {
          label: "Wide hit stroke",
          tooltip: "The visible line is too thin to click.",
          kicker: "5",
          body: "addWideHitStroke clones the stroke, strips the arrowhead, and puts an 18px transparent stroke on top. pointer-events is stroke, so the empty middle of the arrow is still a miss. The click has to land on that wide stroke. Only the first stroke is the keyboard button. The label listens too, but it is not a second tab stop.",
          code: HOW.hit,
          facts: [["Class", "edge-hit"], ["Width", "18px"]],
        },
      },
      edges: [
        link("listed", "flowBox", "Flowchart arrows are tried first.", "Their ids already name the endpoints.", [["Pattern", "L_from_to_n"]]),
        link("flowBox", "seqBox", "Unclaimed arrows try sequence text.", "edge.match has to be set.", [["Pair", "messageText + messageLine"]]),
        link("seqBox", "c4Box", "Then C4 relationships.", "Duplicate labels are taken in order.", [["Flag", "used"]]),
        link("c4Box", "geoBox", "State arrows are what remain.", "They are matched by geometry.", [["Class", "path.transition"]]),
        link("geoBox", "hitBox", "Every claimed stroke gets a fat hit target.", "The visible line stays thin.", [["Class", "edge-hit"]]),
      ],
    },
  },
};
