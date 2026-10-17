// The details aside. A click on a shape or an arrow fills it.

const PANEL_MIN = 240;
const PANEL_GAP = 280;
let panelWidth = 340;

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

// marked renders a note's markdown. What needs a live element, a part or a code file, is left as an empty placeholder that renderNote fills in.
// HTML written in a note shows as text, images are dropped, and only http and https links leave the page.
const noteMarked = new marked.Marked({
  renderer: {
    html: ({ text }) => escapeHtml(text),
    image: () => "",
    heading({ tokens, depth }) {
      const tag = `h${Math.min(6, depth + 2)}`;
      return `<${tag}>${this.parser.parseInline(tokens)}</${tag}>\n`;
    },
    code({ lang }) {
      return fileFence(lang) ? `<figure data-fence="${escapeHtml(lang)}"></figure>\n` : false;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      // [GET /posts/new](~route) colors the words as that type, the same color as its shapes.
      if (href.startsWith("~")) {
        const index = typeIndex(href.slice(1));
        return index >= 0 ? `<span class="type-text type-${index}">${text}</span>` : text;
      }
      if (href.startsWith("#")) {
        const part = linkedPart(href);
        if (!part) return text;
        // A link to a part with a type has that type's color, like the part in the picture.
        const type = typeIndex(part.type) >= 0 ? ` type-text type-${typeIndex(part.type)}` : "";
        return `<button type="button" class="part-link${type}" data-href="${escapeHtml(href)}" data-title="${escapeHtml(title || "")}">${text}</button>`;
      }
      return /^https?:\/\//i.test(href) ? `<a href="${escapeHtml(href)}" rel="noreferrer" target="_blank">${text}</a>` : text;
    },
    // A paragraph that is only links to parts becomes their cards, so the text can walk the reader through the picture.
    paragraph(token) {
      const links = cardLinks(token);
      if (!links) return false;
      const items = links.map((link) => `<li data-href="${escapeHtml(link.href)}" data-title="${escapeHtml(link.title || "")}"></li>`);
      return `<ol class="parts">${items.join("")}</ol>\n`;
    },
    // A table lines up values that are compared, so the difference stands out. With an empty header row, it has no header.
    table(token) {
      let html = marked.Renderer.prototype.table.call(this, token);
      if (!token.header.some((cell) => cell.text.trim())) html = html.replace(/<thead>[\s\S]*?<\/thead>\n?/, "");
      return `<div class="table-wrap">${html}</div>\n`;
    },
  },
});

// The links of a paragraph that is only links to parts, or null. Links on lines next to each other are one paragraph in markdown, so each still gets its own card.
function cardLinks(paragraph) {
  const tokens = (paragraph.tokens || []).filter((token) => !((token.type === "text" && !token.text.trim()) || token.type === "br"));
  return tokens.length && tokens.every((token) => token.type === "link" && linkedPart(token.href)) ? tokens : null;
}

function renderNote(el, source) {
  el.innerHTML = source ? noteMarked.parse(source) : "";
  // Cards in paragraphs next to each other share one list, so they sit as close as they do in the parts list.
  el.querySelectorAll("ol.parts").forEach((list) => {
    const before = list.previousElementSibling;
    if (before && before.matches("ol.parts")) {
      before.append(...list.children);
      list.remove();
    }
  });
  el.querySelectorAll("li[data-href]").forEach((li) => li.replaceWith(partItem(linkedPart(li.dataset.href), noteHow(li.dataset.title))));
  el.querySelectorAll("button.part-link").forEach((button) => wirePart(button, linkedPart(button.dataset.href), noteHow(button.dataset.title)));
  el.querySelectorAll("figure[data-fence]").forEach((figure) => figure.replaceWith(codeFileView(fileFence(figure.dataset.fence))));
  // The panel's table style sets text-align, which beats the align attribute marked writes.
  el.querySelectorAll("[align]").forEach((cell) => {
    cell.style.textAlign = cell.getAttribute("align");
    cell.removeAttribute("align");
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
  app.els.workspace.classList.toggle("panel-open", story);
  app.els.storyOpen.setAttribute("aria-pressed", String(story));
  if (!how) return;
  if (inline) requestAnimationFrame(scrollInlineNote);
  else openPeek(how.place);
}

// Close on the story, and the Story button, hide or show it. An open note stays either way.
function setStoryHidden(hidden) {
  app.storyHidden = hidden;
  layoutPanel();
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

// A link's title says how its note opens: "inline", "peek", or "peek below". With no title the place the link sits decides.
function noteHow(title) {
  const words = String(title || "").trim().toLowerCase().split(/\s+/);
  const mode = NOTE_MODES.includes(words[0]) ? words[0] : null;
  const place = mode === "peek" && PEEK_PLACES.includes(words[1]) ? words[1] : null;
  return { mode, place };
}

// The part's card in the story, or in the list under it. A link elsewhere titled "inline" opens the note there.
function cardFor(interaction) {
  const key = partKey(interaction);
  return [...app.panel.pane.querySelectorAll("li[data-part]")].find((li) => li.dataset.part === key && !li.closest("#note-pane")) || null;
}

// A link in the story opens inline under itself. A link in a note, and a click on the picture, open a peek.
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
    if (li.dataset.part === key) li.setAttribute("aria-current", "true");
    else li.removeAttribute("aria-current");
  });
}

