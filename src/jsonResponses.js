const gameCode = require('./gameCode.js');

const games = {};

const respond = (request, response, status, responseJSON) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
  });
  if (responseJSON) response.write(JSON.stringify(responseJSON));
  response.end();
};

const newGame = (request, response) => {
  const newCode = gameCode.makeNewCode(games);

  games[newCode] = {
    state: 0,
  };

  const responseJSON = {
    code: newCode,
  };

  return respond(request, response, 201, responseJSON);
};

const joinGame = (request, response, query) => {
  const { code } = query;

  const codeError = gameCode.validateCode(code, games, true);
  if (codeError) {
    return respond(request, response, 400, codeError);
  }

  games[code].state = 1;
  const player1Scribbles = Math.random() < 0.5;
  const responseJSON = { player1Scribbles };
  games[code].player1Scribbles = player1Scribbles;
  return respond(request, response, 200, responseJSON);
};

// const getGameState

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
