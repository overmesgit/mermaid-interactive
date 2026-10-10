const VIEWS = DIAGRAMS.views;
const SVG_NS = "http://www.w3.org/2000/svg";

const tabsEl = document.getElementById("tabs");
const crumbsEl = document.getElementById("crumbs");
const summaryEl = document.getElementById("summary");
const cameraEl = document.getElementById("camera");
const viewportEl = document.getElementById("viewport");
const workspaceEl = document.getElementById("workspace");
const panelEl = document.getElementById("panel");
const tooltipEl = document.getElementById("tooltip");
const statusEl = document.getElementById("status");
const searchEl = document.getElementById("search");

const panel = {
  kicker: document.getElementById("panel-kicker"),
  title: document.getElementById("panel-title"),
  lead: document.getElementById("panel-lead"),
  body: document.getElementById("panel-body"),
  code: document.getElementById("panel-code"),
  facts: document.getElementById("panel-facts"),
  zoom: document.getElementById("panel-zoom"),
  close: document.getElementById("panel-close"),
};

let stack = [];
let current = null;
let selected = null;
let renderToken = 0;
let hashLock = false;
let clickTimer = 0;
let cam = { x: 40, y: 32, s: 1 };
let drag = null;

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "base",
  fontFamily: "Segoe UI, sans-serif",
  flowchart: { htmlLabels: true, useMaxWidth: false, curve: "basis" },
  sequence: { useMaxWidth: false },
  c4: { useMaxWidth: false },
  themeVariables: {
    fontFamily: "Segoe UI, sans-serif",
    fontSize: "15px",
    background: "transparent",
    primaryColor: "#f3efe4",
    primaryTextColor: "#1c1915",
    primaryBorderColor: "#2a2622",
    secondaryColor: "#e4efe6",
    secondaryTextColor: "#1c1915",
    secondaryBorderColor: "#2a2622",
    tertiaryColor: "#efe4d4",
    tertiaryTextColor: "#1c1915",
    tertiaryBorderColor: "#2a2622",
    lineColor: "#5e584e",
    textColor: "#1c1915",
    mainBkg: "#f3efe4",
    nodeBorder: "#2a2622",
    actorBkg: "#f3efe4",
    actorBorder: "#2a2622",
    actorTextColor: "#1c1915",
    signalColor: "#2a2622",
    signalTextColor: "#1c1915",
    noteBkgColor: "#efe4d4",
    noteTextColor: "#1c1915",
    noteBorderColor: "#2a2622",
    activationBkgColor: "#e4efe6",
    activationBorderColor: "#2a2622",
  },
});

function pathTo(view) {
  const path = [view];
  let guard = 0;
  while (path[0].parent && VIEWS[path[0].parent] && guard++ < 8) {
    path.unshift(VIEWS[path[0].parent]);
  }
  return path;
}

function setStatus(text) {
  statusEl.textContent = text;
  clearTimeout(setStatus.timer);
  setStatus.timer = setTimeout(() => {
    statusEl.textContent = "";
  }, 2400);
}

function applyCam() {
  cameraEl.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`;
}

function fit() {
  const svg = cameraEl.querySelector("svg");
  if (!svg) return;
  const box = svg.viewBox && svg.viewBox.baseVal.width
    ? svg.viewBox.baseVal
    : { width: svg.getBoundingClientRect().width, height: svg.getBoundingClientRect().height };
  const pad = 48;
  const s = Math.min(
    (viewportEl.clientWidth - pad) / box.width,
    (viewportEl.clientHeight - pad) / box.height,
    1.35
  );
  cam.s = Number.isFinite(s) && s > 0 ? s : 1;
  cam.x = (viewportEl.clientWidth - box.width * cam.s) / 2;
  cam.y = Math.max(24, (viewportEl.clientHeight - box.height * cam.s) / 2);
  applyCam();
}

function renderChrome() {
  const root = stack[0];
  tabsEl.querySelectorAll("button").forEach((button) => {
    if (button.dataset.id === root.tab) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  crumbsEl.replaceChildren();
  stack.forEach((view, index) => {
    if (index) {
      const sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = "/";
      crumbsEl.appendChild(sep);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = view.title;
    const last = index === stack.length - 1;
    if (last) button.setAttribute("aria-current", "true");
    if (!last) button.addEventListener("click", () => show(view.id));
    crumbsEl.appendChild(button);
  });
  summaryEl.textContent = current.summary;
  const next = "#" + stack.map((view) => view.id).join("/");
  if (location.hash !== next) history.replaceState(null, "", next);
}

function norm(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function idMatches(domId, nodeId) {
  if (!domId) return false;
  if (domId === nodeId) return true;
  const escaped = nodeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|-)${escaped}(?:-\\d+)?$`).test(domId);
}

