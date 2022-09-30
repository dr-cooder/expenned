const drawingBoard = require('./drawingBoard.js');

// let iAmPlayer1;
let iScribble;
let code;
let player1Scribbles;
let screens = {};

const setScreen = (name) => {
  if (!screens[name]) return;
  Object.keys(screens).forEach((key) => {
    screens[key].classList.toggle('activeScreen', key === name);
  });
};

const gameHavingState = async (state) => {
  const response = await fetch(`/getGame?code=${code}`, {
    method: 'get',
    headers: {
      Accept: 'application/json',
    },
  });
  const jsonResponse = await response.json();
  if (response.status === 200 && jsonResponse.state === state) {
    return jsonResponse;
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(gameHavingState(state)), 1000);
  });
};

const init = () => {
  screens = {
    start: document.querySelector('#startScreen'),
    displayCode: document.querySelector('#displayCodeScreen'),
    inputCode: document.querySelector('#inputCodeScreen'),
    waiting: document.querySelector('#waitingScreen'),
    drawing: document.querySelector('#drawingScreen'),
    noCanvas: document.querySelector('#noCanvasScreen'),
  };

  const newGameButton = document.querySelector('#newGameButton');
  const joinGameButton = document.querySelector('#joinGameButton');
  const codeDisplay = document.querySelector('#codeDisplay');
  const codeInput = document.querySelector('#codeInput');
  const submitJoinCodeButton = document.querySelector('#submitJoinCodeButton');
  const joinError = document.querySelector('#joinError');
  const whyAmIWaiting = document.querySelector('#whyAmIWaiting');
  const whatAmIDrawing = document.querySelector('#whatAmIDrawing');
  const submitDrawingButton = document.querySelector('#submitDrawingButton');

  // setScreen('drawing'); // DEBUG
  if (!drawingBoard.init()) {
    setScreen('noCanvas');
  }

  newGameButton.onclick = async () => {
    newGameButton.disabled = true;
    const response = await fetch('/newGame', {
      method: 'post',
      headers: {
        Accept: 'application/json',
      },
    });
    const jsonResponse = await response.json();
    if (response.status === 201) {
      // iAmPlayer1 = true;
      code = jsonResponse.code;
      codeDisplay.innerHTML = `Tell Player 2 to join with code: ${code}`;
      setScreen('displayCode');
      ({ player1Scribbles } = await gameHavingState(1));
      iScribble = player1Scribbles;
      whyAmIWaiting.innerHTML = 'Waiting for the other player to make a scribble...';
      whatAmIDrawing.innerHTML = 'Make a scribble!';
      setScreen(iScribble ? 'drawing' : 'waiting');
      // Gameplay code continues here...
    } else {
      newGameButton.disabled = false;
      codeDisplay.innerHTML = jsonResponse.message;
    }
  };

  joinGameButton.onclick = () => {
    setScreen('inputCode');
  };

  submitJoinCodeButton.onclick = async () => {
    submitJoinCodeButton.disabled = true;
    code = codeInput.value.toUpperCase();
    // TO-DO: Client-side validation just in case (DRY)
    const response = await fetch(`/joinGame?code=${code}`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
      },
    });
    const jsonResponse = await response.json();
    if (response.status === 200) {
      // iAmPlayer1 = false;
      ({ player1Scribbles } = jsonResponse);
      iScribble = !player1Scribbles;
      whyAmIWaiting.innerHTML = 'Waiting for the other player to make a scribble...';
      whatAmIDrawing.innerHTML = 'Make a scribble!';
      setScreen(iScribble ? 'drawing' : 'waiting');
      // Gameplay code continues here...
    } else {
      submitJoinCodeButton.disabled = false;
      joinError.innerHTML = jsonResponse.message;
    }
  };

  submitDrawingButton.onclick = async () => {
    // Take the canvas image data and POST it to the server
    // https://stackoverflow.com/questions/13198131/how-to-save-an-html5-canvas-as-an-image-on-a-server
    const dataURL = drawingBoard.toDataURL();
    console.log(dataURL);
  };
};

window.onload = init;
