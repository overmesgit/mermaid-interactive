// Hover dimming and the search filter. Both write is-dim on the bound SVG.

function setStatus(text) {
  app.els.status.textContent = text;
  clearTimeout(setStatus.timer);
  setStatus.timer = setTimeout(() => {
    app.els.status.textContent = "";
  }, 2400);
}

function tooltipText(node) {
  return node.zoom ? `${node.tooltip} Double-click to open the inner diagram.` : node.tooltip;
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

function showTooltip(event, item) {
  app.els.tooltip.textContent = tooltipText(item);
  placeTooltip(event);
  if (item.from) paint({ edgeId: item.id });
  else paint({ nodeId: item.id });
}

function hideTooltip() {
  app.els.tooltip.hidden = true;
  applySearch();
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
  app.els.camera.querySelectorAll(".is-node").forEach((el) => {
    const on = !active || hotNodes.has(el.dataset.nodeId);
    el.classList.toggle("is-dim", active && !on);
    el.classList.remove("is-hit");
  });
  app.els.camera.querySelectorAll(".is-edge:not(.edge-hit), .is-edge-label").forEach((el) => {
    const on = !active || hotEdges.has(el.dataset.edgeId);
    el.classList.toggle("is-dim", active && !on);
    el.classList.toggle("is-hot", active && on);
  });
}

function applySearch() {
  const query = app.els.search.value.trim().toLowerCase();
  const haystack = (item) =>
    [item.label, item.tooltip, item.body, item.kicker, item.match, ...(item.facts || []).flat()]
      .join(" ")
      .toLowerCase();
  app.els.camera.querySelectorAll(".is-node").forEach((el) => {
    const node = app.current.nodes[el.dataset.nodeId];
    if (!node) return;
    const hit = !query || haystack(node).includes(query);
    el.classList.toggle("is-dim", Boolean(query) && !hit);
    el.classList.toggle("is-hit", Boolean(query) && hit);
  });
  app.els.camera.querySelectorAll(".is-edge:not(.edge-hit), .is-edge-label").forEach((el) => {
    const edge = edgeById(el.dataset.edgeId);
    if (!edge) return;
    const hit = !query || haystack(edge).includes(query);
    el.classList.toggle("is-dim", Boolean(query) && !hit);
    el.classList.toggle("is-hot", Boolean(query) && hit);
  });
}
