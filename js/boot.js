// Mermaid setup, and the listeners that are not owned by the camera or the panel.

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "base",
  fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  flowchart: { htmlLabels: true, useMaxWidth: false, curve: "basis" },
  sequence: { useMaxWidth: false },
  c4: { useMaxWidth: false },
  themeVariables: {
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
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
    await navigator.clipboard.writeText(app.view.chart.trim() + "\n");
    setStatus("Copied the Mermaid source.");
  } catch {
    setStatus("Could not copy. Select the diagram source from the file instead.");
  }
});

document.getElementById("export").addEventListener("click", exportHtml);
document.getElementById("fit").addEventListener("click", fit);
document.getElementById("story-open").addEventListener("click", () => {
  app.storyHidden = false;
  openStory();
});
document.getElementById("zoom-in").addEventListener("click", () => zoomBy(1.15));
document.getElementById("zoom-out").addEventListener("click", () => zoomBy(1 / 1.15));
document.getElementById("lesson-prev").addEventListener("click", () => showLesson(-1));
document.getElementById("lesson-next").addEventListener("click", () => showLesson(1));

app.els.search.addEventListener("input", applySearch);

document.addEventListener("keydown", (event) => {
  const typing = event.target.closest("input, textarea");
  // Escape on the open help closes only the help, not the panel behind it.
  if (app.els.help.matches(":popover-open")) {
    if (event.key === "Escape") app.els.help.hidePopover();
    return;
  }
  if (event.key === "/" && !typing) {
    event.preventDefault();
    app.els.search.focus();
  }
  if (event.key === "?" && !typing) {
    event.preventDefault();
    app.els.help.showPopover();
  }
  if (event.key === "Escape") {
    hideTooltip();
    // A note goes back to the story first. The story itself stays open while stepping up.
    if (app.selectedInteraction) closePanel();
    else showParent();
  }
  if (event.key === "Backspace" && !typing && showParent()) {
    event.preventDefault();
  }
  const lessonKey = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
  if (lessonKey && !typing && !app.selectedInteraction && showLesson(lessonKey)) {
    event.preventDefault();
  }
});

window.addEventListener("hashchange", openFromHash);

openFromHash();
