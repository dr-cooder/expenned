const drawingBoard = require('./drawingBoard.js');

let screens = {};
let els = {};

const elementDictionary = (propNames, propNameToElementID) => {
  const propNameToElementIdFinalized = propNameToElementID || ((e) => e);
  const dict = {};
  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i];
    dict[propName] = document.querySelector(`#${propNameToElementIdFinalized(propName)}`);
  }
  return dict;
};

const setScreen = (name) => {
  if (!screens[name]) return;
  Object.keys(screens).forEach((key) => {
    screens[key].classList.toggle('activeScreen', key === name);
  });
};

const gameHavingState = async (code, state) => {
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
    setTimeout(() => resolve(gameHavingState(code, state)), 1000);
  });
};

const startRound = async (code, player1Scribbles, iAmPlayer1) => {
  // If Player 1 scribbles and I am Player 1, then I scribble.
  // If Player 1 *doesn't* scribble (meaning Player 2 scribbles),
  // and I am *not* Player 1 (meaning I am Player 2), then I scribble.
  // Otherwise I don't scribble.
  // I scribble if and only if the player who I am is the player who scribbles.
  const iScribble = player1Scribbles === iAmPlayer1;
  els.whyAmIWaiting.innerHTML = 'Waiting for the other player to make a scribble...';
  els.whatAmIDrawing.innerHTML = 'Make a scribble!';
  drawingBoard.clear();
  els.playAgainCheckbox.checked = false;
  els.submitDrawingButton.onclick = async () => {
    // https://stackoverflow.com/questions/13198131/how-to-save-an-html5-canvas-as-an-image-on-a-server
    const dataURL = drawingBoard.toDataURL();
    // TO-DO: handle errors when receiving
    await fetch(`/submitDrawing?code=${code}`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'image/png',
      },
      body: dataURL,
    });
    if (iScribble) {
      els.whyAmIWaiting.innerHTML = 'Waiting for the other player to exPENd your scribble...';
      setScreen('waiting');
      await gameHavingState(code, 3);
      els.finalDrawing.src = `/getDrawing?code=${code}`;
    } else els.finalDrawing.src = dataURL;
    setScreen('done');
    const nextRound = await gameHavingState(code, 1);
    startRound(code, nextRound.player1Scribbles, iAmPlayer1);
  };
  els.playAgainCheckbox.onclick = (e) => {
    fetch(`/readyForNextRound?code=${code}&ready=${e.target.checked ? 'yes' : 'no'}&player=${iAmPlayer1 ? 'player1' : 'player2'}`, {
      method: 'post',
    });
  };
  setScreen(iScribble ? 'drawing' : 'waiting');
  if (!iScribble) {
    await gameHavingState(code, 2);
    await drawingBoard.drawImage(`/getDrawing?code=${code}`);
    els.whatAmIDrawing.innerHTML = 'It\'s exPENsion time! Turn this scribble into a coherent drawing!';
    setScreen('drawing');
  } // Otherwise the game state changes when the scribble is submitted
};

const init = () => {
  screens = elementDictionary([
    'start',
    'displayCode',
    'inputCode',
    'waiting',
    'drawing',
    'done',
    'noCanvas',
  ], (e) => `${e}Screen`);

  els = elementDictionary([
    'newGameButton',
    'joinGameButton',
    'codeDisplay',
    'codeInput',
    'submitJoinCodeButton',
    'joinError',
    'whyAmIWaiting',
    'whatAmIDrawing',
    'submitDrawingButton',
    'finalDrawing',
    'playAgainCheckbox',
  ]);

  // setScreen('done'); // DEBUG
  if (!drawingBoard.init()) {
    setScreen('noCanvas');
  }

  els.newGameButton.onclick = async () => {
    els.newGameButton.disabled = true;
    const response = await fetch('/newGame', {
      method: 'post',
      headers: {
        Accept: 'application/json',
      },
    });
    const jsonResponse = await response.json();
    if (response.status === 201) {
      const { code } = jsonResponse;
      els.codeDisplay.innerHTML = `Tell Player 2 to join with code: ${code}`;
      setScreen('displayCode');
      const { player1Scribbles } = await gameHavingState(code, 1);
      startRound(code, player1Scribbles, true);
    } else {
      els.newGameButton.disabled = false;
      els.codeDisplay.innerHTML = jsonResponse.message;
    }
  };

  els.joinGameButton.onclick = () => {
    setScreen('inputCode');
  };

  const submitJoinCode = async () => {
    els.submitJoinCodeButton.disabled = true;
    els.codeInput.disabled = true;
    const code = els.codeInput.value.toUpperCase();
    // TO-DO: Client-side validation just in case (DRY)
    const response = await fetch(`/joinGame?code=${code}`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
      },
    });
    const jsonResponse = await response.json();
    if (response.status === 200) {
      const { player1Scribbles } = jsonResponse;
      startRound(code, player1Scribbles, false);
    } else {
      els.submitJoinCodeButton.disabled = false;
      els.codeInput.disabled = false;
      els.joinError.innerHTML = jsonResponse.message;
    }
  };

  els.submitJoinCodeButton.onclick = submitJoinCode;
  els.codeInput.onkeypress = (e) => {
    if ((e.code || e.key) === 'Enter') {
      submitJoinCode();
    }
  };
};

window.onload = init;
