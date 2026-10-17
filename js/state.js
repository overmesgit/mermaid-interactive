// Shared view, camera, and element refs. The other scripts read and write this object.

// The content is put into one shape on load, so the rest of the page reads one form.
// A view's id is its key, and every arrow is an object, also one written short as [from, to].
Object.entries(DIAGRAMS.views).forEach(([viewId, view]) => {
  view.viewId = viewId;
  view.edgeInteractions = (view.edgeInteractions || []).map((edge) => (Array.isArray(edge) ? { from: edge[0], to: edge[1] } : edge));
});

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
    panelResize: document.getElementById("panel-resize"),
    stage: document.querySelector(".stage-wrap"),
    peekCaret: document.getElementById("peek-caret"),
    peekPlaces: document.getElementById("peek-places"),
    help: document.getElementById("help"),
    storyOpen: document.getElementById("story-open"),
  },
  // The story pane, on top of the panel.
  panel: {
    pane: document.getElementById("story-pane"),
    kicker: document.getElementById("panel-kicker"),
    title: document.getElementById("panel-title"),
    lead: document.getElementById("panel-lead"),
    body: document.getElementById("panel-body"),
    parts: document.getElementById("panel-parts"),
    close: document.getElementById("panel-close"),
  },
  // The note pane. It shows the open part, inline in the story or as a peek card on the canvas.
  note: {
    pane: document.getElementById("note-pane"),
    kicker: document.getElementById("note-kicker"),
    title: document.getElementById("note-title"),
    lead: document.getElementById("note-lead"),
    body: document.getElementById("note-body"),
    facts: document.getElementById("panel-facts"),
    zoom: document.getElementById("panel-zoom"),
    close: document.getElementById("note-close"),
  },
  stack: [],
  view: null,
  shownViewId: null,
  selectedInteraction: null,
  // How the open note was opened: { mode: "inline" or "peek", place, anchor }. anchor is the story block it sits under.
  noteHow: null,
  // The reader closed the story, so the next diagram does not open it again.
  storyHidden: false,
  renderToken: 0,
  cam: { x: 40, y: 32, s: 1 },
  cams: {},
  drag: null,
};

// What a part's status means. The page colors the part and also writes the word, so color is never the only signal.
const STATUSES = { new: "New", changed: "Changed", removed: "Removed", problem: "Problem" };

// The types of thing an explanation names in DIAGRAMS.types, such as request, route, and handler, each keep one color in the diagram and in the text.
// The colors are fixed and given in order, so every explanation reads the same and none is confused with a status.
const TYPE_COLORS = 4;

function typeIndex(name) {
  const index = Object.keys(DIAGRAMS.types || {}).indexOf(name);
  return index < TYPE_COLORS ? index : -1;
}

// A part whose note says more than its tooltip is worth opening, and the page marks it.
function hasMore(interaction) {
  return Boolean(interaction.body || (interaction.facts && interaction.facts.length) || interaction.opensView);
}

// A part's key is the way a link names it: api for a shape, web->api for an arrow. Two arrows between the same shapes are one part.
function partKey(interaction) {
  return interaction.kind === "edge" ? `${interaction.from}->${interaction.to}` : interaction.chartId;
}

// The keys of every part a view has a note for.
function partKeysOf(view) {
  return new Set([...Object.keys(view.nodeInteractions || {}), ...view.edgeInteractions.map((edge) => `${edge.from}->${edge.to}`)]);
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
  return view.edgeInteractions.map((edge, index) => {
    const fromLabel = interactions[edge.from]?.label || edge.from;
    const toLabel = interactions[edge.to]?.label || edge.to;
    return {
      kicker: "Arrow",
      label: `${fromLabel} → ${toLabel}`,
      tooltip: `${fromLabel} to ${toLabel}`,
      ...edge,
      edgeId: `${edge.from}-${edge.to}-${index}`,
      kind: "edge",
    };
  });
}
