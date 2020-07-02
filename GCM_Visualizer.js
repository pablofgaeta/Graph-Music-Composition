/**
 * Implementation of GraphNode for 'Graph Music Composition' Visual/Audio App
 * @param {Coordinate} position - Initial position of the node
 * @param {AudioPlayer} player - Endpoint for playing the node's instrument
 * @param {Number} id (optional) - Identifier used to uniquely identify a node
 */
class GCMNode extends VisualNode {
    constructor(position, player, id = null) {
        super(position, id);
        this.player = player;
        this.active = true;
    }
}


class GCMEdge extends VisualEdge {
    constructor(parent, child, delay = 500) {
        super(parent, child);
        this.delay = delay;
    }
}


let GraphVisualizer = function() {
    this.graph = new Graph();

    this.canvas = document.createElement('canvas');
    document.body. appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");

    this.specs = Settings.specs;

    /***** NODE TRAVERSAL FUNCTIONS ******/

    /**
     * Uniformly alters the 'active' property of each node to 'state'.
     * @param {bool} state - desired 'active' state
     */
    this.toggle_traversal = (state) => {
        this.graph.nodes.forEach(node =>  {node.active = state});
    }

    /**
     * Called by user to trigger all selected nodes simultaneusly.
     */
    this.trigger_selected = function() {
        this.toggle_traversal(true);
        this.graph.nodes.forEach(node => { 
            if(node.selected) {
                this.flood_trigger(node);
            }
        });
    }

    /**
     * Triggers the given node and all edges sprouting from that node.
     * @param {GraphNode} node - target node to trigger and flood from
     */
    this.flood_trigger = function(node) {
        // Prevent playing when traversing is disabled
        if (!node.active) return;

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
                }, edge.delay);
            }
        }
    }

    /**
     * Enables the node's animation, then waits for 'ms' seconds to disable the animation.
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
     * Check if the given coordinate is contained in the drawn node on the canvas context.
     * The result will vary depending on the current this.specs.radius.
     * @param {GraphNode} node : Target node to check inclusion
     * @param {Coordinate} coord : Given coordinate for comparison
     * @param {Number} scale (optional) : Linear scale for search radius {Default = 1}
     * @returns bool : coord hovering node?
     */
    this.over_node = function(node, coord, scale=1) {
        let x = node.position.x - coord.x;
        let y = node.position.y - coord.y;
        return Math.hypot(x,y) <= this.specs.radius * scale;
    }

    /**
     * Check if the given coordinate is contained in the drawn edge on the canvas context.
     * The result will vary depending on the current this.specs.edgeWidth.
     * @param {GraphEdge} edge : Target edge 
     * @param {Coordinate} coord : Target coordinate
     * @returns bool : coord hovering edge?
     */
    this.over_edge = function(edge, coord) {
        let edge_coords = this.edge_boundaries(edge);
        let p1 = edge_coords[0];
        let p2 = edge_coords[1];

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

    /**
     *  Returns the first node that contains the given coordinate.
     *  Return null if no nodes contain 'coord'
     *  @param {Coordinate} coord - Coordinate reference to compare
     *  @param {Number} scale (optional) : Linearly scale the search radius {Default = 1}
     *  @param {GraphNode} ignore_node (optional) : Specify single node to ignore {Default = null}
     */ 
    this.hovering_node = function(coord, scale=1, ignore_node=null) {
        for (let node of this.graph.nodes) {
            if (node == ignore_node) continue;
            if (this.over_node(node, coord, scale)) {
                return node;
            }
        }
        return null;
    }

    /**
     * Returns the first edgde that contains the given coordinate.
     * Return null if no nodes contain 'coord'
     * @param {Coordinate} coord - Coordinate reference to compare
     */
    this.hovering_edge = function(coord) {
        for (let edge_hash in this.graph.edges) {
            let edge = this.graph.edges[edge_hash];

            if (this.over_edge(edge, coord)) {
                return edge;
            }
        }
        return null;
    }

    /***** HIGH-LEVEL DRAW FUNCTIONS *****/

    /**
     * Re-draws the state of the graph on the context of the canvas.
     */
    this.draw_graph = function() {
        // Clear canvas first
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // draw all edges
        Object.values(this.graph.edges).forEach(edge => {
            this.draw_edge(edge);
        })

        // draw all nodes
        this.graph.nodes.forEach(node => {
            this.draw_node(node);
        })
    }

    /**
     * Draw a single edge.
     * @param {GraphEdge} edge 
     */
    this.draw_edge = function(edge) {
        let edge_coords = this.edge_boundaries(edge);
        if (edge.selected) {
            this.draw_line(edge_coords[0], edge_coords[1], this.specs.edgeWidth*1.5, '#ffffff');
        }
        this.draw_line(edge_coords[0], edge_coords[1]);

        let points = this.calculate_arrow(edge);
        this.draw_line(points.start, points.ends[0], this.specs.edgeWidth / 2);
        this.draw_line(points.start, points.ends[1], this.specs.edgeWidth / 2);
    }

    /**
     * Draw a single node.
     * @param {GraphNode} node
     */
    this.draw_node = function(node) {
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
    
    /**
     * Called while a user is forming an edge, but has not completed the dge yet
     * @param {GraphNode} node - Parent node of the potential edge (where the user began clicking)
     * @param {Coordinate} mouse_coord - Current mouse coordinate 
     */
    this.draw_temp_edge = function(node, mouse_coord) {
        let dummy_edge = new VisualEdge(node, new VisualNode(mouse_coord, null));
        let edge_coords = this.edge_boundaries(dummy_edge);

        let hover_node = this.hovering_node(mouse_coord);
        if (hover_node) {
            let potential_edge = new VisualEdge(node, hover_node);
            this.draw_edge(potential_edge);
        }
        else {
            this.draw_line(edge_coords[0], mouse_coord);
            let points = this.calculate_arrow(dummy_edge);
            this.draw_line(points.start, points.ends[0], this.specs.edgeWidth / 2);
            this.draw_line(points.start, points.ends[1], this.specs.edgeWidth / 2);
        }
    }
    
    /**
     * Draws a line with the given canvas context
     * @param {Coordinate} coord1 - Start Point
     * @param {Coordinate} coord2 - End point
     * @param {Number} width (optional) - Line Width {Default = this.specs.edgeWidth}
     * @param {String} color (optional) - Stroke Color {Default = this.specs.edgeColor}
     */
    this.draw_line = function(coord1, coord2, width=this.specs.edgeWidth, color=this.specs.edgeColor) {
        this.context.beginPath();
        this.context.moveTo(coord1.x, coord1.y);
        this.context.lineTo(coord2.x, coord2.y);
        this.context.lineWidth = width;
        this.context.strokeStyle = color;
        this.context.stroke();
    }

    /**
     * 
     * @param {Coordinate} coord1 :
     * @param {Coordinate} coord2 :
     * @param {Number} width (optional) : 
     */
    this.draw_rect = function(coord1, coord2, width=this.specs.edgeWidth/3) {
        let tleft = new Coordinate( Math.min(coord1.x, coord2.x), Math.min(coord1.y, coord2.y) );
        let bright = new Coordinate( Math.max(coord1.x, coord2.x), Math.max(coord1.y, coord2.y) );

        this.draw_line(tleft, new Coordinate(bright.x, tleft.y), width,this.specs.selectionColor);
        this.draw_line(new Coordinate(bright.x, tleft.y), bright, width, this.specs.selectionColor);
        this.draw_line(bright, new Coordinate(tleft.x, bright.y), width, this.specs.selectionColor);
        this.draw_line(new Coordinate(tleft.x, bright.y ), tleft, width, this.specs.selectionColor);
    }

    /**
     * 
     * @param {Coordinate} deltaCoord 
     */
    this.move_selected = function(deltaCoord) {
        this.graph.nodes.forEach(node => {
            if (node.selected) {
                node.move(deltaCoord.x, deltaCoord.y);
            }
        });
    }

    /**
     * 
     * @param {Coordinate} coord1 
     * @param {Coordinate} coord2 
     */
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
    
    /**
     * 
     * @param {GraphEdge} edge 
     */
    this.calculate_arrow = function(edge) {
        if (! (edge instanceof GraphEdge) ) throw "Must be given GraphEdge";
        let edge_coords = this.edge_boundaries(edge);

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

    /**
     * 
     * @param {GraphEdge} edge 
     */
    this.edge_boundaries = (edge) => {
        if (edge instanceof GraphEdge)
            return this.calculate_edge_pair(edge.parent.position, edge.child.position);
        else
            throw "Must be given GraphEdge";
    }

    /**
     * 
     * @param {Coordinate} coord1 
     * @param {Coordinate} coord2 
     */
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

    /**
     * Update canvas style and redraw graph
     */
    this.update_canvas = function() {
        this.canvas.style.background = this.specs.background;
        this.canvas.width  = (window.innerWidth * this.specs.widthScale).toString();
        this.canvas.height = (window.innerHeight * this.specs.heightScale).toString();
        this.draw_graph();
    }

    // Call on construction
    this.update_canvas();
};