function hostFor(el) {
  return (
    el.closest(
      "g.node, g.actor, g.person, g.system, g.container, g.component, g.external, g.external_person, g.boundary"
    ) ||
    el.closest("g") ||
    el
  );
}

function hostsFor(svg, node) {
  const byId = [...svg.querySelectorAll("[id]")].filter((el) => idMatches(el.id, node.id));
  const named = [...svg.querySelectorAll("[name]")].filter((el) => el.getAttribute("name") === node.id);
  const direct = [...byId, ...named.map(hostFor)];
  if (direct.length) {
    return direct.filter(
      (el) => visibleHost(el) && !direct.some((other) => other !== el && el.contains(other))
    );
  }
  const wanted = new Set([norm(node.label), ...(node.match || []).map(norm)]);
  const groups = new Set();
  svg.querySelectorAll("text, tspan, span, div, p").forEach((el) => {
    const text = norm(el.textContent);
    if (!wanted.has(text)) return;
    if ([...el.children].some((child) => norm(child.textContent) === text)) return;
    groups.add(hostFor(el));
  });
  return [...groups].filter(visibleHost);
}

function visibleHost(el) {
  try {
    const box = el.getBBox();
    return box.width >= 8 && box.height >= 8;
  } catch {
    return false;
  }
}

function addBadge(host) {
  let box;
  try {
    box = host.getBBox();
  } catch {
    return;
  }
  const badge = document.createElementNS(SVG_NS, "g");
  badge.setAttribute("class", "zoom-badge");
  badge.setAttribute("transform", `translate(${box.x + box.width - 2}, ${box.y + 2})`);
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("r", "9");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M-4 0h8M0-4v8");
  badge.append(circle, path);
  host.appendChild(badge);
}

function tooltipText(node) {
  return node.zoom ? `${node.tooltip} Double-click to open the inner diagram.` : node.tooltip;
}

function placeTooltip(event) {
  tooltipEl.hidden = false;
  const rect = tooltipEl.getBoundingClientRect();
  let x = event.clientX + 14;
  let y = event.clientY + 18;
  if (x + rect.width > window.innerWidth - 8) x = event.clientX - rect.width - 12;
  if (y + rect.height > window.innerHeight - 8) y = event.clientY - rect.height - 12;
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
}

function showTooltip(event, item) {
  tooltipEl.textContent = tooltipText(item);
  placeTooltip(event);
  if (item.from) paint({ edgeId: item.id });
  else paint({ nodeId: item.id });
}

function hideTooltip() {
  tooltipEl.hidden = true;
  applySearch();
}

function attach(host, node) {
  host.classList.add("is-node");
  host.dataset.nodeId = node.id;
  host.setAttribute("role", "button");
  host.setAttribute("tabindex", "0");
  host.setAttribute("aria-label", node.zoom ? `${node.label}, has an inner diagram` : node.label);
  host.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onNodeClick(event, node);
  });
  host.addEventListener("pointerenter", (event) => showTooltip(event, node));
  host.addEventListener("pointermove", placeTooltip);
  host.addEventListener("pointerleave", hideTooltip);
  host.addEventListener("click", (event) => onNodeClick(event, node));
  host.addEventListener("dblclick", (event) => onNodeDblClick(event, node));
  if (node.zoom) addBadge(host);
}

