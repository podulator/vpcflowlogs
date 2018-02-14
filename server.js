const path = require('path');
const { createServer } = require('http');
const express = require('express');
const { Server: WebSocketServer } = require('ws');
const serveStatic = require('serve-static');


(async function main() {
  try {
    const port = 3000;

    await startServer(port);

    console.log(`App listening on port ${port}`);
  } catch (err) {
    console.error(err);
  }
})();

function startServer(port) {
  const server = createServer();
  const app = express();
  const wss = new WebSocketServer({ server });

  server.on('request', app);
  wss.on('connection', handleSubscriber);

  app.use('/', serveStatic(path.resolve(__dirname, './public')));

  return new Promise((resolve, reject) => {
    server.listen(port, err => {
      if (err) {
        reject(err);
      } else {
        resolve(server);
      }
    });
  });
}

function handleSubscriber(ws) {
  console.log('new subscriber!')

  const intervalId = setInterval(() => {
    try {
      ws.send(JSON.stringify({ time: Date.now() }));
    } catch (err) {
      console.error(err);
    }
  }, 1000);

  ws.on('error', () => console.log('errored'));

  ws.on('close', () => {
    console.log('subscriber disconnected');
    clearInterval(intervalId);
  });

  handleKeepAlive(ws);
}

function handleKeepAlive(ws) {
  // ported from https://github.com/websockets/ws/pull/635
  ws.on('pong', handlePong);
  ws.on('close', remove);

  const keepAliveInterval = 10000;
  const keepAliveTimeout = 2000;

  let keepAliveTimeoutId;
  let keepAliveIntervalId;

  sendPing();

  function sendPing() {
    ws.ping();
    keepAliveTimeoutId = setTimeout(() => ws.close(), keepAliveTimeout);
  }

  function handlePong() {
    clearTimeout(keepAliveTimeoutId);
    keepAliveIntervalId = setTimeout(sendPing, keepAliveInterval);
  }

  function remove() {
    clearTimeout(keepAliveTimeoutId);
    clearTimeout(keepAliveIntervalId);
  }
}
