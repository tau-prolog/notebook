var http = require('http');
var url = require('url');
var fs = require('fs');
var pl = require('tau-prolog');
var WebSocketServer = require('websocket').server;

var files = {
    '/': {type: 'text/html', content: fs.readFileSync('./client/index.html')}
};

var http_server = http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    var file = files[q.pathname];
    if(!file) {
        res.writeHead(404);
        res.write('No encontrado');
        res.end();
        return;
    }
    res.writeHead(200, {'Content-Type': file.type});
    res.write(file.content);
    res.end();
}).listen(8080, '127.0.0.1');




var ws_server = new WebSocketServer({
    httpServer: http_server
});

ws_server.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    var session = pl.create();

    connection.on('message', function(message) {
        if(message.type !== 'utf8') {
            connection.close();
            return;
        }
        var data = JSON.parse(message.utf8Data);
        connection.send(JSON.stringify({
            type: data.type,
            id: data.id,
            content: 'reponse'
        }));
    });

    connection.on('close', function(connection) {

    });
});