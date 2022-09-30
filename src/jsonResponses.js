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
// https://nodejs.dev/en/learn/get-http-request-body-data-using-nodejs/
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
  const data = matches[2];
  return Buffer.from(data, 'base64');
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

const getGame = (request, response, query) => {
  const { code } = query;

  const codeError = gameCode.validateCode(code, games);
  if (codeError) {
    return respond(request, response, 400, codeError);
  }

  // Be sure not to send a big PNG data block every time the client asks for a secondly update
  // https://somethingididnotknow.wordpress.com/2016/12/09/copy-all-but-some-properties-of-an-object-in-es6/
  const gameNoImages = { ...games[code], drawing: undefined };
  return respond(request, response, 200, gameNoImages);
};

const submitDrawing = async (request, response, query) => {
  const { code } = query;

  const codeError = gameCode.validateCode(code, games);
  if (codeError) {
    return respond(request, response, 400, codeError);
  }

  // TO-DO: Give error if drawing submitted at wrong state?
  const url = await loadData(request);
  games[code].drawing = dataUrlToBuffer(url);
  games[code].state++;
  return respond(request, response, 204);
};

const getDrawing = (request, response, query) => {
  const { code } = query;

  const codeError = gameCode.validateCode(code, games);
  if (codeError) {
    return respond(request, response, 400, codeError);
  }

  return respond(request, response, 200, games[code].drawing, true);
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
  notFound,
};
