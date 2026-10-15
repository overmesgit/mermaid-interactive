// Export inlines the local script tags of index.html, in page order. The CDN scripts stay links.
// With ?template in the link, Export saves the skill's template instead: the page with no content, and a marker line where the content file goes.

const TEMPLATE_MARKER = "/* DIAGRAMS */";

function localScripts() {
  return [...document.querySelectorAll("script[src]")].filter((script) => !/^https?:/.test(script.getAttribute("src")));
}

// fetch resolves on a 404, so a missing file is an error here instead of an error page inlined as a script.
// no-cache asks the server each time, so an export never inlines a file the browser kept from before an edit.
async function readFile(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Export could not read ${path} (${response.status}).`);
  return response.text();
}

// The files the template is made from: the CSS, the markup, and every local script except the content.
function templateInputs() {
  const scripts = localScripts().filter((script) => !script.hasAttribute("data-content"));
  return Promise.all(["styles.css", "index.html", ...scripts.map((script) => script.getAttribute("src"))].map(readFile));
}

// A short hash of those files. It only has to change when a file changes, so FNV-1a is enough, and it needs no secure context.
function fingerprint(texts) {
  let hash = 0x811c9dc5;
  texts.forEach((text) => {
    for (let index = 0; index < text.length; index++) {
      hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193) >>> 0;
    }
  });
  return hash.toString(16).padStart(8, "0");
}

// The page served from this repo warns when the skill's template was made from older files, so an agent would get an old page.
// A joined page, or a page opened from disk, has no template to compare.
async function checkTemplate() {
  if (!document.querySelector("script[data-content]") || !location.protocol.startsWith("http")) return [];
  let template, inputs;
  try {
    [template, inputs] = await Promise.all([readFile("skill/assets/explainer.html"), templateInputs()]);
  } catch {
    return [];
  }
  const stamp = /<meta name="engine-fingerprint" content="([0-9a-f]+)"/.exec(template)?.[1];
  if (stamp === fingerprint(inputs)) return [];
  return [{ text: "skill/assets/explainer.html was made from older code than this page, so an agent would get an old page. Open this page with ?template, press Export HTML, and save the file there." }];
}

// Export packs every file a note names, the same way the join does, so the saved file shows them without the repo.
async function packedCodeFiles() {
  const tags = [];
  for (const path of new Set(fileFences().map((fence) => fence.path))) {
    let text;
    try {
      text = await codeFile(path);
    } catch {
      continue;
    }
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    let binary = "";
    bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
    tags.push(`<script type="application/gzip" data-file="${path.replace(/"/g, "&quot;")}">\n${btoa(binary).replace(/.{76}/g, "$&\n")}\n</script>`);
  }
  return tags;
}

async function exportHtml() {
  const template = new URLSearchParams(location.search).has("template");
  const scripts = localScripts();
  let css, sources, markup;
  // The template carries a fingerprint of the files it was made from, so the page can tell when it is out of date.
  let stamp = "";
  // The template holds no content, so it packs no files. The join adds them.
  const packed = template ? [] : await packedCodeFiles();
  try {
    [css, ...sources] = await Promise.all(["styles.css", ...scripts.map((script) => script.getAttribute("src"))].map(readFile));
    if (template) {
      markup = await readFile("index.html");
      stamp = `\n  <meta name="engine-fingerprint" content="${fingerprint(await templateInputs())}" />`;
    }
  } catch (error) {
    // On file:// fetch itself rejects with a TypeError.
    setStatus(error instanceof TypeError ? "Export needs a local server. Open the folder with a static server, then export." : error.message);
    return;
  }
  const hash = app.stack.map((view) => view.viewId).join("/");
  const safe = (source) => source.replace(/<\/script/gi, "<\\/script");
  // The template starts from the markup in index.html, because the live page holds this content's tabs and diagram.
  const body = template ? new DOMParser().parseFromString(markup, "text/html").body : document.body.cloneNode(true);
  body.querySelectorAll("script").forEach((script) => script.remove());
  // The marker sits alone on its line, so one sed command can swap it for the content file.
  const slot = `<script>
${TEMPLATE_MARKER}
</script>
<script>if (!window.DIAGRAMS) document.getElementById("camera").textContent = "This page has no content. Put a content file where the ${TEMPLATE_MARKER} line was.";</script>`;
  const inlined = scripts.map((script, index) =>
    template && script.hasAttribute("data-content") ? slot : `<script>${safe(sources[index])}</script>`,
  );
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />${stamp}
  <title>Interactive Mermaid</title>
  <style>${css}</style>
</head>
<body>
${body.innerHTML}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@15.0.12/marked.min.js"></script>
${template ? "" : `<script>if (!location.hash) location.replace("#${hash}");</script>\n`}${[...inlined, ...packed].join("\n")}
</body>
</html>
`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = template ? "explainer.html" : "interactive-diagrams.html";
  link.click();
  // Firefox can cancel the download if the URL is revoked in the same task as the click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus(template ? "Downloaded the skill's template. Save it as skill/assets/explainer.html." : "Downloaded a standalone HTML file.");
}
