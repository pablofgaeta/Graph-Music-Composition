var count = 0;

let GraphAudioNode = function(position, id) {
    this.children = [];
    this.position = position;
    this.selected = false;
    this.playingAnimation = false;
    this.id = id;

    this.add_child  = function(node) { 
        if (!this.has_child(node)) {
            this.children.push(node); 
        }
        else console.log("Child Already Exists");
    }
    this.has_child  = function(node) { return this.children.includes(node); }
    this.is_hovering = function(coord, radius) {
        let x = this.position.x - coord.x;
        let y = this.position.y - coord.y;
        return Math.hypot(x,y) <= radius;
    }
    this.select = function() { this.selected = true; }
    this.toggle_selected = function() { this.selected = !this.selected; }
    this.hash = function() { return this.position.x.toString() + this.position.y.toString(); }
    this.trigger = function() {};
};

let GraphSynthNode = function(position, id) {
    GraphAudioNode.call(this, position, id);
    this.instrument = new AudioController.Instrument();
    this.frequency = '440hz';

    this.play = () => this.instrument.play(this.frequency);
    this.random = () => this.instrument.playRandom();
    this.trigger = () => this.random();
};

let GraphSampleNode = function(position, sample, id) {
    GraphAudioNode.call(this, position, id);
    this.sample = sample;
};

let GraphEdge = function(parent, child, delay=500) {
    this.parent = parent;
    this.child = child;
    this.delay = delay;
    this.selected = false;

    this.select = function() { this.selected = true; }
    this.toggle_selected = function() { this.selected = !this.selected; }
    this.hash = (parent_hash = this.parent.id, child_hash = this.child.id) => {
        if (parent_hash != child_hash) return parent_hash + '->' + child_hash;
        else                           throw "Nodes not unique";
    };
    this.reverse_hash = () => {
        return this.hash(this.child.id, this.parent.id);
    };
}

// GraphEdge.rhash = (edge_hash) => edge_hash.replace(/(\d+)->(\d+)/, '$2->$1');


let Graph = function() {
    this.nodes = [];
    this.edges = {};
    this.next_id = 0;

    this.create_node = function(coord) {
        this.nodes.push(new GraphSynthNode(coord, this.next_id++));
    };

    this.create_edge = function(parent, child) {
        let new_edge = new GraphEdge(parent, child);
        parent.add_child(child);

        let eh = new_edge.hash();
        if (!this.edges.hasOwnProperty(eh)) {
            this.edges[eh] = new_edge;
        }
    }

    this.has_selected = function() {
        this.nodes.forEach(node => { if (node.selected) return true; });
        return false;
    };

    this.clear_selections = function() {
        for (let node of this.nodes) {
            node.selected = false;
        }
        for (let edge_hash in this.edges) {
            this.edges[edge_hash].selected = false;
        }
    };

    this.delete_selected = function() {
        let deleted_nodes = [];

        // Remove any nodes first
        for (let i = this.nodes.length - 1; i >= 0; --i) {
            let node = this.nodes[i];
            if (node.selected) {
                // Remove node
                deleted_nodes.push(this.nodes.splice(i, 1)[0]);

                // Clean up lingering references to node
                for (let potential_parent of this.nodes) {
                    let i = potential_parent.children.indexOf(node);
                    if (i != -1) potential_parent.children.splice(i, 1);
                }
            }
        }
        // Remove any selected edges or edges dependent on deleted nodes
        for (let edge_hash in this.edges) {
            let edge = this.edges[edge_hash];
            if (edge.selected || 
                deleted_nodes.includes(edge.parent) || 
                deleted_nodes.includes(edge.child)) {
                    delete this.edges[edge_hash];
            }
        }
    }
};