function relaxLabels(svg) {
  svg.querySelectorAll("foreignObject").forEach((fo) => {
    fo.setAttribute("overflow", "visible");
    const label = fo.firstElementChild;
    if (!label) return;
    const needed = Math.ceil(label.scrollHeight);
    const height = Number(fo.getAttribute("height")) || 0;
    if (needed > height) fo.setAttribute("height", String(needed));
  });
}

function bindNodes(svg) {
  const used = new Set();
  Object.entries(current.nodes).forEach(([id, node]) => {
    const bound = { ...node, id };
    hostsFor(svg, bound).forEach((host) => {
      if (used.has(host)) return;
      used.add(host);
      attach(host, bound);
    });
  });
}

function currentEdges() {
  return (current.edges || []).map((edge, index) => {
    const from = Array.isArray(edge) ? edge[0] : edge.from;
    const to = Array.isArray(edge) ? edge[1] : edge.to;
    const fromLabel = current.nodes[from]?.label || from;
    const toLabel = current.nodes[to]?.label || to;
    return {
      kicker: "Arrow",
      label: `${fromLabel} → ${toLabel}`,
      tooltip: `${fromLabel} to ${toLabel}`,
      ...(Array.isArray(edge) ? {} : edge),
      from,
      to,
      id: `${from}-${to}-${index}`,
    };
  });
}

function edgeById(id) {
  return currentEdges().find((edge) => edge.id === id);
}

function screenPoint(path, distance) {
  const point = path.getPointAtLength(distance);
  const matrix = path.getScreenCTM();
  if (!matrix) return { x: point.x, y: point.y };
  const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix);
  return { x: screen.x, y: screen.y };
}

function nearestPoint(items, point) {
  let best = { id: "", d: Infinity };
  items.forEach((item) => {
    const distance = Math.hypot(item.x - point.x, item.y - point.y);
    if (distance < best.d) best = { id: item.id, d: distance };
  });
  return best;
}

function addHitTarget(el) {
  const hit = el.cloneNode(false);
  hit.removeAttribute("id");
  hit.removeAttribute("marker-end");
  hit.removeAttribute("marker-start");
  hit.setAttribute("class", "edge-hit");
  el.parentNode.insertBefore(hit, el.nextSibling);
  return hit;
}

function bindEdgeParts(edge, parts) {
  let named = false;
  parts.filter(Boolean).forEach((part) => {
    if (part.tagName === "path" || part.tagName === "line") {
      part.classList.add("is-edge");
      part.dataset.bound = "1";
      part.dataset.edgeId = edge.id;
      const hit = addHitTarget(part);
      hit.dataset.edgeId = edge.id;
      watchEdge(hit, edge, !named);
      named = true;
    } else {
      part.classList.add("is-edge-label");
      part.dataset.edgeId = edge.id;
      watchEdge(part, edge, false);
    }
  });
}

function watchEdge(el, edge, primary) {
  if (primary) {
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", edge.zoom ? `${edge.label}, has an inner diagram` : edge.label);
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onNodeClick(event, edge);
    });
  }
  el.addEventListener("pointerenter", (event) => showTooltip(event, edge));
  el.addEventListener("pointermove", placeTooltip);
  el.addEventListener("pointerleave", hideTooltip);
  el.addEventListener("click", (event) => onNodeClick(event, edge));
  el.addEventListener("dblclick", (event) => onNodeDblClick(event, edge));
}

