// CANVAS ELEMENTS
var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

// DRAWING SPECS
var radius = 25;

// MOUSE / KEY EVENT HANDLING VARS

var mouse_down = false;
var node_pressed = null;
function dragging() { return mouse_down && node_pressed != null; }
function special(event) { return event.shiftKey || event.metaKey || event.ctrlKey || event.altKey; }


// HANDLE RESIZE

window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    draw_graph(); // Ensure graph doesn't disappear
};
window.onresize();


// MOUSE EVENTS

window.onmousedown = (event) => {
    var existing_node = node_exists(event, environment.nodes);
    if (existing_node) {
        mouse_down = true;
        node_pressed = existing_node;
    }
    else if (event.metaKey){
        environment.addNode(new Node({'x' : event.clientX, 'y' : event.clientY}));
        draw_graph();
    }
};

window.onmousemove = (event) => {
    if (dragging() && !special(event)) {
        node_pressed.position = {
            x : event.clientX,
            y : event.clientY
        }
        draw_graph();
    }
}

window.onmouseup = (event) => {
    var existing_node = node_exists(event, environment.nodes);
    if (dragging() && existing_node && event.shiftKey) {
        if (!node_pressed.hasChild(existing_node)) {
            console.log('adding edge');
            node_pressed.addChild(existing_node);
        }
        draw_graph();
    }
    mouse_down = false;
    node_pressed = null;
};


// UTILITIES

function node_exists(event, nodes) {
    for (var node of nodes) {
        var x = Math.abs(node.position.x - event.clientX);
        var y = Math.abs(node.position.y - event.clientY);
        if (Math.hypot(x,y) <= radius * 2) {
            return node;
        }
    }
    return null;
}

function draw_graph() {
    // Clear canvas first
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var node of environment.nodes) {
        var children = node.children;
        // var children = environment.nodes; // Complete connected graph
        for (var child of children) {
            draw_line(context, node.position.x, node.position.y,
                      child.position.x, child.position.y)
        }
    }
    var count = 0;
    for (var node of environment.nodes) {
        draw_circle(context, 
            node.position.x, node.position.y,
            radius, count++);
    }

}

function draw_circle(ctx, x, y, r, id, style='pink') {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = style;
    ctx.fill();

    ctx.font = "30px Arial";
    ctx.fillStyle = 'yellow';
    ctx.textAlign = "center";
    ctx.fillText(id.toString(), x, y + r / 3);
}

function draw_line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

