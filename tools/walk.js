// Runs inside the preview frame, called by tools/check.py with `sleep` and `ONLY` (view ids, or null for all).
// Draws each view, clicks the middle of every part and three points along every arrow, and reads the problem list.
const report = { views: {} };
for (const id of ONLY || Object.keys(DIAGRAMS.views)) {
  show(id);
  let svg = null;
  for (let i = 0; i < 40 && !(svg = document.querySelector("#camera svg")); i++) await sleep(250);
  await sleep(2500);
  svg = document.querySelector("#camera svg");
  if (!svg) { report.views[id] = { error: document.querySelector("#camera").textContent.slice(0, 400) }; continue; }
  const misses = [];
  const nodes = [...svg.querySelectorAll(".is-node")];
  for (const g of nodes) {
    const r = g.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!(el && el.closest(".is-node") === g)) misses.push(`part ${g.dataset.chartId}: hit ${el && el.tagName}.${el && el.getAttribute("class")}`);
  }
  // Each arrow is tried on the line and 6px (at full size) below it, at 20%, 50%, and 80% of its length.
  for (const line of svg.querySelectorAll(".is-edge:not(.edge-hit)")) {
    const len = line.getTotalLength();
    const m = line.getScreenCTM();
    for (const f of [0.2, 0.5, 0.8]) for (const dy of [0, Math.round(6 * app.cam.s * 10) / 10]) {
      const at = line.getPointAtLength(len * f);
      const p = new DOMPoint(at.x, at.y).matrixTransform(m);
      const el = document.elementFromPoint(p.x, p.y + dy);
      const got = el && (el.dataset.edgeId || el.closest("[data-edge-id]")?.dataset.edgeId);
      if (got !== line.dataset.edgeId) misses.push(`arrow ${line.dataset.edgeId} at ${f * 100}%${dy ? " +" + dy + "px" : ""}: hit ${got ? "arrow " + got : el && el.tagName}`);
    }
  }
  const v = DIAGRAMS.views[id];
  report.views[id] = {
    nodes: `${new Set(nodes.map((n) => n.dataset.chartId)).size}/${Object.keys(v.nodeInteractions || {}).length}`,
    edges: `${new Set([...svg.querySelectorAll("[data-edge-id]")].map((e) => e.dataset.edgeId)).size}/${v.edgeInteractions.length}`,
    unwiredMsgs: [...svg.querySelectorAll(".messageText")].filter((t) => !t.dataset.wired).map((t) => t.textContent),
    misses,
  };
}
report.problems = [...document.querySelectorAll("#checks li")].map((li) => li.textContent);
return report;
