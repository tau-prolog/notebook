var ws = new WebSocket("ws://localhost:8080");

function consult(id, content) {
    document.getElementById("block-results-" + id).innerHTML = "";
    ws.send(JSON.stringify({
        type: "consult",
        id: id,
        content: content
    }));
}

function query(id, content) {
    document.getElementById("block-results-" + id).innerHTML = "";
    ws.send(JSON.stringify({
        type: "query",
        id: id,
        content: content
    }));
}

function answer(id) {
    ws.send(JSON.stringify({
        type: "answer",
        id: id,
        content: ""
    }));
}

ws.onopen = function() {
    console.log('Connected');
};

ws.onmessage = function(message) {
    var data = JSON.parse(message.data);
    var result = document.getElementById("block-results-" + data.id);
    result.innerHTML += "<div class=\"block-result\">" + data.content + "</div>";
};

ws.onerror = function(data) {
    console.error('Error', data);
};

ws.onclose = function() {
    console.error("No server");
};