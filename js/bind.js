// Mermaid has already drawn the SVG. These functions find each note's shape or arrow in that SVG and attach hover, click, and drill-down.

const SVG_NS = "http://www.w3.org/2000/svg";

function norm(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

// Flowchart ids look like flowchart-api-0. C4 ids look like diagram-3-reader.
// The note id is the whole id, or the last dash-separated piece, plus an optional -number.
function idMatches(domId, nodeId) {
  if (!domId) return false;
  if (domId === nodeId) return true;
  const escaped = nodeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|-)${escaped}(?:-\\d+)?$`).test(domId);
}

function shapeGroup(el) {
  return (
    el.closest(
      "g.node, g.actor, g.person, g.system, g.container, g.component, g.external, g.external_person, g.boundary"
    ) ||
    el.closest("g") ||
    el
  );
}

// The SVG group Mermaid drew for this note: by id, then by the name attribute, then by label text.
function mermaidShapesFor(svg, node) {
  const byId = [...svg.querySelectorAll("[id]")].filter((el) => idMatches(el.id, node.id));
  const named = [...svg.querySelectorAll("[name]")].filter((el) => el.getAttribute("name") === node.id);
  const direct = [...byId, ...named.map(shapeGroup)];
  if (direct.length) {
    return direct.filter(
      (el) => visibleShape(el) && !direct.some((other) => other !== el && el.contains(other))
    );
  }
  const wanted = new Set([norm(node.label), ...(node.match || []).map(norm)]);
  const groups = new Set();
  svg.querySelectorAll("text, tspan, span, div, p").forEach((el) => {
    const text = norm(el.textContent);
    if (!wanted.has(text)) return;
    if ([...el.children].some((child) => norm(child.textContent) === text)) return;
    groups.add(shapeGroup(el));
  });
  return [...groups].filter(visibleShape);
}

// Sequence lifelines are tall groups with almost no width. They must not become buttons.
function visibleShape(el) {
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
  path.setAttribute("d", "M-3.5-3.5L3.5 3.5M3.5-1V3.5H-1");
  badge.append(circle, path);
  host.appendChild(badge);
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

// Mermaid's HTML labels sit in a foreignObject that clips the text. Grow it to the label's scroll height.
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
  Object.entries(app.current.nodes).forEach(([id, node]) => {
    const bound = { ...node, id };
    mermaidShapesFor(svg, bound).forEach((host) => {
      if (used.has(host)) return;
      used.add(host);
      attach(host, bound);
    });
  });
}

function currentEdges() {
  return (app.current.edges || []).map((edge, index) => {
    const from = Array.isArray(edge) ? edge[0] : edge.from;
    const to = Array.isArray(edge) ? edge[1] : edge.to;
    const fromLabel = app.current.nodes[from]?.label || from;
    const toLabel = app.current.nodes[to]?.label || to;
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

// Path coordinates ignore the camera's CSS transform. getScreenCTM includes it, so the point lines up with getBoundingClientRect.
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

// The visible stroke is too thin to hover. Clone it into a transparent, wider stroke and listen on that.
function addWideHitStroke(el) {
  const hit = el.cloneNode(false);
  hit.removeAttribute("id");
  hit.removeAttribute("marker-end");
  hit.removeAttribute("marker-start");
  hit.setAttribute("class", "edge-hit");
  el.parentNode.insertBefore(hit, el.nextSibling);
  return hit;
}

// `parts` are the SVG pieces Mermaid drew for one arrow: the stroke, and its label when there is one.
// Only the first stroke is a keyboard button, so the label is not a second tab stop.
function wireMermaidEdge(edge, parts) {
  let keyboardButton = true;
  parts.filter(Boolean).forEach((part) => {
    if (part.tagName === "path" || part.tagName === "line") {
      part.classList.add("is-edge");
      part.dataset.bound = "1";
      part.dataset.edgeId = edge.id;
      const hit = addWideHitStroke(part);
      hit.dataset.edgeId = edge.id;
      listenOnMermaidEdge(hit, edge, keyboardButton);
      keyboardButton = false;
    } else {
      part.classList.add("is-edge-label");
      part.dataset.edgeId = edge.id;
      listenOnMermaidEdge(part, edge, false);
    }
  });
}

function listenOnMermaidEdge(el, edge, keyboardButton) {
  if (keyboardButton) {
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

// Flowchart arrows are path.flowchart-link. Mermaid puts the endpoints in the id: …L_<from>_<to>_<n>.
function flowchartLinkPath(svg, edge) {
  const from = edge.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const to = edge.to.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|-)L_${from}_${to}_\\d+$`);
  return [...svg.querySelectorAll("path.flowchart-link")].find((path) => pattern.test(path.id));
}

