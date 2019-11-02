var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var pl = require('tau-prolog');
var WebSocketServer = require('websocket').server;

var files = {
    listing: fs.readFileSync("./client/listing.html"),
    notebook: fs.readFileSync("./client/notebook.html")
};



// HTTP SERVER
var http_server = http.createServer(function(req, res) {
    var q = url.parse(req.url, true);
    var pathname = "." + q.pathname;
    // if file doesn't exist
    try {
        if(!fs.existsSync(pathname)) {
            res.writeHead(404);
            res.write('No encontrado');
            res.end();
            return;
        }
    } catch(err) {
        console.log(err);
        return;
    }
    // if pathname is a directory
    if(fs.lstatSync(pathname).isDirectory()) {
        var ls = fs.readdirSync(pathname).map(file =>
            "<div><a href=\"" + pathname + "/" + file + "\">" + file + "</a></div>").join("");
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(files.listing.toString().replace("($1)", ls));
        res.end();
    // if pathname is a regular file
    } else {
        // if pathname is a Tau Prolog notebook
        if(pathname.substr(-9) === ".tau.json") {
            var data = JSON.parse(fs.readFileSync(pathname));
            var blocks = "";
            for(var i = 0; i < data.blocks.length; i++) {
                var block = data.blocks[i];
                blocks += "<div id=\"block-" + block.id + "\" class=\"block\">";
                blocks += "<div class=\"block-" + block.type + "\">";
                blocks += block.content;
                blocks += "</div>";
                blocks += "</div>";
            }
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write(files.listing.toString().replace("($1)", blocks));
            res.end();
        // if pathname is another file
        } else {
            var extension = path.extname(pathname).substr(1);
            res.writeHead(200, {"Content-Type": "text/" + extension});
            res.write(fs.readFileSync(pathname));
            res.end();
        }
    }
}).listen(8080, '127.0.0.1');



// WEBSOCKET SERVER
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