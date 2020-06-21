var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");
var radius = 25;

window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    draw_circles(); // Ensure circles don't disappear
};
window.onresize();


window.onmousedown = (event) => {
    if (circle_exists(event, environment.nodes)) {
        console.log('exists');
    }
    else {
        environment.addNode(new Node({'x' : event.clientX, 'y' : event.clientY}));
        draw_circles(); // Show all circles
    }
};

window.onmouseup = (event) => {

};

function circle_exists(event, circles) {
    for (var circle of circles) {
        var x = circle.obj.x - event.clientX;
        var y = circle.obj.y - event.clientY;
        if (Math.hypot(x,y) <= radius) {
            return true;
        }
    }
    return false;
}


function draw_circles() {
    for (var node of environment.nodes) {
        context.beginPath();
        context.arc(node.obj.x, node.obj.y, radius, 0, 2 * Math.PI);
        context.fillStyle = "red";
        context.fill();
    }
}