let GraphController = function() {
    this.graph = new Graph();

    this.canvas = document.createElement('canvas');
    document.body. appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");

    this.specs = {
        background : '#848484',
        widthScale : 1,
        heightScale : 1,
        radius : 39,
        edgeWidth : 8.5,
        edgeColor : '#000000',
        arrowLength : 20,
        selectionWidth : 15,
        selectionColor : '#6969fa',
        idleNodeColor : '#f0fd96',
        playNodeColor : '#ff71f1',
        idColor : '#000000',
        idFontSize : 60,
        idFont : 'Arial'
    };

    this.trigger_selected = function() {
        for (let node of this.graph.nodes) {
            if (node.selected) {
                console.log('playing random');
                this.flood_trigger(node);
            }
        }
    }

    this.flood_trigger = async function(node) {
        console.log(++count);
        node.playingAnimation = true;
        this.draw_graph();
        node.trigger();
        for (let child of node.children) {
            setTimeout(() => {
                node.playingAnimation = false;
                this.flood_trigger(child);
            }, Math.random()*1000);
        }
    };

    /**
     *  Returns the first node that contains the given coordinate
     *  Return null if no nodes contain 'coord'
     *  @param {*}         coord - {x : Number, y : Number} coordinate to compare
     *  @param {AudioNode} node  - {AudioNode} Optionally specify single node to ignore
     */ 
    this.hovering_node = function(coord, scale=2, ignore_node=null) {
        for (let node of this.graph.nodes) {
            if (node == ignore_node) continue;
            if (node.is_hovering(coord, this.specs.radius * scale)) {
                return node;
            }
        }
        return null;
    }

    this.hovering_edge = function(coord) {
        for (let edge_hash in this.graph.edges) {
            let edge = this.graph.edges[edge_hash];

            if (this.coord_within_edge(edge, coord)) {
                return edge;
            }
        }
        return null;
    }

    // Draw the environment graph
    this.draw_graph = function() {
        // Clear canvas first
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.draw_all_edges();
        this.draw_all_nodes();
    }

    this.draw_all_edges = function() {
        let drawn_hashes = {};

        for (let edge_hash in this.graph.edges) {
            let edge = this.graph.edges[edge_hash];
            let reverse_edge_hash = edge.reverse_hash();
            
            // If not already drawn edge, draw edge
            if (!drawn_hashes.hasOwnProperty(reverse_edge_hash)) {
                let chopped_coords = this.calculate_edge_pair(edge.parent.position, edge.child.position);
                if (edge.selected) {
                    this.draw_line(chopped_coords[0], chopped_coords[1], 
                        width=this.specs.edgeWidth*1.5, color='#ffffff');
                }
                this.draw_line(chopped_coords[0], chopped_coords[1]);
                drawn_hashes[edge_hash] = true;
            }
            // Draw arrow
            let points = this.calculate_arrow(edge.parent.position, edge.child.position);
            this.draw_line(points.start, points.ends[0], this.specs.edgeWidth / 2);
            this.draw_line(points.start, points.ends[1], this.specs.edgeWidth / 2);
        }
    }

    this.draw_all_nodes = function() {
        for (let node of this.graph.nodes) {
            let x = node.position.x; 
            let y = node.position.y;

            this.context.beginPath();
            this.context.arc(x, y, this.specs.radius, 0, 2 * Math.PI);
            this.context.fillStyle = node.playingAnimation ? 
                                    this.specs.playNodeColor : this.specs.idleNodeColor;
            if (node.selected) {
                this.context.strokeStyle = this.specs.selectionColor;
                this.context.lineWidth = this.specs.selectionWidth; 
                this.context.stroke();
            }
            this.context.fill();
        
            this.context.font = this.specs.idFontSize + 'px ' + this.specs.idFont;
            this.context.fillStyle = this.specs.idColor;
            this.context.textAlign = "center";
            this.context.fillText(node.id, x, y + this.specs.idFontSize / 3);
        }
    }
    
    this.draw_temp_edge = function(node_coord, mouse_coord) {
        let chopped_coords = this.calculate_edge_pair(node_coord, mouse_coord);
        this.draw_line(chopped_coords[0], mouse_coord);
    }
    
    this.draw_line = function(coord1, coord2, width=this.specs.edgeWidth, color=this.specs.edgeColor) {
        this.context.beginPath();
        this.context.moveTo(coord1.x, coord1.y);
        this.context.lineTo(coord2.x, coord2.y);
        this.context.lineWidth = width;
        this.context.strokeStyle = color;
        this.context.stroke();
    }

    this.coord_within_edge = function(edge, coord) {
        let edge_boundaries = this.calculate_edge_pair(edge.parent.position, edge.child.position);
        let p1 = edge_boundaries[0];
        let p2 = edge_boundaries[1];

        let in_bounds = Math.max(p1.y, p2.y) > coord.y &&
                        Math.min(p1.y, p2.y) < coord.y;

        if (p2.x == p1.x) {
            return Math.abs(coord.x - p1.x) < this.specs.edgeWidth && in_bounds;
        }
        else {
            let slope = (p2.y - p1.y) / (p2.x - p1.x);
            let y_est = (x) => slope * (x - p1.x) + p1.y;
            let radius = 1.5 * this.specs.edgeWidth;
    
            return Math.abs(y_est(coord.x) - coord.y) < radius && in_bounds;
        }
    }

    this.draw_rect = function(coord1, coord2, width=this.specs.edgeWidth/3) {
        let tleft = {
            x : Math.min(coord1.x, coord2.x),
            y : Math.min(coord1.y, coord2.y)
        }
        let bright = {
            x : Math.max(coord1.x, coord2.x),
            y : Math.max(coord1.y, coord2.y)
        }

        this.draw_line(tleft, { x : bright.x, y : tleft.y }, width,this.specs.selectionColor);
        this.draw_line({ x : bright.x, y : tleft.y }, bright, width, this.specs.selectionColor);
        this.draw_line(bright, { x : tleft.x, y : bright.y }, width, this.specs.selectionColor);
        this.draw_line({ x : tleft.x, y : bright.y }, tleft, width, this.specs.selectionColor);
    }

    this.move_selected = function(deltaCoord) {
        this.graph.nodes.forEach(node => {
            if (node.selected) {
                node.position.x += deltaCoord.x;
                node.position.y += deltaCoord.y;
            }
        });
    }

    this.select_in_rect = function(coord1, coord2) {
        let tleft = {
            x : Math.min(coord1.x, coord2.x),
            y : Math.min(coord1.y, coord2.y)
        }
        let bright = {
            x : Math.max(coord1.x, coord2.x),
            y : Math.max(coord1.y, coord2.y)
        }

        let in_rect = (target) => {
            return target.x >= tleft.x && target.x <= bright.x &&
                   target.y >= tleft.y && target.y <= bright.y;
        }

        for (let node of this.graph.nodes) {
            node.selected = in_rect(node.position);
        }
        for (let edge_hash in this.graph.edges) {
            let edge = this.graph.edges[edge_hash];
            let midpoint = {
                x : ( edge.parent.position.x + edge.child.position.x ) / 2,
                y : ( edge.parent.position.y + edge.child.position.y ) / 2
            }
            edge.selected = in_rect(midpoint);
        }
    }
    
    this.calculate_arrow = function(coord1, coord2) {
        let chopped_coords = this.calculate_edge_pair(coord1, coord2);

        let x1 = chopped_coords[0].x; let x2 = chopped_coords[1].x;
        let y1 = chopped_coords[0].y; let y2 = chopped_coords[1].y;
    
        let length = Math.hypot(x2 - x1, y2 - y1) / 3;
    
        let start_point = {theta : null, x : null, y : null};
        start_point.theta = x1 == x2 ? Math.PI / 2 * (y2 < y1 ? 1 : -1) : Math.atan2((y1-y2) , (x1 - x2));
        start_point.x = x1 - length * Math.cos(start_point.theta);
        start_point.y = y1 - length * Math.sin(start_point.theta);

        let end_points = [{ x : start_point.x + this.specs.arrowLength * Math.cos(start_point.theta + Math.PI/4),
                        y : start_point.y + this.specs.arrowLength * Math.sin(start_point.theta + Math.PI/4) },
                      { x : start_point.x + this.specs.arrowLength * Math.cos(start_point.theta - Math.PI/4),
                        y : start_point.y + this.specs.arrowLength * Math.sin(start_point.theta - Math.PI/4) }];
        return {'start' : start_point, 'ends' : end_points};
    }

    this.calculate_edge_pair = function(coord1, coord2) {
        let x1 = coord1.x; let x2 = coord2.x;
        let y1 = coord1.y; let y2 = coord2.y;
    
        let theta = x1 == x2 ? Math.PI / 2 * (y2 < y1 ? 1 : -1) : Math.atan2((y1-y2) , (x1 - x2));
        let result = [{x : null, y : null}, {x : null, y : null}, theta];

        result[0].x = x1 - this.specs.radius * Math.cos(theta);
        result[0].y = y1 - this.specs.radius * Math.sin(theta);
        result[1].x = x2 + this.specs.radius * Math.cos(theta);
        result[1].y = y2 + this.specs.radius * Math.sin(theta);
        return result;
    }

    this.update_canvas = function() {
        this.canvas.style.background = this.specs.background;
        this.canvas.width  = (window.innerWidth * this.specs.widthScale).toString();
        this.canvas.height = (window.innerHeight * this.specs.heightScale).toString();
        this.draw_graph();
    }

    // Call on construction
    this.update_canvas();
};