// Code files a note names with ~~~go file=api/session.go lines=40-58. The panel shows those lines, and the header opens the whole file.
// The join packs each whole file into the page as gzip and base64, in an inert script tag after the engine.

const codeFiles = new Map();

// The packed files come after the engine, so they are not parsed yet while the engine runs.
const pageParsed = new Promise((resolve) => {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", resolve, { once: true });
  else resolve();
});

// The fence's info string, such as "go file=api/session.go lines=40-58". `first` and `last` are null without lines=.
function fileFence(info) {
  const path = /(?:^|\s)file=(\S+)/.exec(info || "");
  if (!path) return null;
  const lines = /(?:^|\s)lines=(\d+)(?:-(\d+))?(?:\s|$)/.exec(info);
  return {
    path: path[1],
    first: lines ? Number(lines[1]) : null,
    last: lines ? Number(lines[2] || lines[1]) : null,
  };
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

// An error with `preview` set is a limit of previewing, not a mistake in the content, so the checks do not list it.
function codeFileError(message, preview) {
  return Object.assign(new Error(message), { preview });
}

async function loadCodeFile(path) {
  await pageParsed;
  const packed = [...document.querySelectorAll('script[type="application/gzip"]')].find((script) => script.dataset.file === path);
  if (packed) return unpack(packed.textContent);
  // Only a joined page has packed files. A preview through index.html?src= marks its content script, and reads files from the server instead.
  if (!document.querySelector("script[data-content]")) {
    throw codeFileError(`${path} is not packed in this page. Join the page from the repo root, so the file is packed.`, false);
  }
  if (path.includes(":")) {
    throw codeFileError(`This preview cannot show ${path}, because it comes from git history. The joined page shows it.`, true);
  }
  if (!location.protocol.startsWith("http")) {
    throw codeFileError(`A page opened from disk cannot read ${path}. Serve the folder over HTTP, or join the page.`, true);
  }
  const response = await fetch(new URL(path, location.href));
  if (!response.ok) throw codeFileError(`${path} was not found on the server (${response.status}). Check the path from the repo root.`, false);
  return response.text();
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
        line.textContent = row;
        return line;
      }),
    );
    const picked = code.querySelector(".is-picked");
    pre.scrollTop = picked ? picked.offsetTop - pre.clientHeight / 4 : 0;
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
