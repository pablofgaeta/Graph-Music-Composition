/* ##### GLOBAL APP VARIABLES ###### */

// CANVAS ELEMENTS
var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");
var environment = {
    nodes : [],
    addNode : function (node) { this.nodes.push(node); }
}

// DRAWING SPECS
var specs = {
    radius : 25,
    edgeWidth : 8, 
    selectedWidth : 8,
    circleColor : '#fdfd96',
    idColor : 'black',
    idFont : '30px Arial',
    idVertFix : (y, r) => { return y + r / 2.5; }
};
specs.onchange = () => {
    draw_graph();
} 

// MOUSE UI FLOW CONTROL
var mouse_down = false;
var start_node = null;
var last_selected = null;
function dragging() { return mouse_down && start_node; }
function special(event) { return event.shiftKey || event.metaKey || event.ctrlKey || event.altKey; }
function creating_edge(event) { return event.shiftKey || event.altKey; }
function creating_node(event) { return event.metaKey; }
function finishing_edge(event, end_node) { return dragging() && end_node && creating_edge(event) && start_node != end_node;}

/* ##### USER INTERACTION HANDLING ###### */

// MAKE CANVAS FULL SCREEN AND DRAW WHOLE GRAPH
window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    draw_graph(context); // Ensure graph doesn't disappear
};
window.onresize();


// MOUSE EVENTS

window.onmousedown = (event, mouse={x : event.clientX, y : event.clientY}) => {
    var existing_node = node_exists(mouse, environment.nodes);

    // REGISTER SELECTED STARTING NODE
    if (existing_node) {
        mouse_down = true;
        start_node = existing_node;
        last_selected = existing_node;
    }
    // IF IN CREATE MODE, CREATE NEW NODE
    else if (creating_node(event)){
        environment.addNode(new GraphNode(mouse));
        draw_graph(context);
    }
};

window.onmousemove = (event, mouse = {x : event.clientX, y : event.clientY} ) => {
    // IF REGISTERED DRAG
    if (dragging()) {
        // var arr = environment.nodes;
        // var overlaps = node_exists(mouse, arr.splice(arr.indexOf(start_node), 1));
        // MOVE NODE IF NO SPECIAL KEYS PRESSED
        if (!special(event)) {
            start_node.position = mouse;
            draw_graph(context);
        } 
        // DRAW TEMPORARY EDGE LINE IF IN EDGE MODE
        else if (creating_edge(event)) {
            draw_graph(context);
            draw_moving_edge(context, start_node.position, mouse);
        }
    }
}


window.onmouseup = (event, mouse={x : event.clientX, y : event.clientY}) => {
    var existing_node = node_exists(mouse, environment.nodes);

    // IF CONNECTED EDGE TO EDGE, CREATE CONNECTION
    if (finishing_edge(event, existing_node))
        start_node.addChild(existing_node);

    // Ensure Graph state resets to idle state
    mouse_down = false;
    start_node = null;
    draw_graph(context);
};


// UTILITIES

// Return node if coord is contained in an available node
function node_exists(coord, nodes) {
    for (var node of nodes) {
        var x = node.position.x - coord.x;
        var y = node.position.y - coord.y;
        if (Math.hypot(x,y) <= specs.radius * 2) {
            return node;
        }
    }
    return null;
}

// Draw the environment graph
function draw_graph() {
    // Clear canvas first
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each node
    var count = 0;
    for (var node of environment.nodes) {
        draw_node(context, node.position, count++, 
            last_selected && node == last_selected);
    }

    var edge_pairs = {};

    // Draw all edges between nodes
    for (var node of environment.nodes) {
        var children = node.children;
        for (var child of children) {
            // Make sure not to duplicate drawing an edge
            if (!edge_pairs.hasOwnProperty(child.hash() + '->' + node.hash())) {
                draw_edge(context, node.position, child.position);
                edge_pairs[node.hash() + '->' + child.hash()] = true;
            }
            draw_arrow(context, node.position, child.position);
        }
    }
}

function draw_arrow(ctx, coord1, coord2) {
    var chopped_coords = calculate_edge_pair(coord1, coord2);
    var arrow = calculate_arrow_position(chopped_coords[0], chopped_coords[1]);
    draw_line(ctx,
        {x : arrow.x, y : arrow.y},
        {x : arrow.x + 20 * Math.cos(arrow.theta + 1),
         y : arrow.y + 20 * Math.sin(arrow.theta + 1)
        }, specs.edgeWidth / 2);
    draw_line(ctx,
        {x : arrow.x, y : arrow.y},
        {x : arrow.x + 20 * Math.cos(arrow.theta - 1),
         y : arrow.y + 20 * Math.sin(arrow.theta - 1)
        }, specs.edgeWidth / 2);
}

function draw_node(ctx, coord, id, selected) {
    ctx.beginPath();
    ctx.arc(coord.x, coord.y, specs.radius, 0, 2 * Math.PI);
    ctx.fillStyle = specs.circleColor;
    if (selected) { ctx.lineWidth = specs.selectedWidth; ctx.stroke(); }
    ctx.fill();

    ctx.font = specs.idFont;
    ctx.fillStyle = specs.idColor;
    ctx.textAlign = "center";
    ctx.fillText(id.toString(), coord.x, specs.idVertFix(coord.y,specs.radius));
}


function draw_edge(ctx, coord1, coord2) {
    var chopped_coords = calculate_edge_pair(coord1, coord2);
    draw_line(ctx, chopped_coords[0], chopped_coords[1]);
}

function draw_moving_edge(ctx, node_coord, mouse_coord) {
    var chopped_coords = calculate_edge_pair(node_coord, mouse_coord);
    draw_line(ctx, chopped_coords[0], mouse_coord);
}

function draw_line(ctx, coord1, coord2, width=specs.edgeWidth) {
    ctx.beginPath();
    ctx.moveTo(coord1.x, coord1.y);
    ctx.lineTo(coord2.x, coord2.y);
    ctx.lineWidth = width; 
    ctx.stroke();
}

function calculate_arrow_position(coord1, coord2) {
    var x1 = coord1.x; var x2 = coord2.x;
    var y1 = coord1.y; var y2 = coord2.y;

    var length = Math.hypot(x2 - x1, y2 - y1) / 3;

    result = {theta : null, x : null, y : null};

    if (x1 == x2) {
        return {
            theta : Math.PI/2 * (y2 < y1 ? 1 : -1),
            x : x1, 
            y : y1 - length * (y2 < y1 ? 1 : -1)
        };
    }

    result.theta = Math.atan2((y1-y2),(x1 - x2));
    result.x = x1 - length * Math.cos(result.theta);
    result.y = y1 - length * Math.sin(result.theta);
    return result;
}

function calculate_edge_pair(coord1, coord2) {
    var x1 = coord1.x; var x2 = coord2.x;
    var y1 = coord1.y; var y2 = coord2.y;

    var result = [{x : null, y : null}, {x : null, y : null}];
    if (x1 == x2) {
        result[0].x = x1;
        result[0].y = y1 + (y2 > y1 ? specs.radius : -specs.radius);
        result[1].x = x2;
        result[1].y = y2 - (y2 > y1 ? specs.radius : -specs.radius);
    }
    else {
        var theta = Math.atan2((y2-y1) , (x2 - x1));
        result[0].x = x1 + specs.radius * Math.cos(theta);
        result[0].y = y1 + specs.radius * Math.sin(theta);
        result[1].x = x2 - specs.radius * Math.cos(theta);
        result[1].y = y2 - specs.radius * Math.sin(theta);
    }
    return result;
}