// The details aside. A click on a shape or an arrow fills it.

const PANEL_MIN = 240;
const PANEL_GAP = 280;
let panelWidth = 340;

function safeHref(href) {
  try {
    const url = new URL(href);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    return "";
  }
  return "";
}

function appendInline(parent, tokens) {
  (tokens || []).forEach((token) => {
    if (token.type === "html" || token.type === "image") return;
    if (token.type === "escape" || (token.type === "text" && !token.tokens)) {
      parent.append(token.text);
      return;
    }
    if (token.type === "text") {
      appendInline(parent, token.tokens);
      return;
    }
    if (token.type === "codespan") {
      const code = document.createElement("code");
      code.textContent = token.text;
      parent.append(code);
      return;
    }
    if (token.type === "strong" || token.type === "em") {
      const el = document.createElement(token.type === "strong" ? "strong" : "em");
      appendInline(el, token.tokens);
      parent.append(el);
      return;
    }
    if (token.type === "br") {
      parent.append(document.createElement("br"));
      return;
    }
    if (token.type === "link") {
      const href = safeHref(token.href);
      if (!href) {
        appendInline(parent, token.tokens);
        return;
      }
      const link = document.createElement("a");
      link.href = href;
      link.rel = "noreferrer";
      link.target = "_blank";
      appendInline(link, token.tokens);
      parent.append(link);
      return;
    }
    if (token.type === "paragraph" || token.type === "list" || token.type === "code" || token.type === "heading" || token.type === "blockquote" || token.type === "space") {
      appendBlock(parent, token);
      return;
    }
    if (token.tokens) appendInline(parent, token.tokens);
    else if (typeof token.text === "string") parent.append(token.text);
  });
}

// A fence written as ~~~js source=show,openPanel shows those functions as the page loaded them, so a note cannot drift from the code.
function codeText(token) {
  const names = /^\w+ source=([\w,]+)$/.exec(token.lang || "");
  if (!names) return token.text;
  return names[1]
    .split(",")
    .map((name) => (typeof globalThis[name] === "function" ? globalThis[name].toString().replace(/\r/g, "") : `// ${name} is not loaded`))
    .join("\n\n");
}

function appendBlock(parent, token) {
  if (token.type === "space" || token.type === "html" || token.type === "def" || token.type === "image") return;
  if (token.type === "code") {
    const fence = fileFence(token.lang);
    if (fence) {
      parent.append(codeFileView(fence));
      return;
    }
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = codeText(token);
    pre.append(code);
    parent.append(pre);
    return;
  }
  if (token.type === "heading") {
    const heading = document.createElement(`h${Math.min(6, token.depth + 2)}`);
    appendInline(heading, token.tokens);
    parent.append(heading);
    return;
  }
  if (token.type === "paragraph") {
    const p = document.createElement("p");
    appendInline(p, token.tokens);
    parent.append(p);
    return;
  }
  if (token.type === "text") {
    if (token.tokens) appendInline(parent, token.tokens);
    else parent.append(token.text);
    return;
  }
  if (token.type === "list") {
    const list = document.createElement(token.ordered ? "ol" : "ul");
    token.items.forEach((item) => {
      const li = document.createElement("li");
      (item.tokens || []).forEach((child) => appendBlock(li, child));
      list.append(li);
    });
    parent.append(list);
    return;
  }
  if (token.type === "blockquote") {
    const quote = document.createElement("blockquote");
    (token.tokens || []).forEach((child) => appendBlock(quote, child));
    parent.append(quote);
  }
}

function renderNote(el, source) {
  el.replaceChildren();
  if (!source) return;
  marked.lexer(source).forEach((token) => appendBlock(el, token));
}

// An edge interaction links to its two ends. A node interaction links to every arrow that touches it.
function renderLinks(interaction) {
  const rows = [];
  if (interaction.kind === "edge") {
    const from = nodeInteraction(interaction.from);
    const to = nodeInteraction(interaction.to);
    if (from) rows.push({ term: "From", target: from, text: from.label });
    if (to) rows.push({ term: "To", target: to, text: to.label });
  } else {
    edgeInteractions().forEach((edge) => {
      const suffix = edge.label.includes("→") ? "" : ` (${edge.label})`;
      if (edge.from === interaction.chartId) {
        rows.push({ term: "Out", target: edge, text: `→ ${nodeInteraction(edge.to)?.label || "end"}${suffix}` });
      }
      if (edge.to === interaction.chartId) {
        rows.push({ term: "In", target: edge, text: `← ${nodeInteraction(edge.from)?.label || "start"}${suffix}` });
      }
    });
  }
  app.panel.links.replaceChildren();
  rows.forEach(({ term, target, text }) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => openPanel(target));
    dt.textContent = term;
    dd.append(button);
    app.panel.links.append(dt, dd);
  });
}

function showPanel() {
  app.els.panel.hidden = false;
  app.els.panel.setAttribute("aria-hidden", "false");
  app.els.workspace.classList.add("panel-open");
}

