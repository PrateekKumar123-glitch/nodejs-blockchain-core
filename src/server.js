var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.send('Blockchain server is running');
});

io.on('connection', function(socket) {
  socket.on('channel', function(msg) {
    io.emit('channel', msg);
  });
});

var PORT = 4000;
http.listen(PORT, function() {
  console.log('listening on *:' + PORT);
});
