// Capital alphanumeric, ignore: I, O, Z, S
const validCodeChars = '0123456789QWERTYUPADFGHJKLXCVBNM';
const validCodeCharCount = validCodeChars.length;
// 3-character game codes
const validCodeLength = 3;

const games = {};

const respond = (request, response, status, responseJSON) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
  });
  if (responseJSON) response.write(JSON.stringify(responseJSON));
  response.end();
};

const newGame = (request, response) => {
  let newGameCode;
  do {
    newGameCode = '';
    for (let i = 0; i < validCodeLength; i++) {
      newGameCode += validCodeChars[Math.floor(Math.random() * validCodeCharCount)];
    }
  } while (games[newGameCode]); // Extremely unlikely, but ensure no existing games are overwritten

  games[newGameCode] = {
    state: 0,
  };

  const responseJSON = {
    code: newGameCode,
  };

  return respond(request, response, 201, responseJSON);
};

const joinGame = (request, response, query) => {
  let responseJSON;
  const { code } = query;
  const codeLength = code.length;

  if (!code) {
    responseJSON = {
      message: 'No game code specified.',
      id: 'joinWithoutGameCode',
    };
    return respond(request, response, 400, responseJSON);
  }

  let gameCodeInvalid = false;
  if (codeLength !== validCodeLength) gameCodeInvalid = true;
  for (let i = 0; i < codeLength; i++) {
    const codeChar = code[i];
    if (!validCodeChars.includes(codeChar)) {
      gameCodeInvalid = true;
    }
  }
  if (gameCodeInvalid) {
    responseJSON = {
      message: 'Invalid game code.',
      id: 'invalidGameCode',
    };
    return respond(request, response, 400, responseJSON);
  }

  if (!games[code]) {
    responseJSON = {
      message: 'No game with this code has been created.',
      id: 'noGameWithCode',
    };
    return respond(request, response, 400, responseJSON);
  }
  if (games[code].state !== 0) {
    responseJSON = {
      message: 'That game is already in progress.',
      id: 'gameAlreadyInProgress',
    };
    return respond(request, response, 400, responseJSON);
  }

  games[code].state = 1;
  const player1Scribbles = Math.random() < 0.5;
  responseJSON = { player1Scribbles };
  games[code].player1Scribbles = player1Scribbles;
  return respond(request, response, 200, responseJSON);
};

const notFound = (request, response) => {
  let responseJSON;
  if (request.method !== 'HEAD') {
    responseJSON = {
      message: 'The page you are looking for was not found.',
      id: 'notFound',
    };
  }

  return respond(request, response, 404, responseJSON);
};

module.exports = {
  newGame,
  joinGame,
  notFound,
};
