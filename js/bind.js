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

// A small dot in the top left corner marks a shape with more to read than its tooltip. The ↘ badge already marks an inner diagram.
function addMoreDot(shape) {
  let box;
  try {
    box = shape.getBBox();
  } catch {
    return;
  }
  // In its own group, so the styles for a shape's outline do not reach it.
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "more-dot");
  const dot = document.createElementNS(SVG_NS, "circle");
  // A diamond's top left corner is empty space, so a polygon gets the dot below its top point instead.
  const polygon = shape.querySelector(":scope > polygon");
  dot.setAttribute("cx", String(polygon ? box.x + box.width / 2 : box.x + 7));
  dot.setAttribute("cy", String(polygon ? box.y + 14 : box.y + 7));
  dot.setAttribute("r", "3.5");
  group.append(dot);
  shape.appendChild(group);
}

function wireShape(shape, interaction) {
  shape.classList.add("is-node");
  shape.dataset.chartId = interaction.chartId;
  if (typeIndex(interaction.type) >= 0) shape.classList.add(`type-${typeIndex(interaction.type)}`);
  makeInteractive(shape, interaction, true);
  if (interaction.opensView) addBadge(shape);
  else if (hasMore(interaction)) addMoreDot(shape);
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

// Returns the node interactions that found no shape, for the checks.
function bindNodeInteractions(svg) {
  const wired = new Set();
  const missed = [];
  nodeInteractions().forEach((interaction) => {
    const shapes = findMermaidShapes(svg, interaction.chartId);
    if (!shapes.length) missed.push(interaction);
    shapes.forEach((shape) => {
      if (wired.has(shape)) return;
      wired.add(shape);
      wireShape(shape, interaction);
    });
  });
  return missed;
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
    if (typeIndex(interaction.type) >= 0) element.classList.add(`type-${typeIndex(interaction.type)}`);
    if (element.tagName === "path" || element.tagName === "line") {
      element.classList.add("is-edge");
      const hit = addWideHitStroke(element);
      hit.dataset.edgeId = interaction.edgeId;
      makeInteractive(hit, interaction, keyboardButton);
      keyboardButton = false;
    } else {
      element.classList.add("is-edge-label");
      makeInteractive(element, interaction, false);
    }
  });
}

// Shapes and arrows get the same listeners. A keyboard button is also a tab stop with an aria-label.
function makeInteractive(el, interaction, keyboardButton) {
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
// Returns the edge interactions that found no arrow, for the checks.
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

  // Sequence and C4 arrows are told apart by their text. `items` carry a label; `pieces` gives the SVG for one.
  // Every edge tries an exact match before any edge falls back to a prefix.
  function claimByText(items, pieces) {
    [true, false].forEach((exact) => {
      edges.forEach((edge) => {
        if (wired.has(edge) || !edge.mermaidText) return;
        const item = items.find((candidate) => !candidate.wired && textMatches(candidate.label, edge.mermaidText, exact));
        if (!item) return;
        item.wired = true;
        claimEdge(edge, pieces(item));
      });
    });
  }

  claimByText(sequenceMessages(svg), (message) => {
    if (message.number) message.line.dataset.number = message.number;
    return [message.line, ...message.texts];
  });
  claimByText(c4Relations(svg), (relation) => [...relation.strokes, ...relation.texts]);

  const paths = [...svg.querySelectorAll("path.transition")].filter((path) => !path.dataset.wired);
  matchStateArrows(paths, edges.filter((edge) => !wired.has(edge)), svg).forEach(({ path, edge }) => {
    claimEdge(edge, [path]);
  });
  return edges.filter((edge) => !wired.has(edge));
}
