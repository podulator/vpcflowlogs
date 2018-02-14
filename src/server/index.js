const path = require('path');
const { promisify } = require('util');
const { createServer } = require('http');
const express = require('express');
const serveStatic = require('serve-static');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const ConnectionManager = require('./ConnectionManager')

const port = 3000;
const projectRoot = path.resolve(__dirname, '../../');

(async function main() {
  try {
    const server = createServer();
    const app = express();
    const connectionManager = new ConnectionManager(server);

    server.on('request', app);

    app.use('/', serveStatic(path.join(projectRoot, 'public')));
    app.use(createWebpackDevMiddleware());

    await promisify(server.listen.bind(server))(port);

    console.log(`App listening on port ${port}`);
  } catch (err) {
    console.error(err);
  }
})();

function createWebpackDevMiddleware() {
  const webpackConfig = {
    devtool: 'eval-source-map',
    entry: path.join(projectRoot, '/src/client'),
    output: {
      publicPath: '/',
    }
  };

  const serverOptions = {
    hot: false,
    lazy: false,
    https: false,
    publicPath: '/',
    stats: 'errors-only',
  };

  const compiler = webpack(webpackConfig);

  return webpackDevMiddleware(compiler, serverOptions);
}


