// Mermaid setup, and the listeners that are not owned by the camera or the panel.

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  // On a bad chart, show() writes the error where the diagram goes. Without this, Mermaid also leaves its own error picture at the bottom of the page.
  suppressErrorRendering: true,
  theme: "base",
  // The camera sizes the picture, so no chart type may shrink it to its container.
  flowchart: { htmlLabels: true, useMaxWidth: false, curve: "basis" },
  sequence: { useMaxWidth: false },
  c4: { useMaxWidth: false },
  state: { useMaxWidth: false },
  themeVariables: {
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    fontSize: "15px",
    background: "transparent",
    primaryColor: "#ffffff",
    primaryTextColor: "#1e293b",
    primaryBorderColor: "#475569",
    secondaryColor: "#eef2f7",
    secondaryTextColor: "#1e293b",
    secondaryBorderColor: "#475569",
    tertiaryColor: "#f1f5f9",
    tertiaryTextColor: "#1e293b",
    tertiaryBorderColor: "#475569",
    lineColor: "#64748b",
    textColor: "#1e293b",
    mainBkg: "#ffffff",
    nodeBorder: "#475569",
    actorBkg: "#ffffff",
    actorBorder: "#475569",
    actorTextColor: "#1e293b",
    signalColor: "#475569",
    signalTextColor: "#1e293b",
    noteBkgColor: "#fef9e7",
    noteTextColor: "#1e293b",
    noteBorderColor: "#cbd5e1",
    activationBkgColor: "#e6eefd",
    activationBorderColor: "#475569",
  },
});

wireTabs();
wireCamera();
wirePanel();
wireReading();
wirePeek();
runChecks();

document.getElementById("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(app.view.chart.trim() + "\n");
    setStatus("Copied the Mermaid source.");
  } catch {
    setStatus("Could not copy. Select the diagram source from the file instead.");
  }
});

document.getElementById("export").addEventListener("click", exportHtml);

// The menu and the problem list open under their island, right edges aligned. The menu closes after a choice.
["more-menu", "checks"].forEach((id) => {
  const popover = document.getElementById(id);
  popover.addEventListener("beforetoggle", (event) => {
    if (event.newState !== "open") return;
    const box = document.getElementById("more-open").closest(".island").getBoundingClientRect();
    popover.style.top = `${box.bottom + 8}px`;
    popover.style.right = `${document.documentElement.clientWidth - box.right}px`;
  });
});
const moreMenu = document.getElementById("more-menu");
moreMenu.addEventListener("click", (event) => {
  if (event.target.closest("button, a")) moreMenu.hidePopover();
});
document.getElementById("fit").addEventListener("click", fit);
// Story is a switch: it shows the story, or hides it.
app.els.storyOpen.addEventListener("click", () => setStoryHidden(!app.storyHidden));
document.getElementById("zoom-in").addEventListener("click", () => zoomBy(1.15));
document.getElementById("zoom-out").addEventListener("click", () => zoomBy(1 / 1.15));
document.getElementById("lesson-prev").addEventListener("click", () => showLesson(-1));
document.getElementById("lesson-next").addEventListener("click", () => showLesson(1));

document.addEventListener("keydown", (event) => {
  const typing = event.target.closest("input, textarea");
  // Escape on the open help or menu closes only that, not the panel behind it.
  const popup = document.querySelector("[popover]:popover-open");
  if (popup) {
    if (event.key === "Escape") popup.hidePopover();
    return;
  }
  if (event.key === "?" && !typing) {
    event.preventDefault();
    app.els.help.showPopover();
  }
  if (event.key === "Escape") {
    hideTooltip();
    // An open note closes first. The story itself stays open while stepping up.
    if (app.selectedInteraction) closeNote();
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
