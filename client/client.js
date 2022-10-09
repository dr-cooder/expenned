const gameCode = require('../src/gameCode.js');
const drawingBoard = require('./drawingBoard.js');

let screens = {};
let els = {};

// Create an object that whose keys point to corresponding document elements
const elementDictionary = (propNames, propNameToElementID) => {
  // If there is no no provided function translating the dictionary key name
  // to its corresponding element id, just use the key name as is
  const propNameToElementIdFinalized = propNameToElementID || ((e) => e);
  const dict = {};

  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i];
    dict[propName] = document.querySelector(`#${propNameToElementIdFinalized(propName)}`);
  }

  return dict;
};

const setScreen = (name) => {
  // Avoid hiding all of the screens when there is no such screen with the given name
  if (!screens[name]) return;

  // Only the screen with the given name should be shown
  // https://stackoverflow.com/questions/33946567/iterate-over-values-of-object
  Object.keys(screens).forEach((key) => {
    screens[key].classList.toggle('activeScreen', key === name);
  });
};

// In the event of a JSON endpoint being called and a JSON not being returned,
// chances are it's not from the exPENsion game API, i.e. Heroku is experiencing
// a (hopefully) momentary blip, i.e. the request should be tried again.
const jsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (e) {
    return undefined;
  }
};

// Have the client download a list of files of given URLs and filenames to download them as
// https://github.com/robertdiers/js-multi-file-download/blob/master/src/main/resources/static/multidownload.js
const downloadFiles = (files) => {
  const downloadNext = (i) => {
    if (i >= files.length) return;
    const file = files[i];
    const a = document.createElement('a');
    a.href = file.url;
    a.target = '_parent';
    if ('download' in a) a.download = file.filename;
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => downloadNext(i + 1), 500);
  };
  downloadNext(0);
};

// Wait for the game of the specified code to be in the specified state
// (game has been started, scribble has been submitted, exPENsion has been submitted)
// https://stackoverflow.com/questions/45008330/how-can-i-use-fetch-in-while-loop
const gameHavingState = async (code, state) => {
  const response = await fetch(`/getGame?code=${code}`, {
    method: 'get',
    headers: {
      Accept: 'application/json',
    },
  });
  const jsonResponse = await jsonSafe(response) || {};

  // If the game is at the desired state, return the game's state and its other info
  if (jsonResponse && response.status === 200 && jsonResponse.state === state) {
    return jsonResponse;
  }

  // Otherwise, try again after one second
  // https://stackoverflow.com/questions/24928846/get-return-value-from-settimeout
  return new Promise((resolve) => {
    setTimeout(() => resolve(gameHavingState(code, state)), 1000);
  });
};

const startRound = async (code, round, player1Scribbles, iAmPlayer1) => {
  // Reset the "done" screen to display the final scribble and not yet be ready for the next round
  els.finalScribble.classList.remove('finalDrawingActive');
  els.finalExpension.classList.add('finalDrawingActive');
  els.finalScribbleOrExpension.checked = true;
  els.playAgainCheckbox.checked = false;

  // Regardless of whether I do the scribble or not, the "waiting" and "drawing" screen
  // each have their own message for when the game is in the "waiting for scribble" state
  els.whyAmIWaiting.innerHTML = 'Waiting for the other player to make a scribble...';
  els.whatAmIDrawing.innerHTML = 'Make a scribble!';
  drawingBoard.clear();

  // If Player 1 scribbles and I am Player 1, then I scribble.
  // If Player 1 *doesn't* scribble (meaning Player 2 scribbles),
  // and I am *not* Player 1 (meaning I am Player 2), then I scribble.
  // Otherwise I don't scribble.
  // I scribble if and only if the player who I am is the player who scribbles.
  const iScribble = player1Scribbles === iAmPlayer1;

  // Behavior of the "submit drawing" button needs to be declared within the round's function,
  // because the request URL changes depending on variables scoped to the round's function
  // (game code, current round, and whether the scribble or the exPENsion is being submitted)
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

    // If I submitted the scribble, I need to wait for the other player
    // to submit the exPENsion before proceeding on to the "done" screen
    if (iScribble) {
      els.whyAmIWaiting.innerHTML = 'Waiting for the other player to make an exPENsion of your scribble...';
      setScreen('waiting');
      await gameHavingState(code, 3);
    }

    // Display the round's scribble and exPENsion on the "done" screen,
    // and allow the user to download them both at once
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

    // Move to the finalized "done" screen and wait for both players to be ready for the next round
    const nextRound = await gameHavingState(code, 1);
    startRound(code, nextRound.round, nextRound.player1Scribbles, iAmPlayer1);
  };

  // Update whether or not I am ready to play again when I say so by toggling the checkbox
  els.playAgainCheckbox.onclick = (e) => {
    fetch(`/readyForNextRound?code=${code}&ready=${e.target.checked ? 'yes' : 'no'}&player=${iAmPlayer1 ? 'player1' : 'player2'}`, {
      method: 'post',
    });
  };

  setScreen(iScribble ? 'drawing' : 'waiting');

  // If the other player scribbles, wait for them to submit
  if (!iScribble) {
    await gameHavingState(code, 2);
    // Paste their drawing onto the drawing board so I can make an exPENsion of it
    await drawingBoard.drawImage(`/getDrawing?code=${code}&round=${round}&which=scribble`);
    els.whatAmIDrawing.innerHTML = 'It\'s exPENsion time! Turn this scribble into a coherent drawing!';
    setScreen('drawing');
  } // Otherwise the game state changes when the scribble is submitted
};

