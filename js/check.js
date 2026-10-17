// The page checks its own content, because a mistake does not stop it: a shape just does nothing on click.
// Problems show behind the ⚠ chip by Find, and in the console.
// Two kinds: the content checks run once on load and cover every view. The draw checks run after each draw and say what was not found in the picture.

const checks = {
  content: [],
  // viewId → the shapes and arrows its chart text seems to lack. Once the view is drawn, its draw check says the same from the picture, so it replaces these.
  chartIds: {},
  // viewId → problems from its last draw.
  drawn: {},
  warned: new Set(),
};

const isView = (id) => Object.hasOwn(DIAGRAMS.views, id);
const isType = (name) => Object.hasOwn(DIAGRAMS.types || {}, name);

// Text without its code, because code can show link syntax without being a link.
function prose(text) {
  return String(text || "").replace(/~~~[\s\S]*?~~~/g, "").replace(/`[^`]*`/g, "");
}

// A link's title says how its note opens: "inline", "peek", or "peek" and a place.
function isNoteHowTitle(title) {
  const [mode, place, extra] = title.trim().toLowerCase().split(/\s+/);
  return mode === "inline" ? !place : mode === "peek" && (!place || PEEK_PLACES.includes(place)) && !extra;
}

// Each part of a view with its note, the key a link uses, and the name a problem uses.
function viewParts(view) {
  return [
    ...Object.entries(view.nodeInteractions || {}).map(([chartId, note]) => ({ note, key: chartId, name: `the shape ${chartId}` })),
    ...view.edgeInteractions.map((edge) => ({ note: edge, key: `${edge.from}->${edge.to}`, name: `the arrow ${edge.from} → ${edge.to}` })),
  ];
}

function checkContent() {
  const found = [];
  const tabs = DIAGRAMS.tabs || [];
  const types = Object.keys(DIAGRAMS.types || {});
  if (!tabs.length) found.push({ text: "There are no tabs, so nothing opens." });
  if (types.length > TYPE_COLORS) found.push({ text: `DIAGRAMS.types names ${types.length} types, but there are only ${TYPE_COLORS} type colors, so ${types.slice(TYPE_COLORS).join(", ")} stay uncolored.` });
  if (DIAGRAMS.notePlace !== undefined && !PEEK_PLACES.includes(DIAGRAMS.notePlace)) {
    found.push({ text: `notePlace is "${DIAGRAMS.notePlace}". It takes "beside", "below", or "corner", so notes open beside their shapes instead.` });
  }
  // The lesson step before each step. A part that step already showed was introduced there, so the story need not link it again.
  const stepBefore = new Map();
  tabs.forEach((tab) => {
    if (!isView(tab.id)) found.push({ text: `Tab "${tab.label}" opens ${tab.id}, which is not a view.` });
    (tab.lesson || []).forEach((id, index) => {
      if (!isView(id)) found.push({ text: `Tab "${tab.label}" has the lesson step ${id}, which is not a view.` });
      else if (index && isView(tab.lesson[index - 1])) stepBefore.set(id, DIAGRAMS.views[tab.lesson[index - 1]]);
    });
  });
  Object.entries(DIAGRAMS.views).forEach(([viewId, view]) => {
    const say = (text) => ({ viewId, text: `${viewId}: ${text}` });
    found.push(...checkView(view, stepBefore.get(viewId)).map(say));
    checks.chartIds[viewId] = checkChartIds(view).map(say);
  });
  return found;
}

// Everything about one view except whether its chart has each shape and arrow. `before` is the lesson step before it, if any.
function checkView(view, before) {
  const problems = [];
  const parts = viewParts(view);
  const kind = chartKind(view.chart);
  if (view.parent && !isView(view.parent)) problems.push(`its parent ${view.parent} is not a view.`);
  if (!(DIAGRAMS.tabs || []).some((tab) => tab.id === view.tab)) problems.push(`its tab ${view.tab} is not a tab id.`);
  if (view.notePlace !== undefined && !PEEK_PLACES.includes(view.notePlace)) {
    problems.push(`notePlace is "${view.notePlace}". It takes "beside", "below", or "corner", so the note opens beside its shape instead.`);
  }
  if (!kind) {
    if (parts.length) problems.push("the page wires only flowchart, C4, sequence, and state charts, so these notes do nothing.");
    return problems;
  }
  parts.forEach(({ note, name }) => {
    // A misspelt type or status changes nothing in the picture, so it would go unnoticed.
    if (note.type !== undefined && !isType(note.type)) problems.push(`${name} has type "${note.type}", which DIAGRAMS.types does not name, so it has no color.`);
    if (note.status !== undefined && !STATUSES[note.status]) problems.push(`${name} has status "${note.status}". It must be one of ${Object.keys(STATUSES).join(", ")}.`);
    if (note.opensView && !isView(note.opensView)) problems.push(`${name} opens ${note.opensView}, which is not a view.`);
  });
  view.edgeInteractions.forEach((edge) => {
    const name = `the arrow ${edge.from} → ${edge.to}`;
    if ((kind === "sequence" || kind === "c4") && !edge.mermaidText) {
      problems.push(`${name} has no mermaidText. In a ${kind === "c4" ? "C4" : "sequence"} chart an arrow is found by its text.`);
    }
    if (kind === "state") {
      [edge.from, edge.to].forEach((end) => {
        if (end !== "*" && !view.nodeInteractions?.[end]) problems.push(`${name}: ${end} needs a shape note, because a state arrow is found by the shapes at its ends.`);
      });
    }
  });
  // Mermaid names an arrow written as `a e1@--> b` after its id instead of its ends, so the page cannot find it.
  if (kind === "flowchart") {
    for (const [, id] of view.chart.matchAll(/\b([\w-]+)@(?=[-=.~])/g)) {
      problems.push(`the arrow id ${id}@ hides the arrow's ends from the page, so its note cannot be found. Write the arrow without an id. The page animates lit arrows itself.`);
    }
  }
  problems.push(...checkLinks(view, parts), ...checkStoryLinks(view, parts, before));
  return problems;
}

