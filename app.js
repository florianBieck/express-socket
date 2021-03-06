const WebSocket = require('ws')
const http = require('http')

const express = require('express');

const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

const onoff = require('onoff')
const pin = 26
const button = new onoff.Gpio(pin, 'in', 'both')

wss.on('connection', (socket) => {
  const value = button.readSync()

  socket.on('message', () => {
    socket.send(button.readSync())
  })

  socket.send(value)
})
server.listen(3003, () => {
  console.log(new Date().toISOString() + ': Server gestarted')
})

button.watch(function (err, value) {
  if (err) {
    console.log(new Date().toISOString() + ': Error during Button read', err);
    return;
  }
  if (value) {
    console.log(new Date().toISOString() + ': Button clicked')
    wss.clients.forEach(client => {
      client.send(button.readSync())
    })
  }
});
console.log(new Date().toISOString() + ': Watching Button on GPIO ' + pin)
console.log(new Date().toISOString() + ': Current Button State is ' + button.readSync())

app.get('/state', (req, res) => {
  const value = button.readSync()
  console.log(new Date().toISOString() + ': Button State is ' + value)
  res.send(value)
  wss.clients.forEach(client => {
    client.send(value)
  })
})

process.on('SIGINT', () => {
  button.unexport()
})

module.exports = app;
