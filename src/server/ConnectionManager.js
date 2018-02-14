const { Server } = require('ws');

class ConnectionManager {
  constructor(appServer) {
    this.server = new Server({ server: appServer });
    this.clients = new Set();

    this.server.on('connection', client => this.addClient(client));

    setInterval(() => {
      this.sendMessage({ time: Date.now() });
    }, 1000);
  }

  sendMessage(message) {
    for (const client of this.clients) {
      client.send(JSON.stringify(message));
    }
  }

  addClient(client) {
    this.clients.add(client);
    console.log('client added');

    client.on('error', () => {
      this.clients.delete(client);

      console.log('client errored')
    });

    client.on('close', () => {
      this.clients.delete(client);

      console.log('client disconnected');
    });

    handleKeepAlive(client);
  }
}

module.exports = ConnectionManager;

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