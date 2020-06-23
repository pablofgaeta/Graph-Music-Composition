class GraphNode {
    constructor(position, parents=[], children=[]) {
        this.position = position;
        this.parents = parents;
        this.children = children;
        this.selected = false;
    }

    add_parent(node) {
        if (node instanceof GraphNode) {
            this.parents.push(node);
        }
        else {
            throw "Must be instance of \'Node\' Class";
        }
    }

    add_child(node) {
        if (node instanceof GraphNode) {
            if (!this.has_child(node)) this.children.push(node);
        }
        else {
            throw "Must be instance of \'Node\' Class";
        }
    }

    has_child(node) {
        return this.children.includes(node);
    }

    is_hovering(coord, radius) {
        var x = this.position.x - coord.x;
        var y = this.position.y - coord.y;
        return Math.hypot(x,y) <= radius;
    }

    // At any given moment, every node should have different x,y coordinate
    // So the x,y positions work as a unique hash
    hash() {
        return this.position.x.toString() + this.position.y.toString();
    }
}

class Graph {
    constructor() {
        this.nodes = [];
        this.last_selected = null;
        this.nodehash = {};

        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        this.canvas.id = 'App';
        this.context = this.canvas.getContext("2d");

        this.specs = {
            background : '#fdfd96',
            canvasWidth : window.innerWidth,
            canvasHeight : window.innerHeight,
            radius : 25,
            edgeWidth : 8, 
            arrowLength : 20,
            selectedWidth : 8,
            circleColor : '#96a2fd',
            idColor : '#ffffff',
            idFontSize : 30,
            idFont : 'Arial'
        }

        this.set_canvas();
    }

    set_canvas() {
        this.canvas.style.background = this.specs.background;
        this.canvas.width  = this.specs.canvasWidth.toString();
        this.canvas.height = this.specs.canvasHeight.toString();
        this.draw_graph();
    }


    add_node(node) {
        this.nodes.push(node);
    }

    /**
     *  Returns the first node that contains the given coordinate
     *  Return null if no nodes contain 'coord'
     *  @param {*}         coord - {x : Number, y : Number} coordinate to compare
     *  @param {GraphNode} node  - {GraphNode} Optionally specify single node to ignore
     */ 
    hovering(coord, scale=2, ignore_node=null) {
        for (var node of this.nodes) {
            if (node == ignore_node) continue;
            if (node.is_hovering(coord, this.specs.radius * scale)) {
                return node;
            }
        }
        return null;
    }

    // Draw the environment graph
    draw_graph() {
        // Clear canvas first
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.nodehash = {};

        // Draw each node
        var count = 0;
        for (var node of this.nodes) {
            this.draw_node(node, count++);
            this.nodehash[node.hash()] = node;
        }

        var edge_pairs = {};

        // Draw all edges between nodes
        for (var node of this.nodes) {
            for (var child of node.children) {
                // Make sure not to duplicate drawing an edge
                if (!edge_pairs.hasOwnProperty(child.hash() + '->' + node.hash())) {
                    this.draw_edge(node.position, child.position);
                    edge_pairs[node.hash() + '->' + child.hash()] = true;
                }
                this.draw_arrow(node.position, child.position);
            }
        }
    }

    draw_arrow(coord1, coord2) {
        var points = this.calculate_arrows(coord1, coord2);
        this.draw_line(points.start, points.ends[0], this.specs.edgeWidth / 2);
        this.draw_line(points.start, points.ends[1], this.specs.edgeWidth / 2);
    }

    draw_node(node, id) {
        var x = node.position.x; 
        var y = node.position.y;

        this.context.beginPath();
        this.context.arc(x, y, this.specs.radius, 0, 2 * Math.PI);
        this.context.fillStyle = this.specs.circleColor;
        if (node.selected) {
            this.context.lineWidth = this.specs.selectedWidth; 
            this.context.stroke();
        }
        this.context.fill();
    
        this.context.font = this.specs.idFontSize + 'px ' + this.specs.idFont;
        this.context.fillStyle = this.specs.idColor;
        this.context.textAlign = "center";
        this.context.fillText(id.toString(), x, y + this.specs.idFontSize / 3);
    }

    draw_edge(coord1, coord2) {
        var chopped_coords = this.calculate_edge_pair(coord1, coord2);
        this.draw_line(chopped_coords[0], chopped_coords[1]);
    }
    
    draw_moving_edge(node_coord, mouse_coord) {
        var chopped_coords = this.calculate_edge_pair(node_coord, mouse_coord);
        this.draw_line(chopped_coords[0], mouse_coord);
    }
    
