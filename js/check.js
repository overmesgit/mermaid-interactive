// The page checks its own content, because a mistake does not stop it: a shape just does nothing on click.
// Problems show behind the ⚠ chip by Find, and in the console.
// Two kinds: the content checks run once on load and cover every view. The draw checks run after each draw and say what was not found in the picture.

const checks = {
  content: [],
  // viewId → problems from its last draw. A drawn view's result replaces its content check on shapes and arrows.
  drawn: {},
  warned: new Set(),
};

function edgeEnds(edge) {
  return Array.isArray(edge) ? [edge[0], edge[1]] : [edge.from, edge.to];
}

// `match` marks a problem the draw check also finds, so it is not listed twice once the view is drawn.
function checkContent() {
  const found = [];
  const views = DIAGRAMS.views || {};
  const tabs = DIAGRAMS.tabs || [];
  const isView = (id) => Object.hasOwn(views, id);
  const tabIds = new Set(tabs.map((tab) => tab.id));
  if (!tabs.length) found.push({ text: "There are no tabs, so nothing opens." });
  tabs.forEach((tab) => {
    if (!isView(tab.id)) found.push({ text: `Tab "${tab.label}" opens ${tab.id}, which is not a view.` });
    (tab.lesson || []).forEach((id) => {
      if (!isView(id)) found.push({ text: `Tab "${tab.label}" has the lesson step ${id}, which is not a view.` });
    });
  });
  Object.entries(views).forEach(([viewId, view]) => {
    const say = (text, match) => found.push({ viewId, text: `${viewId}: ${text}`, match });
    if (view.viewId !== viewId) say(`its viewId is ${view.viewId}. It must equal its key.`);
    if (view.parent && !isView(view.parent)) say(`its parent ${view.parent} is not a view.`);
    if (!tabIds.has(view.tab)) say(`its tab ${view.tab} is not a tab id.`);
    const chart = view.chart || "";
    const kind = chartKind(chart);
    const notes = view.nodeInteractions || {};
    const edges = view.edgeInteractions || [];
    // A chartId can hold "-", so "api" must not match inside "api-gw".
    const inChart = (id) => new RegExp(`(^|[^\\w-])${escapeRegExp(id)}($|[^\\w-])`).test(chart);
    if (!kind && (Object.keys(notes).length || edges.length)) {
      say("the page wires only flowchart, C4, sequence, and state charts, so these notes do nothing.");
      return;
    }
    Object.entries(notes).forEach(([chartId, note]) => {
      if (!inChart(chartId)) say(`the shape ${chartId} has a note, but the chart has no ${chartId}.`, true);
      if (note.opensView && !isView(note.opensView)) say(`the shape ${chartId} opens ${note.opensView}, which is not a view.`);
    });
    edges.forEach((edge) => {
      const [from, to] = edgeEnds(edge);
      const name = `the arrow ${from} → ${to}`;
      if (edge.opensView && !isView(edge.opensView)) say(`${name} opens ${edge.opensView}, which is not a view.`);
      if (kind === "sequence" || kind === "c4") {
        if (!edge.mermaidText) say(`${name} has no mermaidText. In a ${kind === "c4" ? "C4" : "sequence"} chart an arrow is found by its text.`);
        else if (!norm(chart).toLowerCase().includes(norm(edge.mermaidText).toLowerCase())) say(`${name}: the chart has no message "${edge.mermaidText}".`, true);
      } else if (kind === "state") {
        [from, to].forEach((end) => {
          if (end !== "*" && !notes[end]) say(`${name}: ${end} needs a shape note, because a state arrow is found by the shapes at its ends.`);
        });
      } else {
        [from, to].forEach((end) => {
          if (!inChart(end)) say(`${name}: the chart has no ${end}.`, true);
        });
      }
    });
    // A link to a part, like [API](#api), only works when this view has a note for that part. Otherwise it shows as plain text.
    const texts = [
      ["the story", view.story],
      ...Object.entries(notes).map(([id, note]) => [`the note on ${id}`, note.body]),
      ...edges.map((edge) => [`the note on ${edgeEnds(edge).join(" → ")}`, edge.body]),
    ];
    texts.forEach(([where, text]) => {
      // Code can show the link syntax without being a link.
      const prose = String(text || "").replace(/~~~[\s\S]*?~~~/g, "").replace(/`[^`]*`/g, "");
      for (const [, key] of prose.matchAll(/\]\(#([^)\s]+)\)/g)) {
        const isArrow = key.includes("->");
        const known = isArrow ? edges.some((edge) => edgeEnds(edge).join("->") === key) : Object.hasOwn(notes, key);
        if (known) continue;
        const missing = isArrow ? `arrow note from ${key.replace("->", " to ")}` : `shape note for ${key}`;
        say(`${where} links to #${key}, but this view has no ${missing}, so the link shows as plain text.`);
      }
    });
  });
  return found;
}

