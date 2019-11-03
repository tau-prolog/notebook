var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var pl = require('tau-prolog');
require('tau-prolog/modules/lists')(pl);
var WebSocketServer = require('websocket').server;

var files = {
    listing: fs.readFileSync("./client/html/listing.html"),
    notebook: fs.readFileSync("./client/html/notebook.html")
};

function json_to_html(data) {
    var blocks = "";
    for(var i = 0; i < data.blocks.length; i++) {
        var block = data.blocks[i];
        blocks += "<div id=\"block-" + block.id + "\" class=\"block\">";
        blocks += "<div class=\"block-info\"><div class=\"block-type\">#" + block.id + " " + block.type + " block</div></div>";
        blocks += "<div id=\"block-content-" + block.id + "\" class=\"block-content block-" + block.type + "\">";
        blocks += block.content;
        blocks += "</div>";
        blocks += "<div class=\"block-actions\">";
        if(block.type === "consult") {
            blocks += "<input type=\"button\" class=\"block-action-button block-action-consult\" value=\"Consult\" onClick=\"consult(" + block.id + ", mirror_" + block.id + ".getValue());\" />";
        } else if(block.type === "query") {
            blocks += "<input type=\"button\" class=\"block-action-button block-action-query\" value=\"Query\" onClick=\"query(" + block.id + ", mirror_" + block.id + ".getValue());\" />";
            blocks += "<input type=\"button\" class=\"block-action-button block-action-answer\" value=\"Answer\" onClick=\"answer(" + block.id + ");\" />";
        }
        blocks += "</div>";
        blocks += "<div id=\"block-results-" + block.id + "\" class=\"block-results\">";
        for(var j = 0; j < block.result.length; j++) {
            blocks += "<div class=\"block-result\">" + block.result[j] + "</div>";
        }
        blocks += "</div>";
        blocks += "</div>";
        blocks += `<script type="text/javascript">
        var block = document.getElementById("block-content-${block.id}");
        var value = block.innerHTML;
        block.innerHTML = "";
        var mirror_${block.id} = CodeMirror(block, {
            value: value,
            lineNumbers: false,
            theme: "tau",
            mode: "prolog"
        });
        mirror_${block.id}.setSize("100%", "100%");
        </script>`;
    }
    return blocks;
}

function html_to_json(data) {

}



// HTTP SERVER
var http_server = http.createServer(function(req, res) {
    var q = url.parse(req.url, true);
    var pathname = q.pathname.substr(1);
    if(pathname === "")
        pathname = ".";
    if(pathname[0] === ":")
        pathname = pathname.substr(1);
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
            "<div>" + (fs.lstatSync(pathname + "/" + file).isDirectory() ?
                "<i class=\"fas fa-folder\"></i>" :
                "<i class=\"far fa-file-alt\"></i>") + 
            " <a href=\"" + pathname + "/" + file + "\">" + file + "</a></div>").join("");
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(files.listing.toString()
            .replace(/\(\$content\)/g, ls)
            .replace(/\(\$dirname\)/g, __dirname));
        res.end();
    // if pathname is a regular file
    } else {
        // if pathname is a Tau Prolog notebook
        if(path.extname(pathname) === ".plnotebook") {
            var data = JSON.parse(fs.readFileSync(pathname));
            var blocks = json_to_html(data);
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write(files.notebook.toString()
                .replace(/\(\$content\)/g, blocks)
                .replace(/\(\$dirname\)/g, __dirname));
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
    var threads = {};

    connection.on('message', function(message) {
        if(message.type !== 'utf8') {
            connection.close();
            return;
        }
        var data = JSON.parse(message.utf8Data);
        if(threads[data.id] === undefined)
            threads[data.id] = new pl.type.Thread(session);
        var thread = threads[data.id];
        var result = "";
        // consult block
        if(data.type === "consult") {
            result = thread.consult(data.content).toString();
            var warnings = thread.get_warnings();
            for(var i = 0; i < warnings.length; i++)
                result += "<br />" + warnings[i];
            // send response
            connection.send(JSON.stringify({
                type: data.type,
                id: data.id,
                content: result
            }));
        } else if(data.type === "query") {
            result = thread.query(data.content).toString();
            var warnings = thread.get_warnings();
            for(var i = 0; i < warnings.length; i++)
                result += "<br />" + warnings[i];
            // send response
            connection.send(JSON.stringify({
                type: data.type,
                id: data.id,
                content: result
            }));
        } else if(data.type === "answer") {
            thread.answer(function(answer) {
                // send response
                connection.send(JSON.stringify({
                    type: data.type,
                    id: data.id,
                    content: pl.format_answer(answer)
                }));
            });
        }
        
    });

    connection.on('close', function(connection) {

    });
});