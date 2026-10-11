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
  const next = "#" + stack.map((view) => view.viewId).join("/");
  if (location.hash !== next) history.replaceState(null, "", next);
}

// `fromInteraction` is the shape or arrow that was drilled through. The old picture zooms toward it before the swap.
async function show(viewId, fromInteraction) {
  const view = app.views[viewId];
  if (!view) return;
  if (app.view) app.cams[app.view.viewId] = { ...app.cam };
  const origin = wiredElements(fromInteraction);
  app.view = view;
  app.stack = pathTo(view);
  closePanel();
  hideTooltip();
  renderChrome();
  // A slower mermaid.render must not overwrite a diagram the reader has already left.
  const token = ++app.renderToken;
  try {
    const [{ svg }] = await Promise.all([mermaid.render(`diagram-${token}`, view.chart), leaveView(origin)]);
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
    bindNodeInteractions(svgEl);
    bindEdgeInteractions(svgEl);
    relaxLabels(svgEl);
    applySearch();
  } catch (error) {
    if (token !== app.renderToken) return;
    app.els.camera.classList.remove("is-leaving");
    app.els.camera.textContent = "Could not draw this diagram. " + (error.message || error);
  }
}

function openFromHash() {
  const ids = location.hash.replace(/^#/, "").split("/").filter(Boolean);
  const viewId = ids.length ? ids[ids.length - 1] : DIAGRAMS.tabs[0].id;
  if (!app.views[viewId]) {
    show(DIAGRAMS.tabs[0].id);
    return;
  }
  show(viewId);
}

// The lesson is the ordered view ids on a tab. A drill keeps the step it was opened from.
function lessonStep() {
  let view = app.view;
  if (!view) return null;
  const tab = DIAGRAMS.tabs.find((item) => item.id === view.tab);
  if (!tab || !tab.lesson) return null;
  let guard = 0;
  while (view && guard++ < 8) {
    const index = tab.lesson.indexOf(view.viewId);
    if (index >= 0) return { lesson: tab.lesson, index };
    view = view.parent && app.views[view.parent];
  }
  return null;
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
  DIAGRAMS.tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tab.label;
    button.dataset.id = tab.id;
    button.addEventListener("click", () => show(tab.id));
    app.els.tabs.appendChild(button);
  });
}
