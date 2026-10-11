// Shared view, camera, and element refs. The other scripts read and write this object.

const app = {
  views: DIAGRAMS.views,
  els: {
    tabs: document.getElementById("tabs"),
    crumbs: document.getElementById("crumbs"),
    summary: document.getElementById("summary"),
    camera: document.getElementById("camera"),
    viewport: document.getElementById("viewport"),
    workspace: document.getElementById("workspace"),
    panel: document.getElementById("panel"),
    tooltip: document.getElementById("tooltip"),
    status: document.getElementById("status"),
    search: document.getElementById("search"),
    panelResize: document.getElementById("panel-resize"),
    help: document.getElementById("help"),
  },
  panel: {
    kicker: document.getElementById("panel-kicker"),
    title: document.getElementById("panel-title"),
    lead: document.getElementById("panel-lead"),
    body: document.getElementById("panel-body"),
    facts: document.getElementById("panel-facts"),
    links: document.getElementById("panel-links"),
    zoom: document.getElementById("panel-zoom"),
    close: document.getElementById("panel-close"),
  },
  stack: [],
  view: null,
  selectedInteraction: null,
  renderToken: 0,
  hashLock: false,
  cam: { x: 40, y: 32, s: 1 },
  cams: {},
  drag: null,
};

// The node interactions for the diagram on screen. chartId is the Mermaid id, copied from the map key.
function nodeInteractions() {
  const stored = (app.view && app.view.nodeInteractions) || {};
  return Object.entries(stored).map(([chartId, interaction]) => ({
    ...interaction,
    chartId,
    kind: "node",
  }));
}

function nodeInteraction(chartId) {
  const stored = app.view && app.view.nodeInteractions && app.view.nodeInteractions[chartId];
  if (!stored) return null;
  return { ...stored, chartId, kind: "node" };
}

// The edge interactions for the diagram on screen. edgeId is from-to-index, so two arrows between the same shapes stay distinct.
function edgeInteractions() {
  const view = app.view;
  if (!view) return [];
  const interactions = view.nodeInteractions || {};
  return (view.edgeInteractions || []).map((edge, index) => {
    const from = Array.isArray(edge) ? edge[0] : edge.from;
    const to = Array.isArray(edge) ? edge[1] : edge.to;
    const fromLabel = interactions[from]?.label || from;
    const toLabel = interactions[to]?.label || to;
    return {
      kicker: "Arrow",
      label: `${fromLabel} → ${toLabel}`,
      tooltip: `${fromLabel} to ${toLabel}`,
      ...(Array.isArray(edge) ? {} : edge),
      from,
      to,
      edgeId: `${from}-${to}-${index}`,
      kind: "edge",
    };
  });
}

function edgeInteraction(edgeId) {
  return edgeInteractions().find((edge) => edge.edgeId === edgeId) || null;
}
