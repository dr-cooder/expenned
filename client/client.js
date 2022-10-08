const gameCode = require('../src/gameCode.js');
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

// In the event of a JSON endpoint being called and a JSON not being returned,
// chances are it's not from our API, i.e. Heroku is experiencing a (hopefully)
// momentary blip, i.e. the request should be tried again.
const jsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (e) {
    return undefined;
  }
};

// https://github.com/robertdiers/js-multi-file-download/blob/master/src/main/resources/static/multidownload.js
const downloadFiles = (files) => {
  const downloadNext = (i) => {
    if (i >= files.length) return;
    const file = files[i];
    const a = document.createElement('a');
    a.href = file.url;
    a.target = '_parent';
    if ('download' in a) {
      a.download = file.filename;
    }
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => downloadNext(i + 1), 500);
  };
  downloadNext(0);
};

const gameHavingState = async (code, state) => {
  const response = await fetch(`/getGame?code=${code}`, {
    method: 'get',
    headers: {
      Accept: 'application/json',
    },
  });
  const jsonResponse = await jsonSafe(response) || {};
  if (response.status === 200 && jsonResponse.state === state) {
    return jsonResponse;
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(gameHavingState(code, state)), 1000);
  });
};

const startRound = async (code, round, player1Scribbles, iAmPlayer1) => {
  // If Player 1 scribbles and I am Player 1, then I scribble.
  // If Player 1 *doesn't* scribble (meaning Player 2 scribbles),
  // and I am *not* Player 1 (meaning I am Player 2), then I scribble.
  // Otherwise I don't scribble.
  // I scribble if and only if the player who I am is the player who scribbles.
  const iScribble = player1Scribbles === iAmPlayer1;
  els.whyAmIWaiting.innerHTML = 'Waiting for the other player to make a scribble...';
  els.whatAmIDrawing.innerHTML = 'Make a scribble!';
  drawingBoard.clear();
  els.finalScribble.classList.remove('finalDrawingActive');
  els.finalExpension.classList.add('finalDrawingActive');
  els.finalScribbleOrExpension.checked = true;
  els.playAgainCheckbox.checked = false;
  els.submitDrawingButton.onclick = async () => {
    // https://stackoverflow.com/questions/13198131/how-to-save-an-html5-canvas-as-an-image-on-a-server
    const dataURL = drawingBoard.toDataURL();
    await fetch(`/submitDrawing?code=${code}&round=${round}&which=${iScribble ? 'scribble' : 'expension'}`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'image/png',
      },
      body: dataURL,
    });
    if (iScribble) {
      els.whyAmIWaiting.innerHTML = 'Waiting for the other player to make an exPENsion of your scribble...';
      setScreen('waiting');
      await gameHavingState(code, 3);
    }
    const finalScribbleURL = `/getDrawing?code=${code}&round=${round}&which=scribble`;
    const finalExpensionURL = `/getDrawing?code=${code}&round=${round}&which=expension`;
    els.finalScribble.src = finalScribbleURL;
    els.finalExpension.src = finalExpensionURL;
    els.saveDrawingsButton.onclick = () => {
      downloadFiles([
        {
          url: finalScribbleURL,
          filename: `expensiongame_${code}_1`,
        },
        {
          url: finalExpensionURL,
          filename: `expensiongame_${code}_2`,
        },
      ]);
    };
    setScreen('done');
    const nextRound = await gameHavingState(code, 1);
    startRound(code, nextRound.round, nextRound.player1Scribbles, iAmPlayer1);
  };
  els.playAgainCheckbox.onclick = (e) => {
    fetch(`/readyForNextRound?code=${code}&ready=${e.target.checked ? 'yes' : 'no'}&player=${iAmPlayer1 ? 'player1' : 'player2'}`, {
      method: 'post',
    });
  };
  setScreen(iScribble ? 'drawing' : 'waiting');
  if (!iScribble) {
    await gameHavingState(code, 2);
    await drawingBoard.drawImage(`/getDrawing?code=${code}&round=${round}&which=scribble`);
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
    'newGameError',
    'joinGameButton',
    'codeDisplay',
    'codeInput',
    'submitJoinCodeButton',
    'joinError',
    'whyAmIWaiting',
    'whatAmIDrawing',
    'submitDrawingButton',
    'finalScribble',
    'finalExpension',
    'finalScribbleOrExpension',
    'saveDrawingsButton',
    'playAgainCheckbox',
  ]);

  // setScreen('done'); // DEBUG SPECIFIC SCREEN
  if (!drawingBoard.init()) {
    setScreen('noCanvas');
  }

  const requestNewGame = async () => {
    els.newGameButton.disabled = true;
    const response = await fetch('/newGame', {
      method: 'post',
      headers: {
        Accept: 'application/json',
      },
    });
    const jsonResponse = await jsonSafe(response);
    if (!jsonResponse) {
      requestNewGame();
      return;
    }
    if (response.status === 201) {
      const { code } = jsonResponse;
      els.codeDisplay.innerHTML = code;
      setScreen('displayCode');
      const { player1Scribbles } = await gameHavingState(code, 1);
      startRound(code, 0, player1Scribbles, true);
    } else {
      els.newGameButton.disabled = false;
      els.newGameError.innerHTML = jsonResponse.message;
    }
  };

  els.newGameButton.onclick = requestNewGame;

  els.joinGameButton.onclick = () => {
    setScreen('inputCode');
  };

  const submitJoinCode = async () => {
    els.submitJoinCodeButton.disabled = true;
    els.codeInput.disabled = true;
    const code = els.codeInput.value.toUpperCase();
    const codeError = gameCode.validateCode(code);
    if (codeError) {
      els.submitJoinCodeButton.disabled = false;
      els.codeInput.disabled = false;
      els.joinError.innerHTML = codeError.message;
      return;
    }
    const response = await fetch(`/joinGame?code=${code}`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
      },
    });
    const jsonResponse = await jsonSafe(response);
    if (!jsonResponse) {
      submitJoinCode();
      return;
    }
    if (response.status === 200) {
      const { player1Scribbles } = jsonResponse;
      startRound(code, 0, player1Scribbles, false);
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

  els.finalScribbleOrExpension.onclick = (e) => {
    // If the switch is checked, the exPENsion is to be seen and the scribble is not.
    const showExpension = e.target.checked;
    els.finalScribble.classList[showExpension ? 'remove' : 'add']('finalDrawingActive');
    els.finalExpension.classList[showExpension ? 'add' : 'remove']('finalDrawingActive');
  };
};

window.onload = init;
