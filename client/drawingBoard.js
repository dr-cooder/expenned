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
  const mouse = getMouse(e);
  ctx.beginPath();
  ctx.moveTo(mouse.x, mouse.y);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.stroke();
};

const mousemoveCallback = (e) => {
  if (!dragging) return false;
  const mouse = getMouse(e);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.stroke();
  return true;
};

const mouseupCallback = () => {
  dragging = false;
  ctx.closePath();
};

const mouseoutCallback = () => {
  dragging = false;
  ctx.closePath();
};

const setPenColor = (color) => {
  ctx.strokeStyle = color;
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
  ctx.fillStyle = 'white';
  // https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
  ctx.fillRect(0, 0, drawingBoard.width, drawingBoard.height);
  ctx.fillStyle = prevFillStyle;
};

const init = () => {
  drawingBoard = document.querySelector('#drawingBoard');
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
  setPenColor,
  toDataURL,
  drawImage,
  clear,
};
