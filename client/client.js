let iAmPlayer1;
let iScribble;
let code;
let player1Scribbles;

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
  const newGameButton = document.querySelector('#newGameButton');
  const codeDisplay = document.querySelector('#codeDisplay');
  const codeInput = document.querySelector('#codeInput');
  const joinGameButton = document.querySelector('#joinGameButton');
  const joinResultDisplay = document.querySelector('#joinResultDisplay');

  newGameButton.onclick = async () => {
    const response = await fetch('/newGame', {
      method: 'post',
      headers: {
        Accept: 'application/json',
      },
    });
    const jsonResponse = await response.json();
    if (response.status === 201) {
      iAmPlayer1 = true;
      code = jsonResponse.code;
      codeDisplay.innerHTML = `Tell Player 2 to join with code: ${code}`;
      ({ player1Scribbles } = await gameHavingState(1));
      iScribble = player1Scribbles;
      codeDisplay.innerHTML = `Player 2 has joined! ${iScribble ? 'Make a scribble!' : 'Wait for the other player to make a scribble.'}`;
      // Gameplay code continues here...
    } else {
      codeDisplay.innerHTML = jsonResponse.message;
    }
  };

  joinGameButton.onclick = async () => {
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
      iAmPlayer1 = false;
      ({ player1Scribbles } = jsonResponse);
      iScribble = !player1Scribbles;
      joinResultDisplay.innerHTML = `Game joined! ${iScribble ? 'Make a scribble!' : 'Wait for the other player to make a scribble.'}`;
      // Gameplay code continues here...
    } else {
      joinResultDisplay.innerHTML = jsonResponse.message;
    }
  };
};

window.onload = init;
