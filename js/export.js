// Keep this list identical to the script tags in index.html. Export inlines them in this order.

const APP_SCRIPTS = [
  "js/state.js",
  "js/camera.js",
  "js/highlight.js",
  "js/panel.js",
  "js/mermaid-svg.js",
  "js/bind.js",
  "js/nav.js",
  "js/export.js",
  "js/boot.js",
];

async function exportHtml() {
  let css, data, sources;
  try {
    [css, data, ...sources] = await Promise.all([
      fetch("styles.css").then((response) => response.text()),
      fetch("diagrams.js").then((response) => response.text()),
      ...APP_SCRIPTS.map((path) => fetch(path).then((response) => response.text())),
    ]);
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
<script>${safe(data)}</script>
<script>${safe(sources.join("\n"))}</script>
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
