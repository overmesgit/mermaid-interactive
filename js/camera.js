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
  const s = Math.min(
    (els.viewport.clientWidth - pad) / box.width,
    (els.viewport.clientHeight - pad) / box.height,
    1.35
  );
  cam.s = Number.isFinite(s) && s > 0 ? s : 1;
  cam.x = (els.viewport.clientWidth - box.width * cam.s) / 2;
  cam.y = Math.max(24, (els.viewport.clientHeight - box.height * cam.s) / 2);
  applyCam();
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
