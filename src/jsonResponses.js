const respond = (request, response, status, responseJSON) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
  });
  if (responseJSON) response.write(JSON.stringify(responseJSON));
  response.end();
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
  notFound,
};