const init = () => {
  // List of screens that will be seen during gameplay (entering game code, drawing, waiting, etc.)
  screens = elementDictionary([
    'start',
    'displayCode',
    'inputCode',
    'waiting',
    'drawing',
    'done',
    'noCanvas',
  ], (e) => `${e}Screen`);

  // List of elements that will be interfaced with
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

  // setScreen('done'); // Uncomment this line to debug a specific screen

  // Don't bother starting the game if canvas is not supported (see module for further explanation)
  if (!drawingBoard.init()) {
    setScreen('noCanvas');
  }

  const requestNewGame = async () => {
    // Avoid asking for more than one new game code at once
    els.newGameButton.disabled = true;

    const response = await fetch('/newGame', {
      method: 'post',
      headers: {
        Accept: 'application/json',
      },
    });
    const jsonResponse = await jsonSafe(response);
    // If a JSON is not returned, try again
    if (!jsonResponse) {
      requestNewGame();
      return;
    }

    // Game has been successfully created
    if (response.status === 201) {
      // Display the game's code
      const { code } = jsonResponse;
      els.codeDisplay.innerHTML = code;
      setScreen('displayCode');

      // Wait for the other player to join
      const { player1Scribbles } = await gameHavingState(code, 1);
      // Player 1 is the player who started the game for Player 2 to join
      startRound(code, 0, player1Scribbles, true);
    } else { // If not, show what went wrong
      els.newGameError.innerHTML = jsonResponse.message;
    }

    els.newGameButton.disabled = false;
  };
  els.newGameButton.onclick = requestNewGame;

  els.joinGameButton.onclick = () => setScreen('inputCode');

  const submitJoinCode = async () => {
    // Avoid trying to join more than one game at once (or the same one more than once)
    els.submitJoinCodeButton.disabled = true;
    els.codeInput.disabled = true;
    // User input is only *displayed* as forced uppercase,
    // so the actual value string needs to be translated a such
    const code = els.codeInput.value.toUpperCase();
    // Validate code client-side before sending, just to ensure the request is "sanitized"
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
    // If a JSON is not returned, try again
    if (!jsonResponse) {
      submitJoinCode();
      return;
    }
    // Game joined successfully
    if (response.status === 200) {
      // Start the game
      const { player1Scribbles } = jsonResponse;
      // Player 2 is the player who joined the game that Player 1 started
      startRound(code, 0, player1Scribbles, false);
    } else { // If not, show what went wrong
      els.submitJoinCodeButton.disabled = false;
      els.codeInput.disabled = false;
      els.joinError.innerHTML = jsonResponse.message;
    }
  };
  els.submitJoinCodeButton.onclick = submitJoinCode;
  // https://stackoverflow.com/questions/11365632/how-to-detect-when-the-user-presses-enter-in-an-input-field
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
