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
      // [GET /posts/new](~route) colors the words as that type, the same color as its shapes.
      if (token.href.startsWith("~")) {
        const span = document.createElement("span");
        const index = typeIndex(token.href.slice(1));
        if (index >= 0) span.className = `type-text type-${index}`;
        appendInline(span, token.tokens);
        parent.append(span);
        return;
      }
      const part = linkedPart(token.href);
      if (part) {
        const button = partButton(part, "part-link", noteHow(token.title));
        // A link to a part with a type has that type's color, like the part in the picture.
        if (typeIndex(part.type) >= 0) button.classList.add("type-text", `type-${typeIndex(part.type)}`);
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
    if (["paragraph", "list", "code", "heading", "blockquote", "space", "table"].includes(token.type)) {
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
      parts.forEach(({ part, how }) => appendPartCard(parent, part, how));
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
  // A table lines up values that are compared, so the difference stands out. With an empty header row, it has no header.
  if (token.type === "table") {
    const row = (cells, tag) => {
      const tr = document.createElement("tr");
      cells.forEach((cell, index) => {
        const td = document.createElement(tag);
        if (token.align[index]) td.style.textAlign = token.align[index];
        appendInline(td, cell.tokens);
        tr.append(td);
      });
      return tr;
    };
    const table = document.createElement("table");
    if (token.header.some((cell) => cell.text.trim())) {
      const head = document.createElement("thead");
      head.append(row(token.header, "th"));
      table.append(head);
    }
    const body = document.createElement("tbody");
    token.rows.forEach((cells) => body.append(row(cells, "td")));
    table.append(body);
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    wrap.append(table);
    parent.append(wrap);
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
  app.note.links.replaceChildren();
  rows.forEach(({ term, target, text }) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => openPanel(target));
    dt.textContent = term;
    dd.append(button);
    app.note.links.append(dt, dd);
  });
}

// The panel shows the story unless the reader hid it. A note opened inline sits in the story, so it shows the story too.
// A peek note sits on the canvas, so with the story hidden the panel hides.
function layoutPanel() {
  const how = app.noteHow;
  const inline = how?.mode === "inline";
  const story = !app.storyHidden || inline;
  placeNote(how);
  app.panel.pane.hidden = !story;
  app.els.panel.hidden = !story;
  app.els.panel.setAttribute("aria-hidden", String(!story));
  app.els.workspace.classList.toggle("panel-open", story);
  app.els.storyOpen.setAttribute("aria-pressed", String(story));
  if (!how) return;
  if (inline) requestAnimationFrame(scrollInlineNote);
  else openPeek(how.place);
}

// Inline puts the note right under what was clicked: in a card's list item, or after the paragraph with the link.
// Peek puts it on the canvas. A closed note goes back to the panel, where it waits hidden.
function placeNote(how) {
  const pane = app.note.pane;
  pane.hidden = !how;
  pane.dataset.mode = how ? how.mode : "";
  pane.classList.toggle("under-card", Boolean(how?.anchor?.matches("li[data-part]")));
  pane.style.left = pane.style.top = pane.style.maxHeight = "";
  hidePeekCaret();
  if (!how) {
    if (pane.parentElement !== app.els.panel) app.els.panel.append(pane);
  } else if (how.mode === "inline") {
    if (how.anchor.matches("li")) how.anchor.append(pane);
    else how.anchor.after(pane);
  } else app.els.stage.append(pane);
}

// The block a story link belongs to: its card, or the paragraph or list item it sits in.
function anchorOf(button) {
  return button.closest("li[data-part]") || button.closest("p, li, blockquote, h3, h4, h5, h6");
}

// The part's card in the story, or in the list under it. Back and Forward reopen an inline note there.
function cardFor(interaction) {
  const key = partKey(interaction);
  return [...app.panel.pane.querySelectorAll("li[data-part]")].find((li) => li.dataset.part === key && !li.closest("#note-pane")) || null;
}

// A link's title says how its note opens: "inline", "peek", or "peek below". With no title the place the link sits decides.
function noteHow(title) {
  const words = String(title || "").trim().toLowerCase().split(/\s+/);
  const mode = NOTE_MODES.includes(words[0]) ? words[0] : null;
  const place = mode === "peek" && PEEK_PLACES.includes(words[1]) ? words[1] : null;
  return { mode, place };
}

// A link in the story opens inline under itself. A link in a note, a click on the picture, and a part reopened from history with no card open as a peek.
function resolveHow(interaction, how = {}) {
  const from = how.from;
  const inStory = from && from.closest("#story-pane") && !from.closest("#note-pane");
  let mode = how.mode || (inStory ? "inline" : "peek");
  let anchor = null;
  if (mode === "inline") anchor = inStory ? anchorOf(from) : cardFor(interaction);
  if (!anchor) mode = "peek";
  return { mode, place: how.place || null, anchor };
}

// The open card and its note come into view together, card at the top when both do not fit.
function scrollInlineNote() {
  const pane = app.note.pane;
  if (pane.dataset.mode !== "inline") return;
  const scroller = app.panel.pane;
  const block = app.noteHow?.anchor || pane;
  const view = scroller.getBoundingClientRect();
  const top = block.getBoundingClientRect().top;
  const bottom = pane.getBoundingClientRect().bottom;
  if (top >= view.top && bottom <= view.bottom) return;
  const room = view.bottom - view.top;
  const delta = bottom - top <= room ? (top < view.top ? top - view.top - 8 : bottom - view.bottom + 8) : top - view.top - 8;
  scroller.scrollBy({ top: delta, behavior: "smooth" });
}

