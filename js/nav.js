// show() is the only way to change the diagram.

function pathTo(view) {
  const path = [view];
  let guard = 0;
  while (path[0].parent && app.views[path[0].parent] && guard++ < 8) {
    path.unshift(app.views[path[0].parent]);
  }
  return path;
}

function renderChrome() {
  const { els, stack } = app;
  const root = stack[0];
  els.tabs.querySelectorAll("button").forEach((button) => {
    if (button.dataset.id === root.tab) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  els.crumbs.replaceChildren();
  stack.forEach((view, index) => {
    if (index) {
      const sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = "/";
      els.crumbs.appendChild(sep);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = view.title;
    const last = index === stack.length - 1;
    if (last) button.setAttribute("aria-current", "true");
    if (!last) button.addEventListener("click", () => show(view.viewId));
    els.crumbs.appendChild(button);
  });
  els.summary.textContent = app.view.summary;
  renderLesson();
  recordHistory();
}

// Every move the reader makes is a history entry, so Back undoes it: a step, a drill, a tab, and opening a part.
// The hash is the view path, then the open part: #tab/inner@api, or @web->api for an arrow.
function historyHash() {
  const part = app.selectedInteraction;
  const key = !part ? "" : part.kind === "edge" ? `@${part.from}->${part.to}` : `@${part.chartId}`;
  return "#" + app.stack.map((view) => view.viewId).join("/") + key;
}

function currentHash() {
  try {
    return decodeURIComponent(location.hash);
  } catch {
    return location.hash;
  }
}

// While the page follows the history, or on first load, it replaces the entry instead of adding one.
function recordHistory() {
  const next = historyHash();
  if (currentHash() === next) return;
  // The entry keeps how the note was opened, so Back reopens it the same way. The hash alone opens it as a peek.
  const how = app.noteHow;
  const state = how ? { note: { mode: how.mode, place: how.place } } : null;
  if (app.replaying || !location.hash) history.replaceState(state, "", next);
  else history.pushState(state, "", next);
}

// `fromInteraction` is the shape or arrow that was drilled through. The old picture zooms toward it before the swap.
async function show(viewId, fromInteraction) {
  const view = app.views[viewId];
  if (!view) return;
  // Only a view that finished drawing owns app.cam. During a swap the camera holds the leave zoom, so it is not saved.
  const shown = app.shownViewId;
  if (shown) app.cams[shown] = { ...app.cam };
  app.shownViewId = null;
  const origin = wiredElements(fromInteraction);
  app.view = view;
  app.stack = pathTo(view);
  closeNote();
  openStory();
  hideTooltip();
  renderChrome();
  // A slower mermaid.render must not overwrite a diagram the reader has already left.
  const token = ++app.renderToken;
  try {
    const leaving = shown ? leaveView(origin) : Promise.resolve();
    const [{ svg }] = await Promise.all([mermaid.render(`diagram-${token}`, view.chart), leaving]);
    if (token !== app.renderToken) return;
    app.els.camera.innerHTML = svg;
    const svgEl = app.els.camera.querySelector("svg");
    svgEl.style.maxWidth = "none";
    const box = svgEl.viewBox.baseVal;
    if (box && box.width) {
      svgEl.setAttribute("width", String(box.width));
      svgEl.setAttribute("height", String(box.height));
    }
    enterView(app.cams[viewId]);
    app.shownViewId = viewId;
    reportDrawn(viewId, [...bindNodeInteractions(svgEl), ...bindEdgeInteractions(svgEl)]);
    relaxLabels(svgEl);
    markStatuses();
    markStepFlow();
    applySearch();
  } catch (error) {
    if (token !== app.renderToken) return;
    app.els.camera.classList.remove("is-leaving");
    app.els.camera.textContent = "Could not draw this diagram. " + (error.message || error);
  }
}

// On load, and on Back and Forward. The view is drawn again only when it changed, so going back from a note to its story does not redraw.
async function openFromHash() {
  const [path, partId] = currentHash().replace(/^#/, "").split("@");
  const ids = path.split("/").filter(Boolean);
  const last = ids[ids.length - 1];
  const viewId = app.views[last] ? last : DIAGRAMS.tabs[0].id;
  app.replaying = true;
  try {
    if (!app.view || app.view.viewId !== viewId) await show(viewId);
    const part = partId ? linkedPart("#" + partId) : null;
    if (part) openPanel(part, history.state?.note);
    else if (app.selectedInteraction) closeNote();
  } finally {
    app.replaying = false;
  }
}

// Escape and Backspace go one level up. Returns false at a tab's root.
function showParent() {
  if (app.stack.length < 2) return false;
  show(app.stack[app.stack.length - 2].viewId);
  return true;
}

// The lesson is the ordered view ids on a tab. A drill keeps the step it was opened from.
function lessonStep() {
  if (!app.view) return null;
  const tab = DIAGRAMS.tabs.find((item) => item.id === app.view.tab);
  if (!tab || !tab.lesson) return null;
  const step = [...app.stack].reverse().find((view) => tab.lesson.includes(view.viewId));
  return step ? { lesson: tab.lesson, index: tab.lesson.indexOf(step.viewId) } : null;
}

function renderLesson() {
  const { els } = app;
  const step = lessonStep();
  if (!step) {
    els.lesson.hidden = true;
    return;
  }
  els.lesson.hidden = false;
  els.lessonCount.textContent = (step.index + 1) + " / " + step.lesson.length;
  els.lessonPrev.disabled = step.index === 0;
  const nextView = app.views[step.lesson[step.index + 1]];
  els.lessonNext.disabled = !nextView;
  els.lessonNext.textContent = nextView ? "Next: " + nextView.title : "Next";
}

function showLesson(delta) {
  const step = lessonStep();
  if (!step) return false;
  const viewId = step.lesson[step.index + delta];
  if (!viewId) return false;
  show(viewId);
  return true;
}

function wireTabs() {
  // An exported file already holds the buttons drawn when it was saved, without their listeners.
  app.els.tabs.replaceChildren();
  DIAGRAMS.tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tab.label;
    button.dataset.id = tab.id;
    button.addEventListener("click", () => show(tab.id));
    app.els.tabs.appendChild(button);
  });
}
