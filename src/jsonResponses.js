const gameCode = require('./gameCode.js');

const games = {};

const respond = (request, response, status, responseData, isPNG) => {
  response.writeHead(status, {
    'Content-Type': isPNG ? 'image/png' : 'application/json',
  });
  if (responseData) response.write(isPNG ? responseData : JSON.stringify(responseData));
  response.end();
};

// https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
const loadData = (request) => new Promise((resolve) => {
  const body = [];
  request.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    resolve(Buffer.concat(body).toString());
  });
});

// https://stackoverflow.com/questions/11335460/how-do-i-parse-a-data-url-in-node
const dataUrlToBuffer = (url) => {
  const matches = url.match(/^data:.+\/(.+);base64,(.*)$/);
  if (!matches) return null;
  const data = matches[2];
  return Buffer.from(data, 'base64');
};

const newGame = (request, response) => {
  const newCode = gameCode.makeNewCode(games);

  games[newCode] = {
    state: 0,
    readyForNextRound: {
      player1: false,
      player2: false,
    },
    round: 0,
    drawingRound: [],
  };

  const responseJSON = {
    code: newCode,
  };

  return respond(request, response, 201, responseJSON);
};

const joinGame = (request, response, query) => {
  const { code } = query;

  const codeError = gameCode.validateCode(code, games, true);
  if (codeError) return respond(request, response, 400, codeError);

  games[code].state = 1;
  const player1Scribbles = Math.random() < 0.5;
  const responseJSON = { player1Scribbles };
  games[code].player1Scribbles = player1Scribbles;
  return respond(request, response, 200, responseJSON);
};

const getGame = (request, response, query) => {
  const { code } = query;

  const codeError = gameCode.validateCode(code, games);
  if (codeError) return respond(request, response, 400, codeError);

  // Be sure not to send several big PNG data blocks
  // every time the client asks for a secondly update
  // https://somethingididnotknow.wordpress.com/2016/12/09/copy-all-but-some-properties-of-an-object-in-es6/
  const gameNoImages = { ...games[code], drawingRound: undefined };
  return respond(request, response, 200, gameNoImages);
};

const submitDrawing = async (request, response, query) => {
  const { code, which } = query;
  const round = Number.parseInt(query.round, 10);
  const codeError = gameCode.validateCode(code, games);
  if (codeError) return respond(request, response, 400, codeError);
  if (!(round >= 0 && (which === 'scribble' || which === 'expension'))) {
    return respond(request, response, 400, {
      message: 'Parameters should be "code" as a valid game code, "round" as a nonnegative integer, and "which" as either "scribble" or "expension".',
      id: 'badSubmitDrawingParameters',
    });
  }
  const game = games[code];
  const gameRound = game.round;
  if (gameRound < round) {
    return respond(request, response, 400, {
      message: 'That game has not started that round yet.',
      id: 'roundNotStartedYet',
    });
  }
  if (round < gameRound) {
    return respond(request, response, 400, {
      message: 'That game has already finished that round.',
      id: 'roundAlreadyFinished',
    });
  }
  if (!game.drawingRound[round]) game.drawingRound[round] = {};
  if (game.drawingRound[round][which]) {
    const isScribble = which === 'scribble';
    return respond(request, response, 400, {
      message: `The ${isScribble ? 'scribble' : 'exPENsion'} for that round of that game has already been submitted.`,
      id: `${isScribble ? 'scribble' : 'expension'}AlreadySubmitted`,
    });
  }
  if (game.state === 1 && which === 'expension') {
    return respond(request, response, 400, {
      message: 'That round of that game has not yet received a scribble, so it cannot receive an exPENsion.',
      id: 'expensionSubmittedBeforeScribble',
    });
  }

  const url = await loadData(request);
  game.drawingRound[round][which] = dataUrlToBuffer(url);
  if (!game.drawingRound[round][which]) {
    return respond(request, response, 400, {
      message: 'Please submit a drawing as a base64 data URI in the POST request body.',
      id: 'noDrawingSubmitted',
    });
  }
  games[code].state++;
  return respond(request, response, 204);
};

const getDrawing = (request, response, query) => {
  const { code, which } = query;
  const round = Number.parseInt(query.round, 10);
  const codeError = gameCode.validateCode(code, games);
  if (codeError) return respond(request, response, 400, codeError);
  if (!(round >= 0 && (which === 'scribble' || which === 'expension'))) {
    return respond(request, response, 400, {
      message: 'Parameters should be "code" as a valid game code, "round" as a nonnegative integer, and "which" as either "scribble" or "expension".',
      id: 'badSubmitDrawingParameters',
    });
  }
  const game = games[code];
  if (game.round < round) {
    return respond(request, response, 400, {
      message: 'That game has not started that round yet.',
      id: 'roundNotStartedYet',
    });
  }
  if (!game.drawingRound[round]) game.drawingRound[round] = {};
  if (!game.drawingRound[round][which]) {
    const isScribble = which === 'scribble';
    return respond(request, response, 400, {
      message: `The ${isScribble ? 'scribble' : 'exPENsion'} for that round of that game has not been submitted yet.`,
      id: `${isScribble ? 'scribble' : 'expension'}NotYetSubmitted`,
    });
  }

  return respond(request, response, 200, game.drawingRound[round][which], true);
};

const readyForNextRound = (request, response, query) => {
  const { code, ready, player } = query;
  const codeError = gameCode.validateCode(code, games);
  if (codeError) {
    return respond(request, response, 400, codeError);
  }
  if ((ready !== 'yes' && ready !== 'no') || (player !== 'player1' && player !== 'player2')) {
    return respond(request, response, 400, {
      message: 'Parameters should be "code" as a valid game code, "ready" as either "yes" or "no", and "player" as either "player1" or "player2".',
      id: 'badNextRoundParameters',
    });
  }

  const game = games[code];
  if (game.state !== 3) {
    return respond(request, response, 400, {
      message: 'That game has a round in progress and is not awaiting approval for the next one.',
      id: 'notWaitingForNextRound',
    });
  }
  const whoIsReady = game.readyForNextRound;
  whoIsReady[player] = ready === 'yes';
  // When both players are ready, start the next round
  if (whoIsReady.player1 && whoIsReady.player2) {
    whoIsReady.player1 = false;
    whoIsReady.player2 = false;
    game.state = 1;
    game.player1Scribbles = Math.random() < 0.5;
    game.round++;
  }
  return respond(request, response, 204);
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
  getGame,
  submitDrawing,
  getDrawing,
  readyForNextRound,
  notFound,
};
