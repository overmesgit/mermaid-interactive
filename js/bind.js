// Join node and edge interactions to the Mermaid shapes and arrows already found.

const SVG_NS = "http://www.w3.org/2000/svg";

function addBadge(shape) {
  let box;
  try {
    box = shape.getBBox();
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
  shape.appendChild(badge);
}

function wireShape(shape, interaction) {
  shape.classList.add("is-node");
  shape.dataset.chartId = interaction.chartId;
  shape.setAttribute("role", "button");
  shape.setAttribute("tabindex", "0");
  shape.setAttribute(
    "aria-label",
    interaction.opensView ? `${interaction.label}, has an inner diagram` : interaction.label
  );
  shape.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onInteractionClick(event, interaction);
  });
  shape.addEventListener("pointerenter", (event) => showTooltip(event, interaction));
  shape.addEventListener("pointermove", placeTooltip);
  shape.addEventListener("pointerleave", hideTooltip);
  shape.addEventListener("click", (event) => onInteractionClick(event, interaction));
  shape.addEventListener("dblclick", (event) => onInteractionDblClick(event, interaction));
  if (interaction.opensView) addBadge(shape);
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

function bindNodeInteractions(svg) {
  const wired = new Set();
  nodeInteractions().forEach((interaction) => {
    findMermaidShapes(svg, interaction.chartId).forEach((shape) => {
      if (wired.has(shape)) return;
      wired.add(shape);
      wireShape(shape, interaction);
    });
  });
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

// `arrowElements` are the SVG pieces Mermaid drew for one arrow: the stroke, and its label when there is one.
// Only the first stroke is a keyboard button, so the label is not a second tab stop.
function wireArrow(interaction, arrowElements) {
  let keyboardButton = true;
  arrowElements.filter(Boolean).forEach((element) => {
    element.dataset.wired = "1";
    element.dataset.edgeId = interaction.edgeId;
    if (element.tagName === "path" || element.tagName === "line") {
      element.classList.add("is-edge");
      const hit = addWideHitStroke(element);
      hit.dataset.edgeId = interaction.edgeId;
      listenOnArrow(hit, interaction, keyboardButton);
      keyboardButton = false;
    } else {
      element.classList.add("is-edge-label");
      listenOnArrow(element, interaction, false);
    }
  });
}

function listenOnArrow(el, interaction, keyboardButton) {
  if (keyboardButton) {
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute(
      "aria-label",
      interaction.opensView ? `${interaction.label}, has an inner diagram` : interaction.label
    );
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onInteractionClick(event, interaction);
    });
  }
  el.addEventListener("pointerenter", (event) => showTooltip(event, interaction));
  el.addEventListener("pointermove", placeTooltip);
  el.addEventListener("pointerleave", hideTooltip);
  el.addEventListener("click", (event) => onInteractionClick(event, interaction));
  el.addEventListener("dblclick", (event) => onInteractionDblClick(event, interaction));
}

// Each edge interaction is claimed once. Flowchart ids, then sequence text, then C4 text, then state geometry.
function bindEdgeInteractions(svg) {
  const edges = edgeInteractions();
  const wired = new Set();
  const labels = [...svg.querySelectorAll("g.edgeLabel")].filter(
    (label) => !label.querySelector("g.edgeLabel")
  );

  function claimEdge(edge, arrowElements) {
    if (wired.has(edge)) return;
    wired.add(edge);
    wireArrow(edge, arrowElements);
  }

  edges.forEach((edge) => {
    const path = findFlowchartArrow(svg, edge);
    if (!path || path.dataset.wired) return;
    const label = nearestFlowchartLabel(path, labels);
    if (label) label.dataset.wired = "1";
    claimEdge(edge, [path, label]);
  });

  const messages = sequenceMessages(svg);
  edges.forEach((edge) => {
    if (wired.has(edge) || !edge.mermaidText) return;
    const message = messages.find((item) => !item.wired && textMatches(item.label, edge.mermaidText));
    if (!message) return;
    message.wired = true;
    claimEdge(edge, [message.line, message.text]);
  });

  const relations = c4Relations(svg);
  edges.forEach((edge) => {
    if (wired.has(edge) || !edge.mermaidText) return;
    const relation = relations.find((item) => !item.wired && textMatches(item.label, edge.mermaidText));
    if (!relation) return;
    relation.wired = true;
    claimEdge(edge, [...relation.strokes, ...relation.texts]);
  });

  const paths = [...svg.querySelectorAll("path.transition")].filter((path) => !path.dataset.wired);
  matchStateArrows(paths, edges.filter((edge) => !wired.has(edge)), svg).forEach(({ path, edge }) => {
    wireArrow(edge, [path]);
  });
}
