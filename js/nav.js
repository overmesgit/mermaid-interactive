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
  const { els, stack, current } = app;
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
    if (!last) button.addEventListener("click", () => show(view.id));
    els.crumbs.appendChild(button);
  });
  els.summary.textContent = current.summary;
  const next = "#" + stack.map((view) => view.id).join("/");
  if (location.hash !== next) history.replaceState(null, "", next);
}

async function show(id) {
  const view = app.views[id];
  if (!view) return;
  app.current = view;
  app.stack = pathTo(view);
  closePanel();
  hideTooltip();
  renderChrome();
  // A slower mermaid.render must not overwrite a diagram the reader has already left.
  const token = ++app.renderToken;
  app.els.camera.innerHTML = "";
  try {
    const { svg } = await mermaid.render(`diagram-${token}`, view.chart);
    if (token !== app.renderToken) return;
    app.els.camera.innerHTML = svg;
    const svgEl = app.els.camera.querySelector("svg");
    svgEl.style.maxWidth = "none";
    const box = svgEl.viewBox.baseVal;
    if (box && box.width) {
      svgEl.setAttribute("width", String(box.width));
      svgEl.setAttribute("height", String(box.height));
    }
    bindNodes(svgEl);
    bindEdges(svgEl);
    relaxLabels(svgEl);
    applySearch();
    requestAnimationFrame(fit);
  } catch (error) {
    if (token !== app.renderToken) return;
    app.els.camera.textContent = "Could not draw this diagram. " + (error.message || error);
  }
}

function openFromHash() {
  const ids = location.hash.replace(/^#/, "").split("/").filter(Boolean);
  const id = ids.length ? ids[ids.length - 1] : DIAGRAMS.tabs[0].id;
  if (!app.views[id]) {
    show(DIAGRAMS.tabs[0].id);
    return;
  }
  show(id);
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
