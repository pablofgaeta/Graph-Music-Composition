class GraphNode {
    constructor(position, parents=[], children=[]) {
        this.position = position;
        this.parents = parents;
        this.children = children;
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

        // Draw each node
        var count = 0;
        for (var node of this.nodes) {
            this.draw_node(node, count++);
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
        if (this.last_selected && node == this.last_selected) {
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
    
    calculate_arrows(coord1, coord2) {
        var chopped_coords = this.calculate_edge_pair(coord1, coord2);

        var x1 = chopped_coords[0].x; var x2 = chopped_coords[1].x;
        var y1 = chopped_coords[0].y; var y2 = chopped_coords[1].y;
    
        var length = Math.hypot(x2 - x1, y2 - y1) / 3;
    
        var start_point = {theta : null, x : null, y : null};
    
        if (x1 == x2) {
            start_point.theta = Math.PI/2 * (y2 < y1 ? 1 : -1);
            start_point.x = x1;
            start_point.y = y1 - length * (y2 < y1 ? 1 : -1);
        }
        else {
            start_point.theta = Math.atan2((y1-y2),(x1 - x2));
            start_point.x = x1 - length * Math.cos(start_point.theta);
            start_point.y = y1 - length * Math.sin(start_point.theta);
        }

        var end_points = [{ x : start_point.x + 20 * Math.cos(start_point.theta + Math.PI/4),
                        y : start_point.y + 20 * Math.sin(start_point.theta + Math.PI/4) },
                      { x : start_point.x + 20 * Math.cos(start_point.theta - Math.PI/4),
                        y : start_point.y + 20 * Math.sin(start_point.theta - Math.PI/4) }];
        return {'start' : start_point, 'ends' : end_points};
    }

    calculate_edge_pair(coord1, coord2) {
        var x1 = coord1.x; var x2 = coord2.x;
        var y1 = coord1.y; var y2 = coord2.y;
    
        var result = [{x : null, y : null}, {x : null, y : null}];

        if (x1 == x2) {
            result[0].x = x1;
            result[0].y = y1 + (y2 > y1 ? this.specs.radius : -this.specs.radius);
            result[1].x = x2;
            result[1].y = y2 - (y2 > y1 ? this.specs.radius : -this.specs.radius);
        }
        else {
            var theta = Math.atan2((y2-y1) , (x2 - x1));
            result[0].x = x1 + this.specs.radius * Math.cos(theta);
            result[0].y = y1 + this.specs.radius * Math.sin(theta);
            result[1].x = x2 - this.specs.radius * Math.cos(theta);
            result[1].y = y2 - this.specs.radius * Math.sin(theta);
        }
        return result;
    }
};
