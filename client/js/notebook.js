// WEBSOCKET

var ws = new WebSocket("ws://localhost:8080");

ws.onopen = function() {
    console.log("Connected");
};

ws.onmessage = function(message) {
    var data = JSON.parse(message.data);
    if(data.type === "save") {

    } else {
        var result = document.getElementById("block-results-" + data.id);
        var status = data.status ? "success" : "error";
        var node = document.getElementById("block-result-" + data.execution);
        node.setAttribute("data-result-type", status);
        add_class(node, "block-result-" + status);
        node.innerHTML = "<span class=\"block-result-execution-order\">[" + data.execution + "]</span><span class=\"block-result-content\">" + data.content + "</span></div>";
    }
};

ws.onerror = function(data) {
    console.error('Error', data);
};

ws.onclose = function() {
    console.error("No server");
    var version = document.getElementById("tau-prolog-version");""
    version.innerHTML = "The connection to the server has been lost";
    add_class(version, "noserver");
};

var last_tau_block_id = 0;
var tau_mirrors = {};
var tau_last_selected = -1;
var tau_last_execution = 0;



// EVENTS

// onclick event for selecting blocks
document.addEventListener("click", function() {
    tau_last_selected = -1;
    var selected = document.getElementsByClassName("block-selected");
        for(var i = 0; i < selected.length; i++)
            remove_class(selected[i], "block-selected");
});

// keypress event for creating blocks
document.addEventListener("keypress", function(e) {
    if(tau_last_selected === -1 || !tau_mirrors[tau_last_selected].hasFocus()) {
        var id = tau_last_selected;
        var block = document.getElementById("block-"+id);
        var block_type = block.getAttribute("data-block-type");
        switch(e.key) {
            // add consult block
            case "c":
                add_consult_block({type: "consult", result: [], content: ""});
                break;
            // add query block
            case "q":
                add_query_block({type: "query", result: [], content: ""});
                break;
            // remove block
            case "x":
                block.parentNode.removeChild(elem);
                break;
        }
        if(e.ctrlKey && e.key === "Enter") {
            if(block_type === "consult")
                consult(id, tau_mirrors[id].getValue());
            else if(block_type === "query")
                query(id, tau_mirrors[id].getValue());
        } else if(e.altKey && e.key === "," || e.key === "," || e.key === ";") {
            if(block_type === "query")
                answer(id);
        }
    }
});



// FUNCTIONS

function consult(id, content) {
    document.getElementById("block-results-" + id).innerHTML =
        "<div id=\"block-result-" + (++tau_last_execution) + "\" class=\"block-result\"><span class=\"block-result-execution-order\">[*]</span><span>...</span></div>";
    ws.send(JSON.stringify({
        type: "consult",
        id: id,
        content: content,
        execution: tau_last_execution
    }));
}

function query(id, content) {
    document.getElementById("block-results-" + id).innerHTML =
        "<div id=\"block-result-" + (++tau_last_execution) + "\" class=\"block-result\"><span class=\"block-result-execution-order\">[*]</span><span>...</span></div>";
    ws.send(JSON.stringify({
        type: "query",
        id: id,
        content: content,
        execution: tau_last_execution
    }));
}

function answer(id) {
    var result = document.getElementById("block-results-" + id);
    result.innerHTML += "<div id=\"block-result-" + (++tau_last_execution) + "\" class=\"block-result\"><span class=\"block-result-execution-order\">[*]</span><span>...</span></div>";
    ws.send(JSON.stringify({
        type: "answer",
        id: id,
        content: "",
        execution: tau_last_execution
    }));
}

function save() {
    ws.send(JSON.stringify({
        path: "." + window.location.pathname,
        type: "save",
        content: JSON.stringify(notebook_to_json())
    }));
}

function add_consult_block(data) {
    var html = "";
    var id = ++last_tau_block_id;
    html += "<div id=\"block-" + id + "\" onfocus=\"focus_block(" + id + ");\" tabindex=\"0\" data-block-type=\"consult\" class=\"block\">";
    html += "<div class=\"block-info\"><div class=\"block-type\">" + data.type + "</div></div>";
    html += "<div id=\"block-content-" + id + "\" class=\"block-content block-" + data.type + "\">";
    html += data.content;
    html += "</div>";
    html += "<div class=\"block-actions\">";
    // html += "<input type=\"button\" class=\"block-action-button block-action-consult\" value=\"Consult\" onClick=\"consult(" + id + ", tau_mirrors[" + id + "].getValue());\" />";
    html += "</div>";
    html += "<div id=\"block-results-" + id + "\" class=\"block-results\">";
    for(var j = 0; j < data.result.length; j++) {
        html += "<div data-result-type=\"" + data.result[j].type + "\" class=\"block-result block-result-" + data.result[j].type + "\"><span class=\"block-result-execution-order\">[" + data.result[j].id + "]</span><span class=\"block-result-content\">" + data.result[j].content + "</span></div>";
    }
    html += "</div>";
    html += "</div>";
    add_block(id, data, html);
}

