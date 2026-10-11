// The details aside. A click on a node or an arrow fills it.

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

function appendBlock(parent, token) {
  if (token.type === "space" || token.type === "html" || token.type === "def" || token.type === "image") return;
  if (token.type === "code") {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = token.text;
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

// An arrow links to its two ends. A node links to every arrow that touches it.
function renderLinks(item) {
  const nodes = app.current.nodes;
  const rows = [];
  if (item.from) {
    if (nodes[item.from]) rows.push(["From", { ...nodes[item.from], id: item.from }, nodes[item.from].label]);
    if (nodes[item.to]) rows.push(["To", { ...nodes[item.to], id: item.to }, nodes[item.to].label]);
  } else {
    currentEdges().forEach((edge) => {
      const suffix = edge.label.includes("→") ? "" : ` (${edge.label})`;
      if (edge.from === item.id) rows.push(["Out", edge, `→ ${nodes[edge.to]?.label || "end"}${suffix}`]);
      if (edge.to === item.id) rows.push(["In", edge, `← ${nodes[edge.from]?.label || "start"}${suffix}`]);
    });
  }
  app.panel.links.replaceChildren();
  rows.forEach(([term, target, text]) => {
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

function openPanel(node) {
  app.selected = node;
  const panel = app.panel;
  panel.kicker.textContent = node.kicker || "";
  panel.title.textContent = node.label;
  panel.lead.textContent = node.tooltip;
  renderNote(panel.body, node.body || "");
  panel.facts.replaceChildren();
  (node.facts || []).forEach(([term, detail]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = detail;
    panel.facts.append(dt, dd);
  });
  renderLinks(node);
  panel.zoom.hidden = !node.zoom;
  app.els.panel.hidden = false;
  app.els.panel.setAttribute("aria-hidden", "false");
  app.els.workspace.classList.add("panel-open");
  panel.close.focus();
  const selected = markSelected(node);
  requestAnimationFrame(() => reveal(selected));
}

function closePanel() {
  app.selected = null;
  markSelected(null);
  app.els.panel.hidden = true;
  app.els.panel.setAttribute("aria-hidden", "true");
  app.els.workspace.classList.remove("panel-open");
  app.panel.zoom.hidden = true;
}

// Nodes and arrows share this. `node` is the note; an arrow note also has from and to.
// The panel opens at once. A double-click that drills in closes it again through show().
function onNodeClick(event, node) {
  event.stopPropagation();
  hideTooltip();
  if (event.target.closest(".zoom-badge")) {
    if (node.zoom) show(node.zoom, node);
    return;
  }
  openPanel(node);
}

function onNodeDblClick(event, node) {
  event.preventDefault();
  event.stopPropagation();
  window.getSelection()?.removeAllRanges();
  if (node.zoom) show(node.zoom, node);
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
      requestAnimationFrame(() => reveal(markSelected(app.selected)));
    }
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  });

  app.panel.close.addEventListener("click", closePanel);
  app.panel.zoom.addEventListener("click", () => {
    if (app.selected && app.selected.zoom) show(app.selected.zoom, app.selected);
  });
}
