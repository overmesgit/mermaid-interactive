// Export saves this page as one HTML file. The page already holds every script and its style inline, because the editor built it that way, so Export copies them.
// That needs no server, so Export works from disk and inside the editor's frame. The CDN scripts stay links.

// The markup as it was before anything was drawn, so an export holds no picture, tabs, or open note from this visit. The scripts that run next fill it in.
const pristineBody = document.body.cloneNode(true);

function exportHtml() {
  const css = document.querySelector("head > style").textContent;
  // The script that opens the start view is written fresh below, so an export of an export opens where the reader was.
  const sources = [...document.querySelectorAll("script:not([src]):not([data-start-view])")].map((script) => script.textContent);
  const cdn = [...document.querySelectorAll("script[src]")].map((script) => script.outerHTML);
  const hash = app.stack.map((view) => view.viewId).join("/");
  const safe = (source) => source.replace(/<\/script/gi, "<\\/script");
  const body = pristineBody.cloneNode(true);
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
${cdn.join("\n")}
<script data-start-view>if (!location.hash) location.replace("#${hash}");</script>
${sources.map((source) => `<script>${safe(source)}</script>`).join("\n")}
</body>
</html>
`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "interactive-diagrams.html";
  link.click();
  // Firefox can cancel the download if the URL is revoked in the same task as the click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus("Downloaded a standalone HTML file.");
}