    draw_line(coord1, coord2, width=this.specs.edgeWidth) {
        this.context.beginPath();
        this.context.moveTo(coord1.x, coord1.y);
        this.context.lineTo(coord2.x, coord2.y);
        this.context.lineWidth = width; 
        this.context.stroke();
    }

    clear_selections() {
        for (var node of this.nodes) {
            node.selected = false;
        }
    }

    draw_rect(coord1, coord2, width=this.specs.edgeWidth/3) {
        var tleft = {
            x : Math.min(coord1.x, coord2.x),
            y : Math.min(coord1.y, coord2.y)
        }
        var bright = {
            x : Math.max(coord1.x, coord2.x),
            y : Math.max(coord1.y, coord2.y)
        }

        this.draw_line(tleft, { x : bright.x, y : tleft.y },width);
        this.draw_line({ x : bright.x, y : tleft.y }, bright,width);
        this.draw_line(bright, { x : tleft.x, y : bright.y },width);
        this.draw_line({ x : tleft.x, y : bright.y }, tleft,width);
    }

    select_in_rect(coord1, coord2) {
        var tleft = {
            x : Math.min(coord1.x, coord2.x),
            y : Math.min(coord1.y, coord2.y)
        }
        var bright = {
            x : Math.max(coord1.x, coord2.x),
            y : Math.max(coord1.y, coord2.y)
        }

        for (var node of this.nodes) {
            var pos = node.position;
            if (pos.x >= tleft.x && pos.x <= bright.x &&
                pos.y >= tleft.y && pos.y <= bright.y) {
                    node.selected = true;
            }
        }
    }

    march_towards(coord1, coord2) {
        var chopped_coords = this.calculate_edge_pair(coord1, coord2);
        var theta = chopped_coords[2];

        var prev_coord = {
            x : chopped_coords[0].x - 0.01 * Math.cos(theta),
            y : chopped_coords[0].y - 0.01 * Math.sin(theta)
        };

        var isclose = (c1, c2, tol=0.1) => {
            return Math.abs(c2.x - c1.x) < tol && Math.abs(c2.y - c1.y) < tol;
        }
        
        var count = 0;
        while (count < 0 && !isclose(prev_coord, coord2) && !this.hovering(prev_coord, 1)) {
            var iter_coord = {
                x : prev_coord.x - 0.01 * Math.cos(theta),
                y : prev_coord.y - 0.01 * Math.sin(theta)
            };
            this.draw_line(prev_coord, iter_coord);
            prev_coord = iter_coord;
            ++count;
        }
    }
    
    calculate_arrows(coord1, coord2) {
        var chopped_coords = this.calculate_edge_pair(coord1, coord2);

        var x1 = chopped_coords[0].x; var x2 = chopped_coords[1].x;
        var y1 = chopped_coords[0].y; var y2 = chopped_coords[1].y;
    
        var length = Math.hypot(x2 - x1, y2 - y1) / 3;
    
        var start_point = {theta : null, x : null, y : null};
        start_point.theta = x1 == x2 ? Math.PI / 2 * (y2 < y1 ? 1 : -1) : Math.atan2((y1-y2) , (x1 - x2));
        start_point.x = x1 - length * Math.cos(start_point.theta);
        start_point.y = y1 - length * Math.sin(start_point.theta);

        var end_points = [{ x : start_point.x + this.specs.arrowLength * Math.cos(start_point.theta + Math.PI/4),
                        y : start_point.y + this.specs.arrowLength * Math.sin(start_point.theta + Math.PI/4) },
                      { x : start_point.x + this.specs.arrowLength * Math.cos(start_point.theta - Math.PI/4),
                        y : start_point.y + this.specs.arrowLength * Math.sin(start_point.theta - Math.PI/4) }];
        return {'start' : start_point, 'ends' : end_points};
    }

    calculate_edge_pair(coord1, coord2) {
        var x1 = coord1.x; var x2 = coord2.x;
        var y1 = coord1.y; var y2 = coord2.y;
    
        var theta = x1 == x2 ? Math.PI / 2 * (y2 < y1 ? 1 : -1) : Math.atan2((y1-y2) , (x1 - x2));
        var result = [{x : null, y : null}, {x : null, y : null}, theta];

        result[0].x = x1 - this.specs.radius * Math.cos(theta);
        result[0].y = y1 - this.specs.radius * Math.sin(theta);
        result[1].x = x2 + this.specs.radius * Math.cos(theta);
        result[1].y = y2 + this.specs.radius * Math.sin(theta);
        return result;
    }
};
