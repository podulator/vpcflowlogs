const output = document.querySelector('.output');

const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://localhost:3000`);

ws.onmessage = handleMessage;

function handleMessage(event) {
  append(event.data);
}

function append(text) {
  const div = document.createElement('div');
  const content = document.createTextNode(text);

  div.appendChild(content);
  output.appendChild(div);
}