function hidePanel() {
  app.els.panel.hidden = true;
  app.els.panel.setAttribute("aria-hidden", "true");
  app.els.workspace.classList.remove("panel-open");
  app.panel.zoom.hidden = true;
}

// A part is a shape or an arrow. Two arrows between the same shapes count as one part.
function partKey(interaction) {
  return interaction.kind === "edge" ? `edge:${interaction.from}>${interaction.to}` : `node:${interaction.chartId}`;
}

// What a lesson step adds to the step before it, as part keys. Null outside a lesson step, and on the first step.
function addedInStep() {
  const step = lessonStep();
  if (!step || !step.index || step.lesson[step.index] !== app.view.viewId) return null;
  const before = app.views[step.lesson[step.index - 1]];
  const seen = new Set([
    ...Object.keys(before.nodeInteractions || {}).map((chartId) => `node:${chartId}`),
    ...(before.edgeInteractions || []).map((edge) => (Array.isArray(edge) ? `edge:${edge[0]}>${edge[1]}` : `edge:${edge.from}>${edge.to}`)),
  ]);
  return new Set([...nodeInteractions(), ...edgeInteractions()].map(partKey).filter((key) => !seen.has(key)));
}

// The shapes, then the arrows, in the order the content file lists them. Each opens its note, and hover lights it in the picture.
function renderParts() {
  const list = app.panel.parts.querySelector("ol");
  list.replaceChildren();
  const added = addedInStep();
  [...nodeInteractions(), ...edgeInteractions()].forEach((interaction) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const name = document.createElement("strong");
    name.textContent = interaction.label;
    const line = document.createElement("span");
    line.textContent = interaction.tooltip;
    button.append(name, line);
    if (added && added.has(partKey(interaction))) li.classList.add("is-new");
    button.addEventListener("click", () => openPanel(interaction));
    button.addEventListener("pointerenter", () => highlightAround(interaction));
    button.addEventListener("pointerleave", applySearch);
    li.append(button);
    list.append(li);
  });
  app.panel.parts.hidden = !list.children.length;
}

// With nothing selected, the panel tells the story of the whole diagram and lists its parts.
function openStory() {
  app.selectedInteraction = null;
  markSelected(null);
  app.els.storyOpen.setAttribute("aria-pressed", String(!app.storyHidden));
  if (app.storyHidden) {
    hidePanel();
    return;
  }
  const { panel, view } = app;
  const step = lessonStep();
  const onStep = step && step.lesson[step.index] === view.viewId;
  panel.kicker.textContent = onStep ? `Step ${step.index + 1} of ${step.lesson.length}` : "Diagram";
  panel.title.textContent = view.title;
  // The summary is already in the bar above the diagram.
  panel.lead.textContent = "";
  renderNote(panel.body, view.story || "");
  panel.facts.replaceChildren();
  panel.links.replaceChildren();
  renderParts();
  panel.zoom.hidden = true;
  panel.close.textContent = "Close";
  showPanel();
}

function openPanel(interaction) {
  app.selectedInteraction = interaction;
  app.els.storyOpen.setAttribute("aria-pressed", "false");
  const panel = app.panel;
  panel.kicker.textContent = interaction.kicker || "";
  panel.title.textContent = interaction.label;
  panel.lead.textContent = interaction.tooltip;
  renderNote(panel.body, interaction.body || "");
  panel.facts.replaceChildren();
  (interaction.facts || []).forEach(([term, detail]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = detail;
    panel.facts.append(dt, dd);
  });
  renderLinks(interaction);
  panel.parts.hidden = true;
  panel.zoom.hidden = !interaction.opensView;
  panel.close.textContent = app.storyHidden ? "Close" : "Back";
  showPanel();
  panel.close.focus();
  const selected = markSelected(interaction);
  requestAnimationFrame(() => reveal(selected));
}

// From a note, Close goes back to the story. From the story, it hides the panel until the Story button.
function closePanel() {
  if (!app.selectedInteraction) app.storyHidden = true;
  openStory();
}

// Shapes and arrows share this. `interaction` is the node or edge interaction.
// The panel opens at once. A double-click that drills in closes it again through show().
function onInteractionClick(event, interaction) {
  event.stopPropagation();
  hideTooltip();
  if (event.target.closest(".zoom-badge")) {
    if (interaction.opensView) show(interaction.opensView, interaction);
    return;
  }
  openPanel(interaction);
}

function onInteractionDblClick(event, interaction) {
  event.preventDefault();
  event.stopPropagation();
  window.getSelection()?.removeAllRanges();
  if (interaction.opensView) show(interaction.opensView, interaction);
  else openPanel(interaction);
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
      requestAnimationFrame(() => reveal(markSelected(app.selectedInteraction)));
    }
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  });

  app.panel.close.addEventListener("click", closePanel);
  app.panel.zoom.addEventListener("click", () => {
    if (app.selectedInteraction && app.selectedInteraction.opensView) {
      show(app.selectedInteraction.opensView, app.selectedInteraction);
    }
  });
}