// The story's card for the open part is marked, so the reader sees where the note belongs in the story.
function markOpenCard() {
  const key = app.selectedInteraction ? partKey(app.selectedInteraction) : null;
  app.panel.pane.querySelectorAll("li[data-part]").forEach((li) => {
    const open = li.dataset.part === key;
    li.classList.toggle("is-open", open);
    if (open) li.setAttribute("aria-current", "true");
    else li.removeAttribute("aria-current");
  });
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
  return parts.length && parts.every(Boolean) ? parts.map((part, i) => ({ part, how: noteHow(tokens[i].title) })) : null;
}

// Every way to a part opens its note on click and lights it in the picture on hover.
// A second click on the link or card whose note is open closes it, so the story can be read alone again.
function partButton(interaction, className, how = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.addEventListener("click", () => {
    const open = app.selectedInteraction && partKey(app.selectedInteraction) === partKey(interaction);
    if (open && app.noteHow?.anchor && app.noteHow.anchor === anchorOf(button)) {
      closeNote();
      recordHistory();
    } else openPanel(interaction, { ...how, from: button });
  });
  button.addEventListener("pointerenter", () => highlightAround(interaction));
  button.addEventListener("pointerleave", applySearch);
  return button;
}

// The part's name, its status, and its tooltip. A part with more to read has the same dot as in the picture.
function partItem(interaction, how) {
  const li = document.createElement("li");
  li.dataset.part = partKey(interaction);
  const button = partButton(interaction, "part-card", how);
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
function appendPartCard(parent, interaction, how) {
  let list = parent.lastElementChild;
  if (!list || !list.matches("ol.parts")) {
    list = document.createElement("ol");
    list.className = "parts";
    parent.append(list);
  }
  list.append(partItem(interaction, how));
}

// A view with no story lists its shapes, then its arrows, in the order the content file lists them.
// A story points at its parts where it talks about them instead, so it has no list. The checks name parts with detail that it leaves out.
function renderParts() {
  const list = app.panel.parts.querySelector("ol");
  list.replaceChildren();
  // An arrow with nothing more than its tooltip says it in its label on the picture, so the list leaves it out.
  const listed = app.view.story ? [] : [...nodeInteractions(), ...edgeInteractions().filter((edge) => hasMore(edge) || edge.status)];
  listed.forEach((interaction) => list.append(partItem(interaction)));
  app.panel.parts.hidden = !list.children.length;
}

// The story of the whole diagram, and a list of its parts. It is drawn once per view, so opening a note keeps its place.
function openStory() {
  const { panel, view } = app;
  // Drawing the story again would take an inline note with it.
  if (app.note.pane.parentElement !== app.els.panel) app.els.panel.append(app.note.pane);
  const step = lessonStep();
  const onStep = step && step.lesson[step.index] === view.viewId;
  panel.kicker.textContent = onStep ? `Step ${step.index + 1} of ${step.lesson.length}` : "Diagram";
  panel.title.textContent = view.title;
  // The summary is already in the bar above the diagram. The lead says how to read the story instead.
  panel.lead.textContent = view.story ? "Read top to bottom. Click a part only when you want more detail." : "";
  panel.lead.classList.add("is-hint");
  renderNote(panel.body, view.story || "");
  panel.pane.scrollTop = 0;
  renderParts();
  markOpenCard();
  layoutPanel();
}

// The note opens inline under what was clicked in the story, or as a peek card by its shape. Either way the story keeps its place.
// `how` is { mode, place, from }: from a link's title, and the button that was clicked.
function openPanel(interaction, how) {
  app.selectedInteraction = interaction;
  app.noteHow = resolveHow(interaction, how);
  const note = app.note;
  note.title.textContent = interaction.label;
  const status = partStatus(interaction);
  if (status) note.title.append(statusChip(status));
  note.kicker.textContent = interaction.kicker || "";
  note.lead.textContent = interaction.tooltip;
  renderNote(note.body, interaction.body || "");
  note.facts.replaceChildren();
  (interaction.facts || []).forEach(([term, detail]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = detail;
    note.facts.append(dt, dd);
  });
  renderLinks(interaction);
  note.zoom.hidden = !interaction.opensView;
  layoutPanel();
  note.pane.scrollTop = 0;
  markOpenCard();
  note.pane.focus({ preventScroll: true });
  const selected = markSelected(interaction);
  markStepFlow();
  recordHistory();
  requestAnimationFrame(() => reveal(selected));
}

// Closes the note and clears the selection. The story stays as it was.
function closeNote() {
  app.selectedInteraction = null;
  app.noteHow = null;
  markSelected(null);
  markStepFlow();
  markOpenCard();
  layoutPanel();
}

// Close on the story hides it until the Story button. A peek note stays on the canvas.
function closeStory() {
  app.storyHidden = true;
  layoutPanel();
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

  app.panel.close.addEventListener("click", closeStory);
  app.note.close.addEventListener("click", () => {
    closeNote();
    recordHistory();
  });
  // The icon by the title lights the part in the picture on hover, and brings it into view on click.
  const locate = app.note.locate;
  locate.addEventListener("pointerenter", () => {
    if (app.selectedInteraction) highlightAround(app.selectedInteraction);
  });
  locate.addEventListener("pointerleave", applySearch);
  locate.addEventListener("click", () => {
    if (app.selectedInteraction) reveal(markSelected(app.selectedInteraction));
  });
  app.note.zoom.addEventListener("click", () => {
    if (app.selectedInteraction && app.selectedInteraction.opensView) {
      show(app.selectedInteraction.opensView, app.selectedInteraction);
    }
  });
}
