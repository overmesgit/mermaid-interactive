// Shared view, camera, and element refs. The other scripts read and write this object.

const app = {
  views: DIAGRAMS.views,
  els: {
    tabs: document.getElementById("tabs"),
    crumbs: document.getElementById("crumbs"),
    lesson: document.getElementById("lesson"),
    lessonCount: document.getElementById("lesson-count"),
    lessonPrev: document.getElementById("lesson-prev"),
    lessonNext: document.getElementById("lesson-next"),
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
    storyOpen: document.getElementById("story-open"),
    legend: document.getElementById("legend"),
  },
  panel: {
    kicker: document.getElementById("panel-kicker"),
    title: document.getElementById("panel-title"),
    lead: document.getElementById("panel-lead"),
    body: document.getElementById("panel-body"),
    facts: document.getElementById("panel-facts"),
    links: document.getElementById("panel-links"),
    parts: document.getElementById("panel-parts"),
    zoom: document.getElementById("panel-zoom"),
    selected: document.getElementById("panel-selected"),
    close: document.getElementById("panel-close"),
  },
  stack: [],
  view: null,
  shownViewId: null,
  selectedInteraction: null,
  // The reader closed the story, so the next diagram does not open it again.
  storyHidden: false,
  renderToken: 0,
  // True while the page follows Back or Forward, so it does not add a history entry of its own.
  replaying: false,
  cam: { x: 40, y: 32, s: 1 },
  cams: {},
  drag: null,
};

// What a part's status means. The page colors the part and also writes the word, so color is never the only signal.
const STATUSES = { new: "New", changed: "Changed", removed: "Removed", problem: "Problem" };

// How much a part matters to the point: key parts stand out, background parts step back.
const WEIGHTS = ["key", "background"];

// A part whose note says more than its tooltip is worth opening, and the page marks it.
function hasMore(interaction) {
  return Boolean(interaction.body || (interaction.facts && interaction.facts.length) || interaction.opensView);
}

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
