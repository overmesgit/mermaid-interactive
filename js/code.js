// Code files a note names with ~~~go file=api/session.go lines=40-58. The panel shows those lines, and the header opens the whole file.
// Packing adds each whole file to the content file as gzip and base64, with packFile() from js/helpers.js.

const codeFiles = new Map();

// The fence's info string, such as "go file=api/session.go lines=40-58 mark=44-47". `first` and `last` are null without lines=.
// `mark` lists the [first, last] ranges to highlight inside the shown lines, so a long range still says where to look.
function fileFence(info) {
  const path = /(?:^|\s)file=(\S+)/.exec(info || "");
  if (!path) return null;
  const lines = /(?:^|\s)lines=(\d+)(?:-(\d+))?(?:\s|$)/.exec(info);
  const mark = /(?:^|\s)mark=([\d,-]+)(?:\s|$)/.exec(info);
  return {
    path: path[1],
    first: lines ? Number(lines[1]) : null,
    last: lines ? Number(lines[2] || lines[1]) : null,
    mark: mark
      ? mark[1].split(",").filter(Boolean).map((part) => {
          const [from, to] = part.split("-").map(Number);
          return [from, to || from];
        })
      : [],
  };
}

function isMarked(fence, number) {
  return fence.mark.some(([from, to]) => number >= from && number <= to);
}

// Every file= fence in every note and story, with where it was written, for the checks and for Export.
function fileFences() {
  const found = [];
  const scan = (viewId, where, text) => {
    for (const [, info] of String(text || "").matchAll(/^[ \t]*~~~([^\n]*)$/gm)) {
      const fence = fileFence(info);
      if (fence) found.push({ viewId, where, ...fence });
    }
  };
  Object.entries(DIAGRAMS.views || {}).forEach(([viewId, view]) => {
    scan(viewId, `${viewId}: the story`, view.story);
    Object.entries(view.nodeInteractions || {}).forEach(([chartId, note]) => scan(viewId, `${viewId}: the note on ${chartId}`, note.body));
    (view.edgeInteractions || []).forEach((edge) => {
      if (!Array.isArray(edge)) scan(viewId, `${viewId}: the note on the arrow ${edge.from} → ${edge.to}`, edge.body);
    });
  });
  return found;
}

function splitLines(text) {
  const rows = text.split(/\r?\n/);
  if (rows.length > 1 && rows[rows.length - 1] === "") rows.pop();
  return rows;
}

// atob skips the line breaks base64 adds, which differ between Linux and macOS.
async function unpack(base64) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

// Each file is decoded once, the first time a note or a check needs it.
function codeFile(path) {
  if (!codeFiles.has(path)) codeFiles.set(path, loadCodeFile(path));
  return codeFiles.get(path);
}

// The page never reads files from a server, so a file shows only when the content file was packed with it.
async function loadCodeFile(path) {
  if (packedFiles.has(path)) return unpack(packedFiles.get(path));
  throw new Error(`${path} is not packed in this explanation. Pack the content file from the repo root, so the file is included.`);
}

function rangeText(fence) {
  return fence.first === fence.last ? `line ${fence.first}` : `lines ${fence.first}–${fence.last}`;
}

// The header shows the path and the range. With a range, it switches between those lines and the whole file, where the range is highlighted.
function codeFileView(fence) {
  const figure = document.createElement("figure");
  figure.className = "code-file";
  const head = document.createElement(fence.first ? "button" : "div");
  head.className = "code-file-head";
  const path = document.createElement("span");
  path.className = "code-file-path";
  path.textContent = fence.path;
  const range = document.createElement("span");
  range.className = "code-file-range";
  head.append(path, range);
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = "Loading…";
  pre.append(code);
  figure.append(head, pre);

  let rows = null;
  let whole = !fence.first;
  function draw() {
    const from = whole ? 1 : fence.first;
    const to = whole ? rows.length : Math.min(fence.last, rows.length);
    range.textContent = !fence.first ? "" : whole ? `Whole file, ${rangeText(fence)} marked` : rangeText(fence);
    if (fence.first) head.setAttribute("aria-expanded", String(whole));
    code.replaceChildren(
      ...rows.slice(from - 1, to).map((row, index) => {
        const line = document.createElement("span");
        line.className = "code-line";
        const number = from + index;
        line.dataset.n = String(number);
        if (whole && fence.first && number >= fence.first && number <= fence.last) line.classList.add("is-picked");
        if (isMarked(fence, number)) line.classList.add("is-marked");
        line.textContent = row;
        return line;
      }),
    );
    const target = code.querySelector(".is-marked") || code.querySelector(".is-picked");
    pre.scrollTop = target ? target.offsetTop - pre.clientHeight / 4 : 0;
  }
  if (fence.first) {
    head.type = "button";
    head.title = "Switch between these lines and the whole file";
    head.addEventListener("click", () => {
      if (!rows) return;
      whole = !whole;
      draw();
    });
  }
  codeFile(fence.path).then(
    (text) => {
      rows = splitLines(text);
      draw();
    },
    (error) => {
      figure.classList.add("is-missing");
      code.textContent = error.message;
    },
  );
  return figure;
}