function flowPath(svg, edge) {
  const from = edge.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const to = edge.to.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|-)L_${from}_${to}_\\d+$`);
  return [...svg.querySelectorAll("path.flowchart-link")].find((path) => pattern.test(path.id));
}

function claimLabel(path, labels) {
  const mid = screenPoint(path, path.getTotalLength() / 2);
  let best = null;
  let bestDistance = 160;
  labels.forEach((label) => {
    if (label.dataset.claimed) return;
    const box = label.getBoundingClientRect();
    const distance = Math.hypot(box.left + box.width / 2 - mid.x, box.top + box.height / 2 - mid.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = label;
    }
  });
  if (best) best.dataset.claimed = "1";
  return best;
}

function sequenceMessages(svg) {
  const messages = [];
  let text = null;
  [...svg.children].forEach((el) => {
    const cls = el.getAttribute("class") || "";
    if (cls.includes("messageText")) text = el;
    else if (cls.includes("messageLine")) {
      messages.push({ line: el, text, label: norm(text ? text.textContent : ""), used: false });
      text = null;
    }
  });
  return messages;
}

function c4Rels(svg) {
  const host = [...svg.querySelectorAll("g")].find((group) => {
    const kids = [...group.children];
    return kids.some((el) => el.tagName === "line") && kids.some((el) => el.tagName === "text");
  });
  if (!host) return [];
  const rels = [];
  let current = null;
  [...host.children].forEach((el) => {
    if (el.tagName === "line" || el.tagName === "path") {
      current = { strokes: [el], texts: [], used: false };
      rels.push(current);
    } else if (el.tagName === "text" && current) current.texts.push(el);
  });
  return rels.map((rel) => ({
    ...rel,
    label: norm(rel.texts.map((text) => text.textContent).join(" ")),
  }));
}

function textMatches(rendered, wanted) {
  const left = norm(rendered).toLowerCase();
  const right = norm(wanted).toLowerCase();
  if (!right) return false;
  return left === right || left.startsWith(right);
}

function edgeCenters(svg) {
  const items = [];
  svg.querySelectorAll(".is-node").forEach((el) => {
    const box = el.getBoundingClientRect();
    if (box.width < 2) return;
    items.push({ id: el.dataset.nodeId, x: box.left + box.width / 2, y: box.top + box.height / 2 });
  });
  svg.querySelectorAll("g.node").forEach((el) => {
    if (!/root_start|root_end/.test(el.id)) return;
    const box = el.getBoundingClientRect();
    items.push({ id: "*", x: box.left + box.width / 2, y: box.top + box.height / 2 });
  });
  return items;
}

function assignByGeometry(paths, edges, svg) {
  const centers = edgeCenters(svg);
  const candidates = [];
  paths.forEach((path) => {
    const length = path.getTotalLength();
    if (!length) return;
    const start = nearestPoint(centers, screenPoint(path, 1));
    const end = nearestPoint(centers, screenPoint(path, Math.max(1, length - 1)));
    edges.forEach((edge) => {
      const forward = endScore(start, end, edge);
      const backward = endScore(end, start, edge);
      const score = Math.min(forward, backward);
      if (score < 360) candidates.push({ path, edge, score });
    });
  });
  candidates.sort((a, b) => a.score - b.score);
  const usedPaths = new Set();
  const usedEdges = new Set();
  candidates.forEach((candidate) => {
    if (usedPaths.has(candidate.path) || usedEdges.has(candidate.edge)) return;
    usedPaths.add(candidate.path);
    usedEdges.add(candidate.edge);
    bindEdgeParts(candidate.edge, [candidate.path]);
  });
}

function endScore(start, end, edge) {
  if (edge.from !== "*" && start.id !== edge.from) return Infinity;
  if (edge.to !== "*" && end.id !== edge.to) return Infinity;
  if (edge.from === "*" && start.id !== "*") return Infinity;
  if (edge.to === "*" && end.id !== "*") return Infinity;
  return (edge.from === "*" ? 0 : start.d) + (edge.to === "*" ? 0 : end.d);
}

function bindEdges(svg) {
  const edges = currentEdges();
  const used = new Set();
  const labels = [...svg.querySelectorAll("g.edgeLabel")].filter(
    (label) => !label.querySelector("g.edgeLabel")
  );

  function take(edge, parts) {
    if (used.has(edge)) return;
    used.add(edge);
    bindEdgeParts(edge, parts);
  }

  edges.forEach((edge) => {
    const path = flowPath(svg, edge);
    if (!path || path.dataset.bound) return;
    take(edge, [path, claimLabel(path, labels)]);
  });

  const messages = sequenceMessages(svg);
  edges.forEach((edge) => {
    if (used.has(edge) || !edge.match) return;
    const message = messages.find((item) => !item.used && textMatches(item.label, edge.match));
    if (!message) return;
    message.used = true;
    take(edge, [message.line, message.text]);
  });

  const rels = c4Rels(svg);
  edges.forEach((edge) => {
    if (used.has(edge) || !edge.match) return;
    const rel = rels.find((item) => !item.used && textMatches(item.label, edge.match));
    if (!rel) return;
    rel.used = true;
    take(edge, [...rel.strokes, ...rel.texts]);
  });

  const paths = [...svg.querySelectorAll("path.transition")].filter((path) => !path.dataset.bound);
  assignByGeometry(paths, edges.filter((edge) => !used.has(edge)), svg);
}

function paint(focus) {
  const edges = currentEdges();
  const hotEdges = new Set();
  const hotNodes = new Set();
  if (focus.edgeId) {
    hotEdges.add(focus.edgeId);
    const edge = edges.find((item) => item.id === focus.edgeId);
    if (edge) {
      hotNodes.add(edge.from);
      hotNodes.add(edge.to);
    }
  } else if (focus.nodeId) {
    hotNodes.add(focus.nodeId);
    edges.forEach((edge) => {
      if (edge.from === focus.nodeId || edge.to === focus.nodeId) {
        hotEdges.add(edge.id);
        hotNodes.add(edge.from);
        hotNodes.add(edge.to);
      }
    });
  }
  const active = Boolean(focus.edgeId || focus.nodeId);
  cameraEl.querySelectorAll(".is-node").forEach((el) => {
    const on = !active || hotNodes.has(el.dataset.nodeId);
    el.classList.toggle("is-dim", active && !on);
    el.classList.remove("is-hit");
  });
  cameraEl.querySelectorAll(".is-edge:not(.edge-hit), .is-edge-label").forEach((el) => {
    const on = !active || hotEdges.has(el.dataset.edgeId);
    el.classList.toggle("is-dim", active && !on);
    el.classList.toggle("is-hot", active && on);
  });
}

function applySearch() {
  const query = searchEl.value.trim().toLowerCase();
  const haystack = (item) =>
    [item.label, item.tooltip, item.body, item.code, item.kicker, item.match, ...(item.facts || []).flat()]
      .join(" ")
      .toLowerCase();
  cameraEl.querySelectorAll(".is-node").forEach((el) => {
    const node = current.nodes[el.dataset.nodeId];
    if (!node) return;
    const hit = !query || haystack(node).includes(query);
    el.classList.toggle("is-dim", Boolean(query) && !hit);
    el.classList.toggle("is-hit", Boolean(query) && hit);
  });
  cameraEl.querySelectorAll(".is-edge:not(.edge-hit), .is-edge-label").forEach((el) => {
    const edge = edgeById(el.dataset.edgeId);
    if (!edge) return;
    const hit = !query || haystack(edge).includes(query);
    el.classList.toggle("is-dim", Boolean(query) && !hit);
    el.classList.toggle("is-hot", Boolean(query) && hit);
  });
}

function openPanel(node) {
  selected = node;
  panel.kicker.textContent = node.kicker || "";
  panel.title.textContent = node.label;
  panel.lead.textContent = node.tooltip;
  panel.body.textContent = node.body || "";
  panel.code.hidden = !node.code;
  panel.code.textContent = node.code || "";
  panel.facts.replaceChildren();
  (node.facts || []).forEach(([term, detail]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = detail;
    panel.facts.append(dt, dd);
  });
  panel.zoom.hidden = !node.zoom;
  panelEl.hidden = false;
  panelEl.setAttribute("aria-hidden", "false");
  workspaceEl.classList.add("panel-open");
  panel.close.focus();
  requestAnimationFrame(fit);
}

function closePanel() {
  selected = null;
  const wasOpen = workspaceEl.classList.contains("panel-open");
  panelEl.hidden = true;
  panelEl.setAttribute("aria-hidden", "true");
  workspaceEl.classList.remove("panel-open");
  panel.zoom.hidden = true;
  if (wasOpen) requestAnimationFrame(fit);
}

function onNodeClick(event, node) {
  event.stopPropagation();
  hideTooltip();
  if (event.target.closest(".zoom-badge")) {
    clearTimeout(clickTimer);
    if (node.zoom) show(node.zoom);
    return;
  }
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => openPanel(node), node.zoom ? 220 : 0);
}

function onNodeDblClick(event, node) {
  event.preventDefault();
  event.stopPropagation();
  clearTimeout(clickTimer);
  window.getSelection()?.removeAllRanges();
  if (node.zoom) show(node.zoom);
  else openPanel(node);
}

async function show(id) {
  const view = VIEWS[id];
  if (!view) return;
  current = view;
  stack = pathTo(view);
  closePanel();
  hideTooltip();
  renderChrome();
  const token = ++renderToken;
  cameraEl.innerHTML = "";
  try {
    const { svg } = await mermaid.render(`diagram-${token}`, view.chart);
    if (token !== renderToken) return;
    cameraEl.innerHTML = svg;
    const svgEl = cameraEl.querySelector("svg");
    svgEl.style.maxWidth = "none";
    const box = svgEl.viewBox.baseVal;
    if (box && box.width) {
      svgEl.setAttribute("width", String(box.width));
      svgEl.setAttribute("height", String(box.height));
    }
    bindNodes(svgEl);
    bindEdges(svgEl);
    relaxLabels(svgEl);
    applySearch();
    requestAnimationFrame(fit);
  } catch (error) {
    if (token !== renderToken) return;
    cameraEl.textContent = "Could not draw this diagram. " + (error.message || error);
  }
}

function openFromHash() {
  const ids = location.hash.replace(/^#/, "").split("/").filter(Boolean);
  const id = ids.length ? ids[ids.length - 1] : DIAGRAMS.tabs[0].id;
  if (!VIEWS[id]) {
    show(DIAGRAMS.tabs[0].id);
    return;
  }
  show(id);
}

function zoomBy(factor) {
  const rect = viewportEl.getBoundingClientRect();
  const px = rect.width / 2;
  const py = rect.height / 2;
  const next = Math.min(2.6, Math.max(0.35, cam.s * factor));
  const k = next / cam.s;
  cam.x = px - (px - cam.x) * k;
  cam.y = py - (py - cam.y) * k;
  cam.s = next;
  applyCam();
}

async function exportHtml() {
  let css, data, app;
  try {
    [css, data, app] = await Promise.all([
      fetch("styles.css").then((response) => response.text()),
      fetch("diagrams.js").then((response) => response.text()),
      fetch("app.js").then((response) => response.text()),
    ]);
  } catch {
    setStatus("Export needs a local server. Open the folder with a static server, then export.");
    return;
  }
  const hash = stack.map((view) => view.id).join("/");
  const safe = (source) => source.replace(/<\/script/gi, "<\\/script");
  const body = document.body.cloneNode(true);
  body.querySelectorAll("script").forEach((script) => script.remove());
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Interactive Mermaid</title>
  <style>${css}</style>
</head>
<body>
${body.innerHTML}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>if (!location.hash) location.replace("#${hash}");</script>
<script>${safe(data)}</script>
<script>${safe(app)}</script>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "interactive-diagrams.html";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Downloaded a standalone HTML file.");
}

DIAGRAMS.tabs.forEach((tab) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = tab.label;
  button.dataset.id = tab.id;
  button.addEventListener("click", () => show(tab.id));
  tabsEl.appendChild(button);
});

document.getElementById("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(current.chart.trim() + "\n");
    setStatus("Copied the Mermaid source.");
  } catch {
    setStatus("Could not copy. Select the diagram source from the file instead.");
  }
});

document.getElementById("export").addEventListener("click", exportHtml);
document.getElementById("fit").addEventListener("click", fit);
document.getElementById("zoom-in").addEventListener("click", () => zoomBy(1.15));
document.getElementById("zoom-out").addEventListener("click", () => zoomBy(1 / 1.15));
const panelResizeEl = document.getElementById("panel-resize");
const panelMin = 240;
const panelGap = 280;
let panelWidth = 340;

function setPanelWidth(width) {
  const bounds = workspaceEl.getBoundingClientRect();
  const max = Math.max(panelMin, bounds.width - panelGap);
  panelWidth = Math.round(Math.min(max, Math.max(panelMin, width)));
  workspaceEl.style.setProperty("--panel-width", `${panelWidth}px`);
}

panelResizeEl.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  panelResizeEl.setPointerCapture(event.pointerId);
  panelResizeEl.classList.add("is-dragging");
  document.documentElement.classList.add("is-resizing");
  const startX = event.clientX;
  const startWidth = panelWidth;

  function move(ev) {
    setPanelWidth(startWidth + (startX - ev.clientX));
  }
  function end() {
    panelResizeEl.removeEventListener("pointermove", move);
    panelResizeEl.removeEventListener("pointerup", end);
    panelResizeEl.removeEventListener("pointercancel", end);
    panelResizeEl.classList.remove("is-dragging");
    document.documentElement.classList.remove("is-resizing");
    requestAnimationFrame(fit);
  }
  panelResizeEl.addEventListener("pointermove", move);
  panelResizeEl.addEventListener("pointerup", end);
  panelResizeEl.addEventListener("pointercancel", end);
});

panel.close.addEventListener("click", closePanel);
panel.zoom.addEventListener("click", () => {
  if (selected && selected.zoom) show(selected.zoom);
});

searchEl.addEventListener("input", applySearch);

viewportEl.addEventListener("selectstart", (event) => event.preventDefault());

viewportEl.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".is-node, .is-edge, .is-edge-label, .edge-hit") || event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY, cx: cam.x, cy: cam.y };
  viewportEl.classList.add("is-dragging");
  viewportEl.setPointerCapture(event.pointerId);
});

viewportEl.addEventListener("pointermove", (event) => {
  if (!drag) return;
  cam.x = drag.cx + (event.clientX - drag.x);
  cam.y = drag.cy + (event.clientY - drag.y);
  applyCam();
});

function endDrag() {
  drag = null;
  viewportEl.classList.remove("is-dragging");
}

viewportEl.addEventListener("pointerup", endDrag);
viewportEl.addEventListener("pointercancel", endDrag);

viewportEl.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const rect = viewportEl.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const next = Math.min(2.6, Math.max(0.35, cam.s * (event.deltaY < 0 ? 1.08 : 1 / 1.08)));
    const k = next / cam.s;
    cam.x = px - (px - cam.x) * k;
    cam.y = py - (py - cam.y) * k;
    cam.s = next;
    applyCam();
  },
  { passive: false }
);

document.addEventListener("keydown", (event) => {
  const typing = event.target.closest("input, textarea");
  if (event.key === "/" && !typing) {
    event.preventDefault();
    searchEl.focus();
  }
  if (event.key === "Escape") {
    hideTooltip();
    if (workspaceEl.classList.contains("panel-open")) closePanel();
    else if (stack.length > 1) show(stack[stack.length - 2].id);
  }
  if (event.key === "Backspace" && !typing && stack.length > 1) {
    event.preventDefault();
    show(stack[stack.length - 2].id);
  }
});

window.addEventListener("hashchange", () => {
  if (!hashLock) openFromHash();
});

openFromHash();
