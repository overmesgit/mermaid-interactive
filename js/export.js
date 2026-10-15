// Export inlines the local script tags of index.html, in page order. The CDN scripts stay links.
// With ?template in the link, Export saves the skill's template instead: the page with no content, and a marker line where the content file goes.

const TEMPLATE_MARKER = "/* DIAGRAMS */";

function localScripts() {
  return [...document.querySelectorAll("script[src]")].filter((script) => !/^https?:/.test(script.getAttribute("src")));
}

// fetch resolves on a 404, so a missing file is an error here instead of an error page inlined as a script.
async function readFile(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Export could not read ${path} (${response.status}).`);
  return response.text();
}

async function exportHtml() {
  const template = new URLSearchParams(location.search).has("template");
  const scripts = localScripts();
  let css, sources, markup;
  try {
    [css, ...sources] = await Promise.all(["styles.css", ...scripts.map((script) => script.getAttribute("src"))].map(readFile));
    if (template) markup = await readFile("index.html");
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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Interactive Mermaid</title>
  <style>${css}</style>
</head>
<body>
${body.innerHTML}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@15.0.12/marked.min.js"></script>
${template ? "" : `<script>if (!location.hash) location.replace("#${hash}");</script>\n`}${inlined.join("\n")}
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
