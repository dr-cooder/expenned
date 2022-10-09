// Much of the code here is from IGME 330's canvas exercieses

const lineWidth = 3;
const lineColor = 'black';

let drawingBoard;
let ctx;
let dragging = false;

const getMouse = (e) => {
  const mouse = {};
  mouse.x = e.pageX - e.target.offsetLeft;
  mouse.y = e.pageY - e.target.offsetTop;
  return mouse;
};

const mousedownCallback = (e) => {
  dragging = true;
  const { x, y } = getMouse(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
  // Create a point as soon as the PEN is down
  ctx.lineTo(x, y);
  ctx.stroke();
};

const mousemoveCallback = (e) => {
  // Only draw a line if the PEN is down
  if (!dragging) return;
  const { x, y } = getMouse(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};

const mouseupCallback = () => {
  dragging = false;
  ctx.closePath();
};

const mouseoutCallback = () => {
  // Stop drawing if the PEN goes out of bounds
  dragging = false;
  ctx.closePath();
};

const toDataURL = () => drawingBoard.toDataURL();

// https://www.fabiofranchino.com/log/load-an-image-with-javascript-using-await/
const loadImage = (url) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = url;
  img.onload = () => {
    resolve(img);
  };
  img.onerror = (e) => {
    reject(e);
  };
});

const drawImage = async (url) => {
  const img = await loadImage(url);
  ctx.drawImage(img, 0, 0);
};

const clear = () => {
  const prevFillStyle = ctx.fillStyle;
  // The board should be cleared with the color white instead of transparency,
  // as the images shouldn't be downloaded as black lines on a transparent background
  ctx.fillStyle = 'white';
  // https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
  ctx.fillRect(0, 0, drawingBoard.width, drawingBoard.height);
  ctx.fillStyle = prevFillStyle;
};

const init = () => {
  drawingBoard = document.querySelector('#drawingBoard');
  // Some (really old) browsers don't support Canvas's toDataUrl behavior or even
  // Canvas itself for that matter, and both are vital to the game, so the game
  // shouldn't even bother starting on the off chance that the user has an unsupportive browser
  // https://caniuse.com/?search=canvas
  // https://stackoverflow.com/questions/2745432/best-way-to-detect-that-html5-canvas-is-not-supported
  if (!(drawingBoard.getContext && drawingBoard.getContext('2d') && drawingBoard.toDataURL && drawingBoard.toDataURL())) {
    return false;
  }
  ctx = drawingBoard.getContext('2d');

  drawingBoard.onmousedown = mousedownCallback;
  drawingBoard.onmousemove = mousemoveCallback;
  drawingBoard.onmouseup = mouseupCallback;
  drawingBoard.onmouseout = mouseoutCallback;

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  return true;
};

module.exports = {
  init,
  toDataURL,
  drawImage,
  clear,
};
