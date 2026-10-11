// Export inlines the local script tags of index.html, in page order. The CDN scripts stay links.

function localScripts() {
  return [...document.querySelectorAll("script[src]")]
    .map((script) => script.getAttribute("src"))
    .filter((src) => !/^https?:/.test(src));
}

async function exportHtml() {
  let css, sources;
  try {
    [css, ...sources] = await Promise.all(
      ["styles.css", ...localScripts()].map((path) => fetch(path).then((response) => response.text()))
    );
  } catch {
    setStatus("Export needs a local server. Open the folder with a static server, then export.");
    return;
  }
  const hash = app.stack.map((view) => view.viewId).join("/");
  const safe = (source) => source.replace(/<\/script/gi, "<\\/script");
  const body = document.body.cloneNode(true);
  body.querySelectorAll("script").forEach((script) => script.remove());
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
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@15/marked.min.js"></script>
<script>if (!location.hash) location.replace("#${hash}");</script>
${sources.map((source) => `<script>${safe(source)}</script>`).join("\n")}
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "interactive-diagrams.html";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Downloaded a standalone HTML file.");
}
