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
      const part = linkedPart(token.href);
      if (part) {
        const button = partButton(part, "part-link");
        appendInline(button, token.tokens);
        parent.append(button);
        return;
      }
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
    const parts = cardParts(token);
    if (parts) {
      parts.forEach((part) => appendPartCard(parent, part));
      return;
    }
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
  const keys = [...nodeInteractions(), ...edgeInteractions()].map(partKey);
  // A step with a new picture shares nothing with the step before. Marking all of it New would say nothing.
  if (!keys.some((key) => seen.has(key))) return null;
  return new Set(keys.filter((key) => !seen.has(key)));
}

// The status the content gives a part, or New when this lesson step adds it.
function partStatus(interaction) {
  if (STATUSES[interaction.status]) return interaction.status;
  const added = addedInStep();
  return added && added.has(partKey(interaction)) ? "new" : null;
}

// A story or note points at a part of this diagram with a markdown link: [API](#api) for a shape, [](#web->api) for an arrow.
// Two arrows between the same shapes are one part, so the link opens the first. A link to no part is plain text, and the checks list it.
function linkedPart(href) {
  if (!href || !href.startsWith("#")) return null;
  let key;
  try {
    key = decodeURIComponent(href.slice(1));
  } catch {
    return null;
  }
  const [from, to] = key.split("->");
  if (to === undefined) return nodeInteraction(key) || null;
  return edgeInteractions().find((edge) => edge.from === from && edge.to === to) || null;
}

// A paragraph that is only links to parts becomes their cards, so the text can walk the reader through the picture.
// Links on lines next to each other are one paragraph in markdown, so each still gets its own card.
function cardParts(paragraph) {
  const tokens = (paragraph.tokens || []).filter((token) => !((token.type === "text" && !token.text.trim()) || token.type === "br"));
  const parts = tokens.map((token) => (token.type === "link" ? linkedPart(token.href) : null));
  return parts.length && parts.every(Boolean) ? parts : null;
}

// Every way to a part opens its note on click and lights it in the picture on hover.
function partButton(interaction, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.addEventListener("click", () => openPanel(interaction));
  button.addEventListener("pointerenter", () => highlightAround(interaction));
  button.addEventListener("pointerleave", applySearch);
  return button;
}

// The part's name, its status, and its tooltip. A part with more to read has the same dot as in the picture.
function partItem(interaction) {
  const li = document.createElement("li");
  li.dataset.part = partKey(interaction);
  const button = partButton(interaction, "part-card");
  if (hasMore(interaction)) button.classList.add("has-more");
  const name = document.createElement("strong");
  name.textContent = interaction.label;
  const status = partStatus(interaction);
  if (status) name.append(statusChip(status));
  const line = document.createElement("span");
  line.textContent = interaction.tooltip;
  button.append(name, line);
  li.append(button);
  return li;
}

// Cards on lines next to each other share one list, so they sit as close as they do in the parts list.
function appendPartCard(parent, interaction) {
  let list = parent.lastElementChild;
  if (!list || !list.matches("ol.parts")) {
    list = document.createElement("ol");
    list.className = "parts";
    parent.append(list);
  }
  list.append(partItem(interaction));
}

// The shapes, then the arrows, in the order the content file lists them. A part the story already showed as a card is not listed again.
function renderParts() {
  const list = app.panel.parts.querySelector("ol");
  const inStory = new Set([...app.panel.body.querySelectorAll("ol.parts li")].map((li) => li.dataset.part));
  list.replaceChildren();
  // An arrow with nothing more than its tooltip says it in its label on the picture, so the list leaves it out.
  const listed = [...nodeInteractions(), ...edgeInteractions().filter((edge) => hasMore(edge) || edge.status)];
  listed.forEach((interaction) => {
    if (!inStory.has(partKey(interaction))) list.append(partItem(interaction));
  });
  app.panel.parts.querySelector("h3").textContent = inStory.size ? "Other parts, to open for detail" : "Parts, to open for detail";
  app.panel.parts.hidden = !list.children.length;
}

// With nothing selected, the panel tells the story of the whole diagram and lists its parts.
function openStory() {
  app.selectedInteraction = null;
  markSelected(null);
  markStepFlow();
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
  panel.selected.hidden = true;
  // The summary is already in the bar above the diagram. The lead says how to read the story instead.
  panel.lead.textContent = view.story ? "Read top to bottom. Click a part only when you want more detail." : "";
  panel.lead.classList.add("is-hint");
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
  const status = partStatus(interaction);
  if (status) panel.kicker.prepend(statusChip(status));
  panel.selected.hidden = false;
  panel.title.textContent = interaction.label;
  panel.lead.textContent = interaction.tooltip;
  panel.lead.classList.remove("is-hint");
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
  markStepFlow();
  recordHistory();
  requestAnimationFrame(() => reveal(selected));
}

// From a note, Close goes back to the story. From the story, it hides the panel until the Story button.
function closePanel() {
  if (!app.selectedInteraction) app.storyHidden = true;
  openStory();
  recordHistory();
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
