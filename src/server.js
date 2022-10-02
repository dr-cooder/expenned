const http = require('http');
const url = require('url');
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const urlStruct = {
  '/': htmlHandler.getIndex,
  '/style.css': htmlHandler.getCSS,
  '/bundle.js': htmlHandler.getJS,
  '/newGame': jsonHandler.newGame,
  '/joinGame': jsonHandler.joinGame,
  '/getGame': jsonHandler.getGame,
  '/submitDrawing': jsonHandler.submitDrawing,
  '/getDrawing': jsonHandler.getDrawing,
  '/readyForNextRound': jsonHandler.readyForNextRound,
  notFound: jsonHandler.notFound,
};

const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const handlerFunction = urlStruct[parsedUrl.pathname];
  const { query } = parsedUrl;
  console.log(request.method, parsedUrl.path);

  if (handlerFunction) {
    handlerFunction(request, response, query);
  } else {
    urlStruct.notFound(request, response);
  }
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on 127.0.0.1:${port}`);
});
