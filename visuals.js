var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");
var radius = 25;
var dragging = {flag : false, node : null};


window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    draw_graph(); // Ensure circles don't disappear
};
window.onresize();

window.onmousedown = (event) => {
    var existing_circle = circle_exists(event, environment.nodes);
    if (existing_circle) {
        dragging.flag = true;
        dragging.node = existing_circle;
        console.log('exists');
    }
    else if (event.metaKey){
        environment.addNode(new Node({'x' : event.clientX, 'y' : event.clientY}));
        draw_graph(); // Show all circles
    }
};

window.onmouseup = (event) => {
    var existing_circle = circle_exists(event, environment.nodes);
    console.log(existing_circle, dragging);
    if (dragging.flag && dragging.node && existing_circle) {
        dragging.node.addChild(existing_circle);
        draw_graph();
    }
    dragging.flag = false;
    dragging.node = null;
};

function circle_exists(event, circles) {
    for (var circle of circles) {
        var x = circle.obj.x - event.clientX;
        var y = circle.obj.y - event.clientY;
        if (Math.hypot(x,y) <= radius * 2) {
            return circle;
        }
    }
    return null;
}

function draw_graph() {
    for (var node of environment.nodes) {
        context.beginPath();
        context.arc(node.obj.x, node.obj.y, radius, 0, 2 * Math.PI);
        context.fillStyle = "red";
        context.fill();
    }
    for (var node of environment.nodes) {
        for (var child of node.children) {
            context.beginPath();
            context.moveTo(node.obj.x, node.obj.y);
            context.lineTo(child.obj.x, child.obj.y);
            context.stroke();
        }
    }
}

