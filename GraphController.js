let Coordinate = function(x, y) {
    this.x = x;
    this.y = y;
    this.set = (x,y) => {
        this.x = x;
        this.y = y;
    }
}

let GraphNode = function(position, id) {
    this.children = [];
    this.position = position;
    this.selected = false;
    this.id = id;
    this.player = new NodeSynth();

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
};


let GraphEdge = function(parent, child, delay=500) {
    this.parent = parent;
    this.child = child;
    this.delay = delay;
    this.selected = false;

    this.get_delay = function() { return this.delay; }
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
GraphEdge.hash_from_nodes = (parent_node, child_node) => {
    if (parent_node.id != child_node.id) return parent_node.id + '->' + child_node.id;
    else throw "Nodes not unique";
}


let Graph = function() {
    this.nodes = [];
    this.edges = {};
    this.next_id = 0;

    this.create_node = function(coord) {
        this.nodes.push(new GraphNode(coord, this.next_id++));
    };

    this.create_edge = function(parent, child) {
        let new_edge = new GraphEdge(parent, child);
        parent.add_child(child);

        let eh = new_edge.hash();
        if (!this.edges.hasOwnProperty(eh)) {
            this.edges[eh] = new_edge;
        }
    }

    this.has_selected = () => this.nodes.every(node => node.selected);
    this.selected_nodes = () => this.nodes.filter(node => node.selected);
    this.selected_edges = () => this.edges.filter(edge => edge.selected);

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

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

let GraphController = function() {
    this.graph = new Graph();

    this.menus = [];
    this.kill_traversal = false;
    this.kill = () => { this.kill_traversal = true; };

    this.canvas = document.createElement('canvas');
    document.body. appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");

    this.specs = {
        background : '#848484',
        widthScale : 1,
        heightScale : 1,
        menuWidth : 120,

        radius : 39,
        idleNodeColor : '#f0fd96',
        selectionColor : '#6969fa',
        selectionWidth : 15,
        playNodeColor : '#ff71f1',

        edgeWidth : 8.5,
        edgeColor : '#000000',
        arrowLength : 20,
        
        idColor : '#000000',
        idFontSize : 60,
        idFont : 'Arial'
    };

    // this.spawn_menu = function(coord) {
    //     var menu_gui = new dat.GUI({ autoPlace : false });
    //     menu_gui.width = this.specs.menuWidth;
    //     var menu = document.createElement('div');
    //     menu.className = 'menu';
    //     menu.style.top  = coord.y + 'px';
    //     menu.style.left = (coord.x - this.specs.menuWidth / 2) + 'px';
    //     document.body.appendChild(menu);
    //     menu.appendChild(menu_gui.domElement);
    //     this.menus.push(menu_gui);
    // }

    /***** NODE TRAVERSAL FUNCTIONS ******/

    /**
     * Called by user to trigger all selected nodes simultaneusly
     */
    this.trigger_selected = function() {
        this.kill_traversal = false;
        this.graph.nodes.forEach(node => { 
            if(node.selected) {
                this.flood_trigger(node);
            }
        });
    }

    /**
     * Triggers the given node and all edges sprouting from that node
     * @param {*} node - target node to trigger and flood from
     */
    this.flood_trigger = function(node) {
        // Prevent playing when kill switch active
        if (this.kill_traversal) return;

        node.player.trigger();
        this.trigger_animation(node, node.player.duration());

        // Populate list of all next edge hashes
        let next_edge_hashes = [];
        node.children.forEach(child => {
            next_edge_hashes.push(GraphEdge.hash_from_nodes(node, child));
        });

        // Trigger recursive call to all forward edges from node
        for (let edge_hash of next_edge_hashes) {
            // Sanity check in case graph is out of sync with the node
            if (this.graph.edges.hasOwnProperty(edge_hash)) {
                let edge = this.graph.edges[edge_hash];
                setTimeout(() => {
                    this.flood_trigger(edge.child);
                }, edge.get_delay());
            }
        }
    }

    /**
     * Enables the node's animation, then waits for 'ms' seconds to disable the animation
     * @param {GraphNode} node - Target node for animation
     * @param {*} ms - Delay time to stop animation
     */
    this.trigger_animation = async function(node, ms) {
        node.player.animating = true;
        this.draw_graph();
        await sleep(ms);
        node.player.animating = false;
        this.draw_graph();
    }

    /****** CHECK IF COORDINATE IS HOVERING AN ELEMENT *****/

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

    /***** HIGH-LEVEL DRAW FUNCTIONS *****/

    /**
     * Re-draws the state of the graph on the context of the canvas
     */
    this.draw_graph = function() {
        // Clear canvas first
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.draw_all_edges();
        this.draw_all_nodes();
    }

    /**
     * Re-draws each edge in the graph on the current context
     */
    this.draw_all_edges = function() {
        let drawn_hashes = {};

        for (let edge_hash in this.graph.edges) {
            let edge = this.graph.edges[edge_hash];
            let reverse_edge_hash = edge.reverse_hash();
            
            // If not already drawn edge in the opposite direction, draw edge
            if (!drawn_hashes.hasOwnProperty(reverse_edge_hash)) {
                let edge_coords = this.calculate_edge_pair(edge.parent.position, edge.child.position);
                if (edge.selected) {
                    this.draw_line(edge_coords[0], edge_coords[1], this.specs.edgeWidth*1.5, '#ffffff');
                }
                this.draw_line(edge_coords[0], edge_coords[1]);
                drawn_hashes[edge_hash] = true;
            }
            // Draw arrow
            let points = this.calculate_arrow(edge.parent.position, edge.child.position);
            this.draw_line(points.start, points.ends[0], this.specs.edgeWidth / 2);
            this.draw_line(points.start, points.ends[1], this.specs.edgeWidth / 2);
        }
    }

    /**
     * Re-draws all nodes on the current context
     */
    this.draw_all_nodes = function() {
        for (let node of this.graph.nodes) {
            let x = node.position.x; 
            let y = node.position.y;

            this.context.beginPath();
            this.context.arc(x, y, this.specs.radius, 0, 2 * Math.PI);
            this.context.fillStyle = node.player.animating ? 
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
    
    /**
     * Called while a user is forming an edge, but has not completed the dge yet
     * @param {*} node - Parent node of the potential edge (where the user began clicking)
     * @param {*} mouse_coord - Current mouse coordinate 
     */
    this.draw_temp_edge = function(node, mouse_coord) {
        let edge_coords = this.calculate_edge_pair(node.position, mouse_coord);
        this.draw_line(edge_coords[0], mouse_coord);

        let points = this.calculate_arrow(node.position, mouse_coord);
        this.draw_line(points.start, points.ends[0], this.specs.edgeWidth / 2);
        this.draw_line(points.start, points.ends[1], this.specs.edgeWidth / 2);
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
        let tleft = new Coordinate( Math.min(coord1.x, coord2.x), Math.min(coord1.y, coord2.y) );
        let bright = new Coordinate( Math.max(coord1.x, coord2.x), Math.max(coord1.y, coord2.y) );

        this.draw_line(tleft, new Coordinate(bright.x, tleft.y), width,this.specs.selectionColor);
        this.draw_line(new Coordinate(bright.x, tleft.y), bright, width, this.specs.selectionColor);
        this.draw_line(bright, new Coordinate(tleft.x, bright.y), width, this.specs.selectionColor);
        this.draw_line(new Coordinate(tleft.x, bright.y ), tleft, width, this.specs.selectionColor);
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
        let tleft = new Coordinate( Math.min(coord1.x, coord2.x), Math.min(coord1.y, coord2.y) );
        let bright = new Coordinate( Math.max(coord1.x, coord2.x), Math.max(coord1.y, coord2.y) );

        let in_rect = (target) => {
            return target.x >= tleft.x && target.x <= bright.x &&
                   target.y >= tleft.y && target.y <= bright.y;
        }

        for (let node of this.graph.nodes) {
            node.selected = in_rect(node.position);
        }
        for (let edge_hash in this.graph.edges) {
            let edge = this.graph.edges[edge_hash];
            let midpoint = new Coordinate( (edge.parent.position.x + edge.child.position.x ) / 2, 
                                           (edge.parent.position.y + edge.child.position.y ) / 2);
            edge.selected = in_rect(midpoint);
        }
    }
    
    this.calculate_arrow = function(coord1, coord2) {
        let edge_coords = this.calculate_edge_pair(coord1, coord2);

        let x1 = edge_coords[0].x; let x2 = edge_coords[1].x;
        let y1 = edge_coords[0].y; let y2 = edge_coords[1].y;
    
        let length = Math.hypot(x2 - x1, y2 - y1) / 3;
    
        let start_point = new Coordinate(
            x1 - length * Math.cos(edge_coords[2]),
            y1 - length * Math.sin(edge_coords[2])
        );

        let end_points = [
            new Coordinate(start_point.x + this.specs.arrowLength * Math.cos(edge_coords[2] + Math.PI/4),
                            start_point.y + this.specs.arrowLength * Math.sin(edge_coords[2] + Math.PI/4) 
            ),
            new Coordinate(start_point.x + this.specs.arrowLength * Math.cos(edge_coords[2] - Math.PI/4),
                            start_point.y + this.specs.arrowLength * Math.sin(edge_coords[2] - Math.PI/4)
            )
        ];
        return {'start' : start_point, 'ends' : end_points};
    }

    this.calculate_edge_pair = function(coord1, coord2) {
        let x1 = coord1.x; let x2 = coord2.x;
        let y1 = coord1.y; let y2 = coord2.y;
    
        let theta = x1 == x2 ? Math.PI / 2 * (y2 < y1 ? 1 : -1) : Math.atan2((y1-y2) , (x1 - x2));
        let scaleX = this.specs.radius * Math.cos(theta);
        let scaleY = this.specs.radius * Math.sin(theta);

        return [
            new Coordinate(x1 - scaleX, y1 - scaleY),
            new Coordinate(x2 + scaleX, y2 + scaleY),
            theta
        ];
    }

    this.update_canvas = function() {
        this.canvas.style.background = this.specs.background;
        this.canvas.width  = (window.innerWidth * this.specs.widthScale).toString();
        this.canvas.height = (window.innerHeight * this.specs.heightScale).toString();
        this.menus.forEach(menu => { menu.width = this.specs.menuWidth; });
        this.draw_graph();
    }

    // Call on construction
    this.update_canvas();
};