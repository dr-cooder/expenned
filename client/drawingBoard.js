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

const drawImage = (url, x, y) => {
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, x, y);
  };
  img.src = url;
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

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  return true;
};

module.exports = {
  init,
  setPenColor,
  toDataURL,
  drawImage,
};