// A link to a part, like [API](#api), only works when this view has a note for that part. Otherwise it shows as plain text.
function checkLinks(view, parts) {
  const problems = [];
  const keys = new Set(parts.map((part) => part.key));
  const texts = [["the story", view.story], ...parts.map(({ note, name }) => [`the note on ${name.replace(/^the (shape|arrow) /, "")}`, note.body])];
  texts.forEach(([where, text]) => {
    for (const [, name] of prose(text).matchAll(/\]\(~([^)\s]+)\)/g)) {
      if (!isType(name)) problems.push(`${where} writes text as the type ~${name}, which DIAGRAMS.types does not name, so it has no color.`);
    }
    for (const [, key, title] of prose(text).matchAll(/\]\(#([^)\s]+)(?:\s+"([^"]*)")?\)/g)) {
      if (title !== undefined && !isNoteHowTitle(title)) {
        problems.push(`${where} links to #${key} with "${title}". A link's title is "inline", "peek", or "peek" with a place: "peek beside", "peek below", "peek corner".`);
      }
      if (keys.has(key)) continue;
      const missing = key.includes("->") ? `arrow note from ${key.replace("->", " to ")}` : `shape note for ${key}`;
      problems.push(`${where} links to #${key}, but this view has no ${missing}, so the link shows as plain text.`);
    }
  });
  return problems;
}

// A story has no parts list, so a part with something to open must be linked where the story talks about it.
// On a lesson step, only the parts the step adds.
function checkStoryLinks(view, parts, before) {
  if (!view.story) return [];
  const seen = before ? partKeysOf(before) : new Set();
  const linked = new Set([...prose(view.story).matchAll(/\]\(#([^)\s]+)/g)].map(([, key]) => key));
  const left = [...new Set(parts.filter(({ note, key }) => hasMore(note) && !linked.has(key) && !seen.has(key)).map(({ key }) => key))];
  return left.length ? [`the story never links ${left.join(", ")}, so a reader finds their notes only by the dot in the picture. Link each where the story talks about it, like [Name](#${left[0]}).`] : [];
}

// Whether the chart text has each shape and arrow a note names. A chartId can hold "-", so "api" must not match inside "api-gw".
function checkChartIds(view) {
  const chart = view.chart || "";
  const kind = chartKind(chart);
  const inChart = (id) => new RegExp(`(^|[^\\w-])${escapeRegExp(id)}($|[^\\w-])`).test(chart);
  if (!kind) return [];
  const problems = Object.keys(view.nodeInteractions || {}).filter((id) => !inChart(id)).map((id) => `the shape ${id} has a note, but the chart has no ${id}.`);
  view.edgeInteractions.forEach((edge) => {
    const name = `the arrow ${edge.from} → ${edge.to}`;
    if (kind === "sequence" || kind === "c4") {
      if (edge.mermaidText && !norm(chart).toLowerCase().includes(norm(edge.mermaidText).toLowerCase())) problems.push(`${name}: the chart has no message "${edge.mermaidText}".`);
    } else if (kind === "flowchart") {
      [edge.from, edge.to].forEach((end) => {
        if (!inChart(end)) problems.push(`${name}: the chart has no ${end}.`);
      });
    }
  });
  return problems;
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
      found.push({ viewId: fences[0].viewId, text: `${error.message} ${where}` });
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
      // A marked line outside the shown lines is never seen, so the note points at nothing.
      const shownFirst = fence.first || 1;
      const shownLast = fence.first ? fence.last : count;
      fence.mark.forEach(([from, to]) => {
        if (from < shownFirst || to > shownLast || to < from) {
          found.push({ viewId: fence.viewId, text: `${fence.where}: mark=${from === to ? from : `${from}-${to}`} is outside the lines shown, ${shownFirst}–${shownLast}, so nothing is highlighted.` });
        }
      });
    });
  }
  return found;
}

async function runChecks() {
  checks.content = checkContent();
  renderChecks();
  const [charts, files] = await Promise.all([checkCharts(), checkCodeFiles()]);
  checks.content.push(...charts, ...files);
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
    ...checks.content,
    ...Object.entries(checks.chartIds).flatMap(([viewId, list]) => (checks.drawn[viewId] ? [] : list)),
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