// What a lesson step adds to the step before it, as part keys. Null outside a lesson step, and on the first step.
function addedInStep() {
  const step = lessonStep();
  if (!step || !step.index || step.lesson[step.index] !== app.view.viewId) return null;
  const seen = partKeysOf(app.views[step.lesson[step.index - 1]]);
  const keys = [...partKeysOf(app.view)];
  // A step with a new picture shares nothing with the step before. Marking all of it New would say nothing.
  if (!keys.some((key) => seen.has(key))) return null;
  return new Set(keys.filter((key) => !seen.has(key)));
}

// The status the content gives a part, or New when this lesson step adds it. `added` is addedInStep(), passed in when many parts ask at once.
// A part with a type keeps its type's color, because the author chose it, and New is only the page's guess.
function partStatus(interaction, added = addedInStep()) {
  if (STATUSES[interaction.status]) return interaction.status;
  if (typeIndex(interaction.type) >= 0) return null;
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
  return [...nodeInteractions(), ...edgeInteractions()].find((part) => partKey(part) === key) || null;
}

// Every way to a part opens its note on click and lights it in the picture on hover.
// A second click on the link or card whose note is open closes it, so the story can be read alone again.
function wirePart(button, interaction, how) {
  button.addEventListener("click", () => {
    const open = app.selectedInteraction && partKey(app.selectedInteraction) === partKey(interaction);
    if (open && app.noteHow?.anchor && app.noteHow.anchor === anchorOf(button)) closeNote();
    else openPanel(interaction, { ...how, from: button });
  });
  button.addEventListener("pointerenter", () => highlightAround(interaction));
  button.addEventListener("pointerleave", clearHighlight);
}

// The part's name, its status, and its tooltip. A part with more to read has the same dot as in the picture.
function partItem(interaction, how = {}) {
  const li = document.createElement("li");
  li.dataset.part = partKey(interaction);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "part-card";
  wirePart(button, interaction, how);
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
  // The lead says how to read a story, so a view with only a parts list has none.
  panel.lead.hidden = !view.story;
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
  note.zoom.hidden = !interaction.opensView;
  layoutPanel();
  note.pane.scrollTop = 0;
  markOpenCard();
  note.pane.focus({ preventScroll: true });
  const selected = markSelected(interaction);
  markStepFlow();
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

// Shapes and arrows share this. `interaction` is the node or edge interaction.
// The panel opens at once. A double-click that drills in closes it again through show().
function onInteractionClick(event, interaction) {
  event.stopPropagation();
  hideTooltip();
  openPanel(interaction);
}

// A double-click opens the inner diagram, if the part has one. The click before it already opened the note.
function onInteractionDblClick(event, interaction) {
  event.preventDefault();
  event.stopPropagation();
  window.getSelection()?.removeAllRanges();
  if (interaction.opensView) show(interaction.opensView, interaction);
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

  app.panel.close.addEventListener("click", () => setStoryHidden(true));
  app.note.close.addEventListener("click", closeNote);
  app.note.zoom.addEventListener("click", () => {
    if (app.selectedInteraction && app.selectedInteraction.opensView) {
      show(app.selectedInteraction.opensView, app.selectedInteraction);
    }
  });
}
