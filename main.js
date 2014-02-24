var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var util = require('util');
var Tail = require('tail').Tail;
var static = require('node-static');

var file = new static.Server('./web', {cache: 6}); //cache en secondes

var loadNbLines = 10;

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
    try {
        tail = new Tail(file);
    } catch (err) {
        socket.emit('cant follow', {reason: err.code, file: file});
        return;
    }
    fs.readFile(file, {encoding: "utf-8"}, function(err, data) {
        parts = data.split("\n");
        len = parts.length;
        if (len <= loadNbLines)
            start = 0;
        else
            start = len - loadNbLines - 1;
        for (i = start; i < len; i++) {
            socket.emit('line', {file:file, data:parts[i]});
        }
    });

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