function add_query_block(data) {
    var html = "";
    var id = ++last_tau_block_id;
    html += "<div id=\"block-" + id + "\" onfocus=\"focus_block(" + id + ");\" tabindex=\"0\" data-block-type=\"query\" class=\"block\">";
    html += "<div class=\"block-info\"><div class=\"block-type\">" + data.type + "</div></div>";
    html += "<div id=\"block-content-" + id + "\" class=\"block-content block-" + data.type + "\">";
    html += data.content;
    html += "</div>";
    html += "<div class=\"block-actions\">";
    // html += "<input type=\"button\" class=\"block-action-button block-action-query\" value=\"Query\" onClick=\"query(" + id + ", tau_mirrors[" + id + "].getValue());\" />";
    // html += "<input type=\"button\" class=\"block-action-button block-action-answer\" value=\"Next answer\" onClick=\"answer(" + id + ");\" />";
    html += "</div>";
    html += "<div id=\"block-results-" + id + "\" class=\"block-results\">";
    for(var j = 0; j < data.result.length; j++) {
        html += "<div data-result-type=\"" + data.result[j].type + "\" class=\"block-result block-result-" + data.result[j].type + "\"><span class=\"block-result-execution-order\">[" + data.result[j].id + "]</span><span class=\"block-result-content\">" + data.result[j].content + "</span></div>";
    }
    html += "</div>";
    html += "</div>";
    add_block(id, data, html);
}

function add_block(id, data, html) {
    var container = document.getElementById("notebook-container");
    var div = document.createElement("div");
    div.innerHTML = html;
    container.appendChild(div);
    var content = document.getElementById("block-content-" + id);
    content.innerHTML = "";
    tau_mirrors[id] = new CodeMirror(content, {
        value: data.content,
        lineNumbers: false,
        theme: "tau",
        mode: "prolog",
        tabindex: -1,
        extraKeys: {
            "Ctrl-Enter": function(instance) {
                var block = document.getElementById("block-"+id);
                var block_type = block.getAttribute("data-block-type");
                if(block_type === "consult")
                    consult(id, instance.getValue());
                else if(block_type === "query")
                    query(id, instance.getValue());
                block.focus();
            },
            "Ctrl-,": function(_) {
                var block = document.getElementById("block-"+id);
                var block_type = block.getAttribute("data-block-type");
                if(block_type === "query")
                    answer(id);
            }
        }
    });
    tau_mirrors[id].setSize("100%", "100%");
    var block = document.getElementById("block-" + id);
    block.addEventListener("click", function(e) {
        tau_last_selected = id;
        var selected = document.getElementsByClassName("block-selected");
        for(var i = 0; i < selected.length; i++)
            remove_class(selected[i], "block-selected");
        add_class(block, "block-selected");
        e.stopPropagation();
    });
}

function focus_block(id) {
    tau_last_selected = id;
    var block = document.getElementById("block-"+id);
    var selected = document.getElementsByClassName("block-selected");
    for(var i = 0; i < selected.length; i++)
        remove_class(selected[i], "block-selected");
    add_class(block, "block-selected");
}

function add_class(elem, classname) {
    elem.setAttribute("class", elem.getAttribute("class") + " " + classname);
}

function remove_class(elem, classname) {
    elem.setAttribute("class", elem.getAttribute("class").replace(classname, ""));
}

function notebook_to_json() {
    var object = {};
    object.blocks = [];
    var blocks = document.getElementsByClassName("block");
    for(var i = 0; i < blocks.length; i++) {
        var id = parseInt(blocks[i].getAttribute("id").replace("block-", ""));
        var block_type = blocks[i].getAttribute("data-block-type");
        var content = tau_mirrors[id].getValue();
        var result = [];
        var result_blocks = blocks[i].getElementsByClassName("block-result");
        for(var j = 0; j < result_blocks.length; j++) {
            var execution_order = parseInt(result_blocks[j]
                .getElementsByClassName("block-result-execution-order")[0]
                .innerHTML.replace("[", "").replace("]", ""));
            var result_content = result_blocks[j].getElementsByClassName("block-result-content")[0].innerHTML;
            var result_type = result_blocks[j].getAttribute("data-result-type");
            result.push({
                id: execution_order,
                content: result_content,
                type: result_type
            });
        }
        object.blocks.push({
            id: i+1,
            type: block_type,
            content: content,
            result: result
        });
    }
    return object;
}