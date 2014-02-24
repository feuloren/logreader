var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var util = require('util');
var Tail = require('tail').Tail;
var static = require('node-static');

var file = new static.Server('./web', {cache: 6}); //cache en secondes

function handler (req, res) {
    if( req.url == '/') {
        file.serveFile('/index.html', 200, {}, req, res);
    }

    req.addListener('end', function() {
        file.serve(req, res);
    }).resume();
}

app.listen(1337, '0.0.0.0');

function followFile(socket, file) {
    tail = new Tail(file);

    tail.on("line", function(data) {
        socket.emit('line', {file:file, data:data});
    });

    socket.emit('followed', {file: file});
}

io.sockets.on('connection', function (socket) {
    socket.on('follow', function(data) {
        followFile(socket, data.file);
    });
});