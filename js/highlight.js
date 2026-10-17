// Hover dimming, the tooltip, and the marks on the wired SVG: selected, flowing, and status.

// The visible stroke and the label of a wired arrow. The wide hit stroke has only the edge-hit class.
const EDGE_PIECES = ".is-edge, .is-edge-label";

function setStatus(text) {
  app.els.status.textContent = text;
  clearTimeout(setStatus.timer);
  setStatus.timer = setTimeout(() => {
    app.els.status.textContent = "";
  }, 2400);
}

// A tooltip is optional, so a part without one only lights up on hover.
function tooltipText(interaction) {
  return [interaction.tooltip, interaction.opensView && "Double-click to open the inner diagram."].filter(Boolean).join(" ");
}

function placeTooltip(event) {
  const tooltip = app.els.tooltip;
  if (!tooltip.textContent) return;
  tooltip.hidden = false;
  const rect = tooltip.getBoundingClientRect();
  let x = event.clientX + 14;
  let y = event.clientY + 18;
  if (x + rect.width > window.innerWidth - 8) x = event.clientX - rect.width - 12;
  if (y + rect.height > window.innerHeight - 8) y = event.clientY - rect.height - 12;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function showTooltip(event, interaction) {
  app.els.tooltip.textContent = tooltipText(interaction);
  app.els.tooltip.hidden = true;
  placeTooltip(event);
  highlightAround(interaction);
}

function hideTooltip() {
  app.els.tooltip.hidden = true;
  clearHighlight();
}

// Back to no hover highlight. What the story is at stays lit, so the picture follows the reader again.
function clearHighlight() {
  app.els.camera.querySelectorAll(".is-dim, .is-hover, .is-hot").forEach((el) => el.classList.remove("is-dim", "is-hover", "is-hot"));
  app.els.camera.classList.toggle("is-following", Boolean(app.reading));
  if (app.reading) lightParts(app.reading);
}

function highlightAround(interaction) {
  app.els.camera.classList.remove("is-following");
  lightParts([interaction], interaction);
}


// Lights the parts and dims the rest. An arrow lights with its two ends, and a shape with its arrows.
// `hovered` is the part under the pointer, if any, and a shape there gets an outline.
function lightParts(parts, hovered) {
  const edges = edgeInteractions();
  const litEdgeIds = new Set();
  const litChartIds = new Set();
  parts.forEach((part) => {
    if (part.kind === "edge") {
      litEdgeIds.add(part.edgeId);
      litChartIds.add(part.from);
      litChartIds.add(part.to);
      return;
    }
    litChartIds.add(part.chartId);
    edges.forEach((edge) => {
      if (edge.from === part.chartId || edge.to === part.chartId) {
        litEdgeIds.add(edge.edgeId);
        litChartIds.add(edge.from);
        litChartIds.add(edge.to);
      }
    });
  });
  app.els.camera.querySelectorAll(".is-node").forEach((el) => {
    const on = litChartIds.has(el.dataset.chartId);
    el.classList.toggle("is-dim", !on);
    // The hovered shape gets an outline. The fade on the others is light, and colored fills hide it further.
    el.classList.toggle("is-hover", hovered?.kind === "node" && el.dataset.chartId === hovered.chartId);
  });
  app.els.camera.querySelectorAll(EDGE_PIECES).forEach((el) => {
    const on = litEdgeIds.has(el.dataset.edgeId);
    el.classList.toggle("is-dim", !on);
    el.classList.toggle("is-hot", on);
  });
}

// The wired SVG pieces for a node or edge interaction.
function wiredElements(interaction) {
  if (!interaction) return [];
  if (interaction.kind === "edge") {
    return [...app.els.camera.querySelectorAll(EDGE_PIECES)].filter(
      (el) => el.dataset.edgeId === interaction.edgeId
    );
  }
  return [...app.els.camera.querySelectorAll(".is-node")].filter(
    (el) => el.dataset.chartId === interaction.chartId
  );
}

// The shape or arrow the panel describes. Hover does not touch is-selected.
function markSelected(interaction) {
  app.els.camera.querySelectorAll(".is-selected").forEach((el) => el.classList.remove("is-selected"));
  const elements = wiredElements(interaction);
  elements.forEach((el) => el.classList.add("is-selected"));
  return elements;
}

// A lit arrow flows from start to end, so the reader sees which way it goes. With nothing selected on a lesson step,
// the arrows that step adds keep flowing, so what is new stands out before anything is clicked.
function markStepFlow() {
  const added = app.selectedInteraction ? null : addedInStep();
  const edges = new Map(edgeInteractions().map((edge) => [edge.edgeId, edge]));
  app.els.camera.querySelectorAll(".is-edge").forEach((el) => {
    const edge = edges.get(el.dataset.edgeId);
    el.classList.toggle("is-flow", Boolean(added && edge && added.has(partKey(edge))));
  });
}

// Each part's status colors it: the one the content gives, or New for a part this lesson step adds.
function markStatuses() {
  const added = addedInStep();
  const byChartId = new Map(nodeInteractions().map((interaction) => [interaction.chartId, interaction]));
  const byEdgeId = new Map(edgeInteractions().map((edge) => [edge.edgeId, edge]));
  app.els.camera.querySelectorAll(`.is-node, ${EDGE_PIECES}`).forEach((el) => {
    const interaction = el.dataset.edgeId ? byEdgeId.get(el.dataset.edgeId) : byChartId.get(el.dataset.chartId);
    const status = interaction && partStatus(interaction, added);
    Object.keys(STATUSES).forEach((name) => el.classList.toggle(`status-${name}`, name === status));
  });
}

function statusChip(name) {
  const chip = document.createElement("span");
  chip.className = `status-chip status-${name}`;
  chip.textContent = STATUSES[name];
  return chip;
}
