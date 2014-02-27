var app = require('http').createServer(handler);
var io = require('socket.io').listen(app)
io.set('log level', 1);;
var fs = require('fs');
var util = require('util');
var Tail = require('tail').Tail;
var static = require('node-static');
var stdio = require('stdio');

var ops = stdio.getopt({
    'port': {key: 'p', description: 'Port to listen on', args: 1},
    'http_ip': {key: 'h', description: 'IP to server to', args: 1}
});

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

port = ops.port || 1337;
ip = ops.http_ip || '127.0.0.1'
app.listen(port, ip);
console.log("Serving on %s:%s", ip, port);

function followFile(socket, file) {
    try {
        tail = new Tail(file);
    } catch (err) {
        socket.emit('cant follow', {reason: err.code, file: file});
        return false;
    }

    tail.on("line", function(data) {
        socket.emit('line', {file:file, data:data});
    });

    socket.emit('followed', {file: file});
    return tail;
}

function prevLines(socket, file) {
    try {
        fs.readFile(file, {encoding: "utf-8"}, function(err, data) {
            parts = data.toString("utf-8").split("\n");
            len = parts.length;
            if (len <= loadNbLines)
                start = 0;
            else
                start = len - loadNbLines - 1;
            for (i = start; i < len; i++) {
                socket.emit('line', {file:file, data:parts[i]});
            }
        });
    } catch (err) {
        return;
    }
}

tails = {
    hasTail: function(client, file) {
        return this[client] !== undefined && this[client][file] !== undefined;
    },
    setTail: function(client, file, tail) {
        if (this[client] === undefined) {
            this[client] = {};
        }
        this[client][file] = tail;
    },
    stopTail: function(client, file) {
        if (this.hasTail(client, file)) {
            this[client][file].unwatch();
            delete this[client][file];
            return true;
        } else {
            return false;
        }
    }
}

io.sockets.on('connection', function (socket) {
    socket.on('follow', function(data) {
        if (!tails.hasTail(socket.id, data.file)) {
            tail = followFile(socket, data.file);
            if (tail !== false) {
                tails.setTail(socket.id, data.file, tail);
            }
        }
    });

    socket.on('prevlines', function(data) {
        prevLines(socket, data.file);
    });

    socket.on('stop following', function(data) {
        if (tails.stopTail(socket.id, data.file)) {
            socket.emit('stopped following', {file: data.file});
        }
    });
});