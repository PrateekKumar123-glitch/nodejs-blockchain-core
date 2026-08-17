var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res) {
  res.send('Blockchain server is running');
});

http.listen(4000, function() {
  console.log('listening on *:4000');
});
