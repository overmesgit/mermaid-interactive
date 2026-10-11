// Hover dimming and the search filter. Both write is-dim on the wired SVG.

// The visible stroke and the label of a wired arrow. The wide hit stroke has only the edge-hit class.
const EDGE_PIECES = ".is-edge, .is-edge-label";

function setStatus(text) {
  app.els.status.textContent = text;
  clearTimeout(setStatus.timer);
  setStatus.timer = setTimeout(() => {
    app.els.status.textContent = "";
  }, 2400);
}

function tooltipText(interaction) {
  return interaction.opensView ? `${interaction.tooltip} Double-click to open the inner diagram.` : interaction.tooltip;
}

function placeTooltip(event) {
  const tooltip = app.els.tooltip;
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
  placeTooltip(event);
  highlightAround(interaction);
}

function hideTooltip() {
  app.els.tooltip.hidden = true;
  applySearch();
}

function highlightAround(interaction) {
  const edges = edgeInteractions();
  const litEdgeIds = new Set();
  const litChartIds = new Set();
  if (interaction.kind === "edge") {
    litEdgeIds.add(interaction.edgeId);
    litChartIds.add(interaction.from);
    litChartIds.add(interaction.to);
  } else {
    litChartIds.add(interaction.chartId);
    edges.forEach((edge) => {
      if (edge.from === interaction.chartId || edge.to === interaction.chartId) {
        litEdgeIds.add(edge.edgeId);
        litChartIds.add(edge.from);
        litChartIds.add(edge.to);
      }
    });
  }
  app.els.camera.querySelectorAll(".is-node").forEach((el) => {
    const on = litChartIds.has(el.dataset.chartId);
    el.classList.toggle("is-dim", !on);
    el.classList.remove("is-hit");
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

// The shape or arrow the panel describes. Hover and search do not touch is-selected.
function markSelected(interaction) {
  app.els.camera.querySelectorAll(".is-selected").forEach((el) => el.classList.remove("is-selected"));
  const elements = wiredElements(interaction);
  elements.forEach((el) => el.classList.add("is-selected"));
  return elements;
}

function applySearch() {
  const query = app.els.search.value.trim().toLowerCase();
  const haystack = (interaction) =>
    [interaction.label, interaction.tooltip, interaction.body, interaction.kicker, interaction.mermaidText, ...(interaction.facts || []).flat()]
      .join(" ")
      .toLowerCase();
  app.els.camera.querySelectorAll(".is-node").forEach((el) => {
    const interaction = nodeInteraction(el.dataset.chartId);
    if (!interaction) return;
    const hit = !query || haystack(interaction).includes(query);
    el.classList.toggle("is-dim", Boolean(query) && !hit);
    el.classList.toggle("is-hit", Boolean(query) && hit);
  });
  const edges = new Map(edgeInteractions().map((edge) => [edge.edgeId, edge]));
  app.els.camera.querySelectorAll(EDGE_PIECES).forEach((el) => {
    const interaction = edges.get(el.dataset.edgeId);
    if (!interaction) return;
    const hit = !query || haystack(interaction).includes(query);
    el.classList.toggle("is-dim", Boolean(query) && !hit);
    el.classList.toggle("is-hot", Boolean(query) && hit);
  });
}
