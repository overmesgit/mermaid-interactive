// A peek note: a card on the canvas, held against its part's shape, so the reader sees the note and the shape together.
// It sits beside the shape, below it, or in the corner. A view sets its default with notePlace, and the card's buttons let the reader pick another.

const NOTE_MODES = ["inline", "peek"];
const PEEK_PLACES = ["beside", "below", "corner"];
const PEEK_GAP = 14;

const PEEK_ICONS = {
  beside: ["Beside the shape", '<rect x="1.5" y="5" width="5" height="6" rx="1" /><rect x="8.5" y="2.5" width="6" height="11" rx="1" />'],
  below: ["Below the shape", '<rect x="4.5" y="1.5" width="7" height="4.5" rx="1" /><rect x="2" y="8" width="12" height="6.5" rx="1" />'],
  corner: ["In the corner", '<rect x="1.5" y="2.5" width="13" height="11" rx="1" /><path d="M9 2.5v7h5.5" />'],
};

// The reader's pick, per view, for this visit only.
const pickedPlaces = new Map();

// Which side of the shape the card takes. It is chosen when the card opens and kept while the camera moves, so the card does not jump.
let peekSide = "right";

// The reader's pick wins, then the link's place, then the view's, then the explanation's.
function peekPlace(linkPlace) {
  const viewId = app.view?.viewId;
  const choices = [pickedPlaces.get(viewId), linkPlace, app.view?.notePlace, DIAGRAMS.notePlace];
  return choices.find((place) => PEEK_PLACES.includes(place)) || "beside";
}

// The canvas between the islands at the top and the bottom, in the stage's own coordinates.
function peekArea() {
  const stage = app.els.stage.getBoundingClientRect();
  return {
    left: 16,
    right: stage.width - 16,
    top: document.querySelector(".float-top").getBoundingClientRect().bottom - stage.top + 12,
    bottom: document.querySelector(".float-bottom").getBoundingClientRect().top - stage.top - 12,
  };
}

// The open part's shape, in the stage's coordinates. It is read from the picture, so it moves with the camera.
function shapeBox() {
  const box = unionRect(wiredElements(app.selectedInteraction));
  if (!box) return null;
  const stage = app.els.stage.getBoundingClientRect();
  return { left: box.left - stage.left, right: box.right - stage.left, top: box.top - stage.top, bottom: box.bottom - stage.top };
}

function hidePeekCaret() {
  app.els.peekCaret.hidden = true;
}

// Opening, or a new place: choose the side, size the card, then pan so the shape and the card both fit.
function openPeek(linkPlace) {
  const pane = app.note.pane;
  const place = peekPlace(linkPlace);
  pane.dataset.place = place;
  app.els.peekPlaces.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.place === place)));
  const area = peekArea();
  const height = area.bottom - area.top;
  const shape = shapeBox();
  if (place === "corner" || !shape) {
    pane.style.maxHeight = `${Math.round(height)}px`;
    positionPeek();
    clearShapeFromCorner();
    return;
  }
  if (place === "below") {
    peekSide = "below";
    pane.style.maxHeight = `${Math.round(Math.max(200, Math.min(520, height - (shape.bottom - shape.top) - PEEK_GAP)))}px`;
  } else {
    // Right of the shape reads first. Left when the right has less room on screen.
    peekSide = area.right - shape.right >= shape.left - area.left ? "right" : "left";
    pane.style.maxHeight = `${Math.round(Math.min(height, 640))}px`;
  }
  positionPeek();
  fitShapeAndCard();
}

// Puts the card against its shape on the chosen side. Nothing is clamped, so the card stays attached when the shape is panned away.
function positionPeek() {
  const pane = app.note.pane;
  const caret = app.els.peekCaret;
  if (pane.dataset.mode !== "peek" || pane.hidden || !app.selectedInteraction) return;
  const area = peekArea();
  const width = pane.offsetWidth;
  const shape = shapeBox();
  if (pane.dataset.place === "corner" || !shape) {
    pane.style.left = `${Math.round(area.right - width)}px`;
    pane.style.top = `${Math.round(area.top)}px`;
    caret.hidden = true;
    return;
  }
  let left;
  let top;
  let caretX;
  let caretY;
  if (peekSide === "below") {
    const middle = (shape.left + shape.right) / 2;
    left = middle - width / 2;
    top = shape.bottom + PEEK_GAP;
    caretX = middle;
    caretY = top;
  } else {
    left = peekSide === "right" ? shape.right + PEEK_GAP : shape.left - PEEK_GAP - width;
    top = shape.top - 12;
    caretX = peekSide === "right" ? left : left + width;
    caretY = Math.min((shape.top + shape.bottom) / 2, top + 40);
  }
  pane.style.left = `${Math.round(left)}px`;
  pane.style.top = `${Math.round(top)}px`;
  caret.dataset.side = peekSide;
  caret.style.left = `${Math.round(caretX)}px`;
  caret.style.top = `${Math.round(caretY)}px`;
  caret.hidden = false;
}

// Pans the least distance that brings the shape and its card onto the canvas. When both do not fit, the shape's top comes first.
// The card's own box is used, not its screen box, because it is still scaling in.
function fitShapeAndCard() {
  const pane = app.note.pane;
  const shape = shapeBox();
  if (!shape) return;
  const area = peekArea();
  const left = Math.min(shape.left, pane.offsetLeft);
  const right = Math.max(shape.right, pane.offsetLeft + pane.offsetWidth);
  const top = Math.min(shape.top, pane.offsetTop);
  const bottom = Math.max(shape.bottom, pane.offsetTop + pane.offsetHeight);
  let dx = 0;
  let dy = 0;
  if (right > area.right) dx = area.right - right;
  if (left + dx < area.left) dx = area.left - left;
  if (bottom > area.bottom) dy = area.bottom - bottom;
  if (top + dy < area.top) dy = area.top - top;
  if (!dx && !dy) return;
  app.cam.x += dx;
  app.cam.y += dy;
  // The camera watcher moves the card with it.
  applyCam();
}

// The corner card stays put, so a shape under it pans left until it is clear.
function clearShapeFromCorner() {
  const pane = app.note.pane;
  const shape = shapeBox();
  if (!shape) return;
  const cardLeft = pane.offsetLeft - 12;
  const cardBottom = pane.offsetTop + pane.offsetHeight + 12;
  if (shape.right < cardLeft || shape.top > cardBottom) return;
  app.cam.x -= shape.right - cardLeft;
  applyCam();
}

function wirePeek() {
  PEEK_PLACES.forEach((place) => {
    const [label, icon] = PEEK_ICONS[place];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon";
    button.dataset.place = place;
    button.title = label;
    button.setAttribute("aria-label", label);
    button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 16 16">${icon}</svg>`;
    button.addEventListener("click", () => {
      pickedPlaces.set(app.view.viewId, place);
      openPeek();
    });
    app.els.peekPlaces.append(button);
  });
  // The camera sets its transform on #camera, so watching that attribute catches every pan and zoom.
  new MutationObserver(positionPeek).observe(app.els.camera, { attributes: true, attributeFilter: ["style"] });
  new ResizeObserver(positionPeek).observe(app.els.stage);
}
