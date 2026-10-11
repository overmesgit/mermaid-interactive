// Mermaid setup, and the listeners that are not owned by the camera or the panel.

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "base",
  fontFamily: "Segoe UI, sans-serif",
  flowchart: { htmlLabels: true, useMaxWidth: false, curve: "basis" },
  sequence: { useMaxWidth: false },
  c4: { useMaxWidth: false },
  themeVariables: {
    fontFamily: "Segoe UI, sans-serif",
    fontSize: "15px",
    background: "transparent",
    primaryColor: "#f3efe4",
    primaryTextColor: "#1c1915",
    primaryBorderColor: "#2a2622",
    secondaryColor: "#e4efe6",
    secondaryTextColor: "#1c1915",
    secondaryBorderColor: "#2a2622",
    tertiaryColor: "#efe4d4",
    tertiaryTextColor: "#1c1915",
    tertiaryBorderColor: "#2a2622",
    lineColor: "#5e584e",
    textColor: "#1c1915",
    mainBkg: "#f3efe4",
    nodeBorder: "#2a2622",
    actorBkg: "#f3efe4",
    actorBorder: "#2a2622",
    actorTextColor: "#1c1915",
    signalColor: "#2a2622",
    signalTextColor: "#1c1915",
    noteBkgColor: "#efe4d4",
    noteTextColor: "#1c1915",
    noteBorderColor: "#2a2622",
    activationBkgColor: "#e4efe6",
    activationBorderColor: "#2a2622",
  },
});

wireTabs();
wireCamera();
wirePanel();

document.getElementById("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(app.current.chart.trim() + "\n");
    setStatus("Copied the Mermaid source.");
  } catch {
    setStatus("Could not copy. Select the diagram source from the file instead.");
  }
});

document.getElementById("export").addEventListener("click", exportHtml);
document.getElementById("fit").addEventListener("click", fit);
document.getElementById("zoom-in").addEventListener("click", () => zoomBy(1.15));
document.getElementById("zoom-out").addEventListener("click", () => zoomBy(1 / 1.15));

app.els.search.addEventListener("input", applySearch);

document.addEventListener("keydown", (event) => {
  const typing = event.target.closest("input, textarea");
  if (event.key === "/" && !typing) {
    event.preventDefault();
    app.els.search.focus();
  }
  if (event.key === "Escape") {
    hideTooltip();
    if (app.els.workspace.classList.contains("panel-open")) closePanel();
    else if (app.stack.length > 1) show(app.stack[app.stack.length - 2].id);
  }
  if (event.key === "Backspace" && !typing && app.stack.length > 1) {
    event.preventDefault();
    show(app.stack[app.stack.length - 2].id);
  }
});

window.addEventListener("hashchange", () => {
  if (!app.hashLock) openFromHash();
});

openFromHash();
