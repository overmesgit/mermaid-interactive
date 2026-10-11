// Mermaid has already drawn the SVG. These functions find shapes and arrows. They do not attach listeners.

function norm(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function chartKind(chart) {
  const line = (chart || "").trim().split("\n")[0].trim();
  if (line.startsWith("flowchart")) return "flowchart";
  if (line.startsWith("C4")) return "c4";
  if (line.startsWith("sequenceDiagram")) return "sequence";
  if (line.startsWith("stateDiagram")) return "state";
  return "";
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

// One pattern per chart. Every hit is the shape group Mermaid drew for that chartId.
function findMermaidShapes(svg, chartId) {
  const kind = chartKind(app.view.chart);
  const id = escapeRegExp(chartId);
  const groups = new Set();
  if (kind === "flowchart") {
    // diagram-<n>-flowchart-<chartId>-<number>
    const pattern = new RegExp(`(?:^|-)flowchart-${id}-\\d+$`);
    svg.querySelectorAll("g.node").forEach((el) => {
      if (pattern.test(el.id)) groups.add(el);
    });
  } else if (kind === "c4") {
    // diagram-<n>-<alias> on the C4 shape, not on a marker.
    const pattern = new RegExp(`(?:^|-)${id}$`);
    svg.querySelectorAll("g.node.c4-shape").forEach((el) => {
      if (pattern.test(el.id)) groups.add(el);
    });
  } else if (kind === "sequence") {
    // Top and bottom actor boxes share the name. Lifelines have it too, and are not boxes.
    svg.querySelectorAll("rect.actor, g.actor-man").forEach((el) => {
      if (el.getAttribute("name") === chartId) groups.add(shapeGroup(el));
    });
  } else if (kind === "state") {
    // diagram-<n>-state-<name>-<number>
    const pattern = new RegExp(`(?:^|-)state-${id}-\\d+$`);
    svg.querySelectorAll("g.node").forEach((el) => {
      if (pattern.test(el.id)) groups.add(el);
    });
  }
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

// Path coordinates ignore the camera's CSS transform. getScreenCTM includes it, so the point lines up with getBoundingClientRect.
function screenPoint(path, distance) {
  const point = path.getPointAtLength(distance);
  const matrix = path.getScreenCTM();
  if (!matrix) return { x: point.x, y: point.y };
  const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix);
  return { x: screen.x, y: screen.y };
}

function nearestPoint(points, point) {
  let best = { chartId: "", distance: Infinity };
  points.forEach((item) => {
    const distance = Math.hypot(item.x - point.x, item.y - point.y);
    if (distance < best.distance) best = { chartId: item.chartId, distance };
  });
  return best;
}

// Flowchart arrows are path.flowchart-link. Mermaid puts the endpoints in the id: …L_<from>_<to>_<n>.
// Two arrows between the same shapes differ only in n, so a path the binder already wired is skipped.
function findFlowchartArrow(svg, edge) {
  const from = escapeRegExp(edge.from);
  const to = escapeRegExp(edge.to);
  const pattern = new RegExp(`(?:^|-)L_${from}_${to}_\\d+$`);
  return [...svg.querySelectorAll("path.flowchart-link")].find((path) => !path.dataset.wired && pattern.test(path.id));
}

// Screen distances shrink and grow with the camera. Multiply a limit in diagram units by the scale before comparing.
function onScreen(units) {
  return units * app.cam.s;
}

// A label farther than 160 diagram units from the path midpoint belongs to another arrow.
// data-wired is set by the binder, so a label already given to an arrow is skipped.
function nearestFlowchartLabel(path, labels) {
  const mid = screenPoint(path, path.getTotalLength() / 2);
  let best = null;
  let bestDistance = onScreen(160);
  labels.forEach((label) => {
    if (label.dataset.wired) return;
    const box = label.getBoundingClientRect();
    const distance = Math.hypot(box.left + box.width / 2 - mid.x, box.top + box.height / 2 - mid.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = label;
    }
  });
  return best;
}

// Sequence diagrams emit messageText, then messageLine, as siblings. The text is how arrows are told apart.
function sequenceMessages(svg) {
  const messages = [];
  let text = null;
  [...svg.children].forEach((el) => {
    const cls = el.getAttribute("class") || "";
    if (cls.includes("messageText")) text = el;
    else if (cls.includes("messageLine")) {
      messages.push({ line: el, text, label: norm(text ? text.textContent : ""), wired: false });
      text = null;
    }
  });
  return messages;
}

// C4 draws every relationship in one group: a line or path, then the text nodes that belong to it.
function c4Relations(svg) {
  const relationshipGroup = [...svg.querySelectorAll("g")].find((group) => {
    const kids = [...group.children];
    return kids.some((el) => el.tagName === "line") && kids.some((el) => el.tagName === "text");
  });
  if (!relationshipGroup) return [];
  const relations = [];
  let relation = null;
  [...relationshipGroup.children].forEach((el) => {
    if (el.tagName === "line" || el.tagName === "path") {
      relation = { strokes: [el], texts: [], wired: false };
      relations.push(relation);
    } else if (el.tagName === "text" && relation) relation.texts.push(el);
  });
  return relations.map((item) => ({
    ...item,
    label: norm(item.texts.map((text) => text.textContent).join(" ")),
  }));
}

// The binder tries exact matches first. A prefix match is the fallback, so "Pay" does not take "Pay refund" from its own arrow.
function textMatches(rendered, wanted, exact) {
  const left = norm(rendered).toLowerCase();
  const right = norm(wanted).toLowerCase();
  if (!right) return false;
  return exact ? left === right : left.startsWith(right);
}

// State start and end dots are not node interactions. Mermaid draws them as root_start and root_end, and edge interactions call them *.
function shapeCentersOnScreen(svg) {
  const centers = [];
  svg.querySelectorAll(".is-node").forEach((el) => {
    const box = el.getBoundingClientRect();
    if (box.width < 2) return;
    centers.push({ chartId: el.dataset.chartId, x: box.left + box.width / 2, y: box.top + box.height / 2 });
  });
  svg.querySelectorAll("g.node").forEach((el) => {
    if (!/root_start|root_end/.test(el.id)) return;
    const box = el.getBoundingClientRect();
    centers.push({ chartId: "*", x: box.left + box.width / 2, y: box.top + box.height / 2 });
  });
  return centers;
}

// State arrows are path.transition. Their ids do not name the endpoints, so match by which shape centers the line meets.
function matchStateArrows(paths, edges, svg) {
  const centers = shapeCentersOnScreen(svg);
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
      if (score < onScreen(360)) candidates.push({ path, edge, score });
    });
  });
  candidates.sort((a, b) => a.score - b.score);
  const usedPaths = new Set();
  const usedEdges = new Set();
  const pairs = [];
  candidates.forEach((candidate) => {
    if (usedPaths.has(candidate.path) || usedEdges.has(candidate.edge)) return;
    usedPaths.add(candidate.path);
    usedEdges.add(candidate.edge);
    pairs.push({ path: candidate.path, edge: candidate.edge });
  });
  return pairs;
}

function endpointDistance(start, end, edge) {
  if (edge.from !== "*" && start.chartId !== edge.from) return Infinity;
  if (edge.to !== "*" && end.chartId !== edge.to) return Infinity;
  if (edge.from === "*" && start.chartId !== "*") return Infinity;
  if (edge.to === "*" && end.chartId !== "*") return Infinity;
  return (edge.from === "*" ? 0 : start.distance) + (edge.to === "*" ? 0 : end.distance);
}