// Mermaid's message is several lines: where it failed, a caret, and what it expected. The first and last say enough.
function parseError(error) {
  const lines = String(error?.message || error).split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.length > 1 ? `${lines[0]} ${lines[lines.length - 1]}` : lines[0] || "";
}

// Every chart is parsed, not only the one on screen, so a broken step shows before anyone reaches it.
async function checkCharts() {
  const found = [];
  for (const [viewId, view] of Object.entries(DIAGRAMS.views || {})) {
    try {
      await mermaid.parse(view.chart || "");
    } catch (error) {
      found.push({ viewId, text: `${viewId}: the chart does not draw. ${parseError(error)}` });
    }
  }
  return found;
}

// Each file= must name a file the page holds, and its lines must fit inside it. A wrong path or revision packs an empty file.
// A missing file is one problem, however many notes name it.
async function checkCodeFiles() {
  const found = [];
  const byPath = new Map();
  fileFences().forEach((fence) => byPath.set(fence.path, [...(byPath.get(fence.path) || []), fence]));
  for (const [path, fences] of byPath) {
    const where = fences.length === 1 ? `It is named in ${fences[0].where}.` : `${fences.length} notes name it: ${fences.map((fence) => fence.where).join("; ")}.`;
    let text;
    try {
      text = await codeFile(path);
    } catch (error) {
      if (!error.preview) found.push({ viewId: fences[0].viewId, text: `${error.message} ${where}` });
      continue;
    }
    if (!text) {
      found.push({ viewId: fences[0].viewId, text: `${path} is empty. A wrong path or revision packs an empty file. ${where}` });
      continue;
    }
    const count = splitLines(text).length;
    fences.forEach((fence) => {
      if (fence.first && (fence.first < 1 || fence.last < fence.first || fence.last > count)) {
        found.push({ viewId: fence.viewId, text: `${fence.where}: ${path} has ${count} lines, so ${rangeText(fence)} cannot be shown.` });
      }
    });
  }
  return found;
}

async function runChecks() {
  checks.content = checkContent();
  renderChecks();
  const [charts, files, template] = await Promise.all([checkCharts(), checkCodeFiles(), checkTemplate()]);
  checks.content.push(...charts, ...files, ...template);
  renderChecks();
}

// `missed` are the node and edge interactions the last draw of this view could not find in the picture.
// A sequence or C4 arrow with no mermaidText cannot be found at all, and the content check already says why.
function reportDrawn(viewId, missed) {
  const byText = ["sequence", "c4"].includes(chartKind(app.views[viewId].chart));
  const unexplained = missed.filter((interaction) => !(byText && interaction.kind === "edge" && !interaction.mermaidText));
  checks.drawn[viewId] = unexplained.map((interaction) => ({
    viewId,
    text:
      interaction.kind === "node"
        ? `${viewId}: no shape ${interaction.chartId} was found in the picture, so its note does nothing.`
        : `${viewId}: the arrow ${interaction.label}${interaction.mermaidText ? ` ("${interaction.mermaidText}")` : ""} was not found in the picture, so it does nothing.`,
  }));
  renderChecks();
}

function renderChecks() {
  const problems = [
    ...checks.content.filter((problem) => !(problem.match && checks.drawn[problem.viewId])),
    ...Object.values(checks.drawn).flat(),
  ];
  const open = document.getElementById("checks-open");
  open.hidden = !problems.length;
  document.getElementById("checks-count").textContent = String(problems.length);
  open.setAttribute("aria-label", `${problems.length} problem${problems.length === 1 ? "" : "s"} in this explanation`);
  document.querySelector("#checks ul").replaceChildren(
    ...problems.map((problem) => {
      const item = document.createElement("li");
      item.textContent = problem.text;
      return item;
    }),
  );
  problems.forEach(({ text }) => {
    if (checks.warned.has(text)) return;
    checks.warned.add(text);
    console.warn(text);
  });
}
