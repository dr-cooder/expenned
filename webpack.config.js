const path = require('path');

module.exports = {
  entry: './client/client.js',
  mode: 'production',
  watchOptions: {
    aggregateTimeout: 200,
  },
  output: {
    path: path.resolve(__dirname, 'hosted'),
    filename: 'bundle.js',
  },
};
