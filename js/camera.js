// Pan and zoom of #camera. This does not change which diagram is shown.

function applyCam() {
  const { cam, els } = app;
  els.camera.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`;
}

function fit() {
  const { cam, els } = app;
  const svg = els.camera.querySelector("svg");
  if (!svg) return;
  const box = svg.viewBox && svg.viewBox.baseVal.width
    ? svg.viewBox.baseVal
    : { width: svg.getBoundingClientRect().width, height: svg.getBoundingClientRect().height };
  const pad = 48;
  // Prev and Next sit on the top left of the diagram. Fit starts below them.
  const top = els.lesson.hidden ? pad / 2 : els.lesson.offsetTop + els.lesson.offsetHeight + 12;
  const height = els.viewport.clientHeight - top - pad / 2;
  const s = Math.min(
    (els.viewport.clientWidth - pad) / box.width,
    height / box.height,
    1.35
  );
  cam.s = Number.isFinite(s) && s > 0 ? s : 1;
  cam.x = (els.viewport.clientWidth - box.width * cam.s) / 2;
  cam.y = top + Math.max(0, (height - box.height * cam.s) / 2);
  applyCam();
}

// Pan the least distance that brings these elements inside the viewport. The scale stays.
function reveal(elements) {
  const viewportBox = app.els.viewport.getBoundingClientRect();
  const boxes = elements.map((el) => el.getBoundingClientRect()).filter((box) => box.width || box.height);
  if (!boxes.length) return;
  const pad = 24;
  const left = Math.min(...boxes.map((box) => box.left));
  const right = Math.max(...boxes.map((box) => box.right));
  const top = Math.min(...boxes.map((box) => box.top));
  const bottom = Math.max(...boxes.map((box) => box.bottom));
  let dx = 0;
  let dy = 0;
  if (right > viewportBox.right - pad) dx = viewportBox.right - pad - right;
  if (left + dx < viewportBox.left + pad) dx = viewportBox.left + pad - left;
  if (bottom > viewportBox.bottom - pad) dy = viewportBox.bottom - pad - bottom;
  if (top + dy < viewportBox.top + pad) dy = viewportBox.top + pad - top;
  if (!dx && !dy) return;
  app.cam.x += dx;
  app.cam.y += dy;
  applyCam();
}

const LEAVE_MS = 200;

// Fade the old SVG out before show() swaps it. With origin elements, also zoom toward them.
function leaveView(elements) {
  const { cam, els: ui } = app;
  if (!ui.camera.querySelector("svg") || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }
  ui.camera.classList.add("is-leaving");
  const boxes = elements.map((el) => el.getBoundingClientRect()).filter((box) => box.width || box.height);
  if (boxes.length) {
    const viewportBox = ui.viewport.getBoundingClientRect();
    const px = (Math.min(...boxes.map((b) => b.left)) + Math.max(...boxes.map((b) => b.right))) / 2 - viewportBox.left;
    const py = (Math.min(...boxes.map((b) => b.top)) + Math.max(...boxes.map((b) => b.bottom))) / 2 - viewportBox.top;
    const k = 1.8;
    cam.x = px - (px - cam.x) * k;
    cam.y = py - (py - cam.y) * k;
    cam.s *= k;
  }
  applyCam();
  return new Promise((resolve) => setTimeout(resolve, LEAVE_MS));
}

// The new SVG fades in through the base opacity transition on #camera.
function enterView(saved) {
  app.els.camera.classList.remove("is-leaving");
  if (saved) {
    Object.assign(app.cam, saved);
    applyCam();
  } else fit();
}

function zoomBy(factor) {
  const { cam, els } = app;
  const rect = els.viewport.getBoundingClientRect();
  const px = rect.width / 2;
  const py = rect.height / 2;
  const next = Math.min(2.6, Math.max(0.35, cam.s * factor));
  const k = next / cam.s;
  cam.x = px - (px - cam.x) * k;
  cam.y = py - (py - cam.y) * k;
  cam.s = next;
  applyCam();
}

function wireCamera() {
  const { els } = app;
  els.viewport.addEventListener("selectstart", (event) => event.preventDefault());

  els.viewport.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".is-node, .is-edge, .is-edge-label, .edge-hit, #lesson") || event.button !== 0) return;
    app.drag = { x: event.clientX, y: event.clientY, cx: app.cam.x, cy: app.cam.y };
    els.viewport.classList.add("is-dragging");
    els.viewport.setPointerCapture(event.pointerId);
  });

  els.viewport.addEventListener("pointermove", (event) => {
    if (!app.drag) return;
    app.cam.x = app.drag.cx + (event.clientX - app.drag.x);
    app.cam.y = app.drag.cy + (event.clientY - app.drag.y);
    applyCam();
  });

  function endDrag() {
    app.drag = null;
    els.viewport.classList.remove("is-dragging");
  }

  els.viewport.addEventListener("pointerup", endDrag);
  els.viewport.addEventListener("pointercancel", endDrag);

  els.viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const rect = els.viewport.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const next = Math.min(2.6, Math.max(0.35, app.cam.s * (event.deltaY < 0 ? 1.08 : 1 / 1.08)));
      const k = next / app.cam.s;
      app.cam.x = px - (px - app.cam.x) * k;
      app.cam.y = py - (py - app.cam.y) * k;
      app.cam.s = next;
      applyCam();
    },
    { passive: false }
  );
}
