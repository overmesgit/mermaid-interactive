// The story and the picture read together. The block of the story at the reader's eye lights the parts it links,
// and a link to a numbered sequence message shows the number the picture draws by that message.

// Where the reader's eye is taken to be, as a share of the story pane's height: near the top before scrolling, near the bottom at the end.
// So the first paragraphs and the last ones each get their turn.
const READING_FROM = 0.2;
const READING_TO = 0.8;

// The pieces of a story a reader takes in one at a time: paragraphs, list items, tables, and cards.
function storyBlocks() {
  return [...app.panel.body.querySelectorAll(":scope > p, :scope > ul > li, :scope > ol > li, :scope > .table-wrap, :scope > blockquote")];
}

// The parts a block links to, from its links and its cards.
function blockParts(block) {
  const hrefs = [
    ...[...block.querySelectorAll("button.part-link")].map((button) => button.dataset.href),
    ...[...block.querySelectorAll("li[data-part]"), ...(block.matches("li[data-part]") ? [block] : [])].map((li) => `#${li.dataset.part}`),
  ];
  return hrefs.map(linkedPart).filter(Boolean);
}

// The block at the reader's eye. None while a note is open, because the note's part is what the reader looks at then,
// and none when the whole story fits, because the reader is not moving through it.
function readingBlock() {
  const pane = app.panel.pane;
  if (app.els.panel.hidden || app.selectedInteraction || app.shownViewId !== app.view?.viewId) return null;
  const room = pane.scrollHeight - pane.clientHeight;
  if (room <= 2) return null;
  const box = pane.getBoundingClientRect();
  const eye = box.top + box.height * (READING_FROM + (READING_TO - READING_FROM) * (pane.scrollTop / room));
  let current = null;
  for (const block of storyBlocks()) {
    if (block.getBoundingClientRect().top > eye) break;
    current = block;
  }
  return current;
}

// Lights what the block at the reader's eye links, and marks that block in the story. A block with no links lights nothing,
// so the whole picture shows while the story talks about it in general.
function followReading() {
  const block = readingBlock();
  const parts = block ? blockParts(block) : [];
  app.panel.body.querySelectorAll(".is-reading").forEach((el) => el.classList.remove("is-reading"));
  app.reading = parts.length ? parts : null;
  if (app.reading) block.classList.add("is-reading");
  clearHighlight();
}

function wireReading() {
  let queued = false;
  const follow = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      followReading();
    });
  };
  app.panel.pane.addEventListener("scroll", follow, { passive: true });
  window.addEventListener("resize", follow);
}

// A link or card for a numbered sequence message gets that number in a dot like the picture's, so "the redirect" in the text
// and message 2 in the picture are plainly the same thing. It runs once the picture is drawn, because the numbers come from it.
function numberLinks(root) {
  if (app.shownViewId !== app.view?.viewId) return;
  root.querySelectorAll("button.part-link, li[data-part] > .part-card").forEach((el) => {
    if (el.querySelector(".message-number")) return;
    const part = linkedPart(el.dataset.href || `#${el.parentElement.dataset.part}`);
    if (!part || part.kind !== "edge") return;
    const line = app.els.camera.querySelector(`[data-edge-id="${CSS.escape(part.edgeId)}"][data-number]`);
    if (!line) return;
    const dot = document.createElement("span");
    dot.className = "message-number";
    dot.textContent = line.dataset.number;
    (el.querySelector("strong") || el).prepend(dot);
  });
}