// A label farther than 160px from the path midpoint belongs to another arrow.
function nearestFlowchartLabel(path, labels) {
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

// Sequence diagrams emit messageText, then messageLine, as siblings. The text is how arrows are told apart.
function mermaidSequenceMessages(svg) {
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

// C4 draws every relationship in one group: a line or path, then the text nodes that belong to it.
function mermaidC4Rels(svg) {
  const host = [...svg.querySelectorAll("g")].find((group) => {
    const kids = [...group.children];
    return kids.some((el) => el.tagName === "line") && kids.some((el) => el.tagName === "text");
  });
  if (!host) return [];
  const rels = [];
  let rel = null;
  [...host.children].forEach((el) => {
    if (el.tagName === "line" || el.tagName === "path") {
      rel = { strokes: [el], texts: [], used: false };
      rels.push(rel);
    } else if (el.tagName === "text" && rel) rel.texts.push(el);
  });
  return rels.map((item) => ({
    ...item,
    label: norm(item.texts.map((text) => text.textContent).join(" ")),
  }));
}

function textMatches(rendered, wanted) {
  const left = norm(rendered).toLowerCase();
  const right = norm(wanted).toLowerCase();
  if (!right) return false;
  return left === right || left.startsWith(right);
}

// State start and end dots are not bound nodes. Mermaid draws them as root_start and root_end, and notes call them *.
function nodeCentersOnScreen(svg) {
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

// State arrows are path.transition. Their ids do not name the endpoints, so match by which node centers the line meets.
function matchStateArrowsByEnds(paths, edges, svg) {
  const centers = nodeCentersOnScreen(svg);
  const candidates = [];
  paths.forEach((path) => {
    const length = path.getTotalLength();
    if (!length) return;
    const start = nearestPoint(centers, screenPoint(path, 1));
    const end = nearestPoint(centers, screenPoint(path, Math.max(1, length - 1)));
    edges.forEach((edge) => {
      const forward = endpointDistance(start, end, edge);
      const backward = endpointDistance(end, start, edge);
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
    wireMermaidEdge(candidate.edge, [candidate.path]);
  });
}

function endpointDistance(start, end, edge) {
  if (edge.from !== "*" && start.id !== edge.from) return Infinity;
  if (edge.to !== "*" && end.id !== edge.to) return Infinity;
  if (edge.from === "*" && start.id !== "*") return Infinity;
  if (edge.to === "*" && end.id !== "*") return Infinity;
  return (edge.from === "*" ? 0 : start.d) + (edge.to === "*" ? 0 : end.d);
}

// Each note is claimed once. Flowchart ids, then sequence text, then C4 text, then state geometry.
function bindEdges(svg) {
  const edges = currentEdges();
  const used = new Set();
  const labels = [...svg.querySelectorAll("g.edgeLabel")].filter(
    (label) => !label.querySelector("g.edgeLabel")
  );

  function claimEdge(edge, parts) {
    if (used.has(edge)) return;
    used.add(edge);
    wireMermaidEdge(edge, parts);
  }

  edges.forEach((edge) => {
    const path = flowchartLinkPath(svg, edge);
    if (!path || path.dataset.bound) return;
    claimEdge(edge, [path, nearestFlowchartLabel(path, labels)]);
  });

  const messages = mermaidSequenceMessages(svg);
  edges.forEach((edge) => {
    if (used.has(edge) || !edge.match) return;
    const message = messages.find((item) => !item.used && textMatches(item.label, edge.match));
    if (!message) return;
    message.used = true;
    claimEdge(edge, [message.line, message.text]);
  });

  const rels = mermaidC4Rels(svg);
  edges.forEach((edge) => {
    if (used.has(edge) || !edge.match) return;
    const rel = rels.find((item) => !item.used && textMatches(item.label, edge.match));
    if (!rel) return;
    rel.used = true;
    claimEdge(edge, [...rel.strokes, ...rel.texts]);
  });

  const paths = [...svg.querySelectorAll("path.transition")].filter((path) => !path.dataset.bound);
  matchStateArrowsByEnds(paths, edges.filter((edge) => !used.has(edge)), svg);
}
