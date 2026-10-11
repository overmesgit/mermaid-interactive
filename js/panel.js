// The details aside. A click on a node or an arrow fills it.

const PANEL_MIN = 240;
const PANEL_GAP = 280;
let panelWidth = 340;

function openPanel(node) {
  app.selected = node;
  const panel = app.panel;
  panel.kicker.textContent = node.kicker || "";
  panel.title.textContent = node.label;
  panel.lead.textContent = node.tooltip;
  panel.body.textContent = node.body || "";
  panel.code.hidden = !node.code;
  panel.code.textContent = node.code || "";
  panel.facts.replaceChildren();
  (node.facts || []).forEach(([term, detail]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = detail;
    panel.facts.append(dt, dd);
  });
  panel.zoom.hidden = !node.zoom;
  app.els.panel.hidden = false;
  app.els.panel.setAttribute("aria-hidden", "false");
  app.els.workspace.classList.add("panel-open");
  panel.close.focus();
  requestAnimationFrame(fit);
}

function closePanel() {
  app.selected = null;
  const wasOpen = app.els.workspace.classList.contains("panel-open");
  app.els.panel.hidden = true;
  app.els.panel.setAttribute("aria-hidden", "true");
  app.els.workspace.classList.remove("panel-open");
  app.panel.zoom.hidden = true;
  if (wasOpen) requestAnimationFrame(fit);
}

// Nodes and arrows share this. `node` is the note; an arrow note also has from and to.
// The wait lets a double-click cancel the panel. The + badge does not wait.
function onNodeClick(event, node) {
  event.stopPropagation();
  hideTooltip();
  if (event.target.closest(".zoom-badge")) {
    clearTimeout(app.clickTimer);
    if (node.zoom) show(node.zoom);
    return;
  }
  clearTimeout(app.clickTimer);
  app.clickTimer = setTimeout(() => openPanel(node), node.zoom ? 220 : 0);
}

function onNodeDblClick(event, node) {
  event.preventDefault();
  event.stopPropagation();
  clearTimeout(app.clickTimer);
  window.getSelection()?.removeAllRanges();
  if (node.zoom) show(node.zoom);
  else openPanel(node);
}

function setPanelWidth(width) {
  const bounds = app.els.workspace.getBoundingClientRect();
  const max = Math.max(PANEL_MIN, bounds.width - PANEL_GAP);
  panelWidth = Math.round(Math.min(max, Math.max(PANEL_MIN, width)));
  app.els.workspace.style.setProperty("--panel-width", `${panelWidth}px`);
}

function wirePanel() {
  const handle = app.els.panelResize;
  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    handle.setPointerCapture(event.pointerId);
    handle.classList.add("is-dragging");
    document.documentElement.classList.add("is-resizing");
    const startX = event.clientX;
    const startWidth = panelWidth;

    function move(ev) {
      setPanelWidth(startWidth + (startX - ev.clientX));
    }
    function end() {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      handle.classList.remove("is-dragging");
      document.documentElement.classList.remove("is-resizing");
      requestAnimationFrame(fit);
    }
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  });

  app.panel.close.addEventListener("click", closePanel);
  app.panel.zoom.addEventListener("click", () => {
    if (app.selected && app.selected.zoom) show(app.selected.zoom);
  });
}
