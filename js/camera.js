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
  // The floating controls cover the top and the bottom of the canvas. Fit keeps the diagram between them.
  const view = els.viewport.getBoundingClientRect();
  const top = document.querySelector(".float-top").getBoundingClientRect().bottom - view.top + pad / 2;
  const bottom = view.bottom - document.querySelector(".float-bottom").getBoundingClientRect().top + pad / 2;
  const height = els.viewport.clientHeight - top - bottom;
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

// The screen rectangle around these elements, or null when none of them has a size.
function unionRect(elements) {
  const boxes = elements.map((el) => el.getBoundingClientRect()).filter((box) => box.width || box.height);
  if (!boxes.length) return null;
  return {
    left: Math.min(...boxes.map((box) => box.left)),
    right: Math.max(...boxes.map((box) => box.right)),
    top: Math.min(...boxes.map((box) => box.top)),
    bottom: Math.max(...boxes.map((box) => box.bottom)),
  };
}

// Scale the camera by k around a viewport point, so that point stays where it is.
function scaleAbout(px, py, k) {
  const { cam } = app;
  cam.x = px - (px - cam.x) * k;
  cam.y = py - (py - cam.y) * k;
  cam.s *= k;
}

// Pan the least distance that brings these elements inside the viewport. The scale stays.
function reveal(elements) {
  const box = unionRect(elements);
  if (!box) return;
  const viewportBox = app.els.viewport.getBoundingClientRect();
  const pad = 24;
  const { left, right, top, bottom } = box;
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
  const ui = app.els;
  if (!ui.camera.querySelector("svg") || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }
  ui.camera.classList.add("is-leaving");
  const box = unionRect(elements);
  if (box) {
    const viewportBox = ui.viewport.getBoundingClientRect();
    scaleAbout((box.left + box.right) / 2 - viewportBox.left, (box.top + box.bottom) / 2 - viewportBox.top, 1.8);
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

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.6;

// The buttons and the wheel zoom here. The scale stays between ZOOM_MIN and ZOOM_MAX.
// Fit can go below ZOOM_MIN for a large diagram. From there a zoom out stops instead of jumping up to ZOOM_MIN.
function zoomAt(px, py, factor) {
  const low = Math.min(ZOOM_MIN, app.cam.s);
  const high = Math.max(ZOOM_MAX, app.cam.s);
  const next = Math.min(high, Math.max(low, app.cam.s * factor));
  if (next === app.cam.s) return;
  scaleAbout(px, py, next / app.cam.s);
  applyCam();
}

function zoomBy(factor) {
  const rect = app.els.viewport.getBoundingClientRect();
  zoomAt(rect.width / 2, rect.height / 2, factor);
}

function wireCamera() {
  const { els } = app;
  els.viewport.addEventListener("selectstart", (event) => event.preventDefault());

  els.viewport.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".is-node, .is-edge, .is-edge-label, .edge-hit") || event.button !== 0) return;
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
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, event.deltaY < 0 ? 1.08 : 1 / 1.08);
    },
    { passive: false }
  );
}
