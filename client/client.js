let iAmScribbler;

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
    codeDisplay.innerHTML = jsonResponse.code;
  };

  joinGameButton.onclick = async () => {
    const code = codeInput.value.toUpperCase();
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
      iAmScribbler = !player1Scribbles;
      joinResultDisplay.innerHTML = `Game joined! ${player1Scribbles ? 'Wait for the other player to make a scribble.' : 'Make a scribble!'}`;
    } else {
      joinResultDisplay.innerHTML = jsonResponse.message;
    }
  };
};

window.onload = init;
