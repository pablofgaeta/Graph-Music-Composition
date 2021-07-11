/**** BASE GRAPH IMPLEMENTATION ****/
class GraphObj { 
    static traverse_delay = 1000;
    constructor() {
        this.selected = false;
    }
    select() { 
        this.selected = true;
    }
    toggle_select() {
        this.selected = !this.selected;
    };
}

/**
 * Base Node class, which includes a selection state and optional id
 * @param {*} id (optional) - Unique identifier for the GraphNode
 */
class GraphNode extends GraphObj {
    constructor(id) {
        super();
        this.children = [];
        this.selected = false;
        this.id = id;
    }

    add_child(node) {
        if (!this.has_child(node)) this.children.push(node);
        else                       console.log("Child Already Exists");
    }
    has_child(node) {
        this.children.includes(node);
    }
}

/**
 * Base Edge class, which includes a selected state.
 * @param {GraphNode} parent : parent node of the desired edge
 * @param {GraphNode} child : child node of the desired edge
 */
class GraphEdge extends GraphObj {
    constructor(parent, child) {
        super();
        if ( !(parent instanceof GraphNode && child instanceof GraphNode) ) {
            throw "GraphEdge only accepts GraphNode (or inherited objects)";
        }

        this.parent = parent;
        this.child = child;
    }
    
    hash (parent_hash = this.parent.id, child_hash = this.child.id)  {
        if (parent_hash != child_hash)
            return parent_hash + '->' + child_hash;
        else
            throw "Nodes not unique";
    }
    reverse_hash() {
        return this.hash(this.child.id, this.parent.id);
    }
    static hash_from_nodes(parent_node, child_node) {
        if (parent_node.id != child_node.id)
            return parent_node.id + '->' + child_node.id;
        else
            throw "Nodes not unique";
    }
}

/**
 * Graph class that interacts with GraphNode objects
 */
class Graph extends GraphObj{
    constructor() {
        super();
        this.nodes = [];
        this.edges = {};
        this.next_id = 0;
    }

    /**
     * @returns Next available id for identifying nodes
     */
    __generate_id() {
        return this.next_id++;
    }

    /**
     * Creates and registers new node to the graph.
     * @param {GraphNode} node - initial position of the node
     */
    push_node(node, type = GraphNode) {
        if ((typeof type) != 'function') throw "Improper node type given";
        if ( !(node instanceof type) ) {
            throw "Only accepts " + type.name + " (or derived classes).";
        }

        node.id = this.__generate_id();
        this.nodes.push(node);
    };

    /**
     * Pushes a directed edge and registers key-value mapping by the edge's hash.
     * @param {GraphEdge} parent
     */
    push_edge(edge, type = GraphEdge) {
        if ((typeof type) != 'function') throw "Improper edge type given";
        if ( !(edge instanceof type) ) {
            throw "Only accepts " + type.name + " (or derived classes).";
        }

        let eh = edge.hash();
        if (!this.edges.hasOwnProperty(eh)) {
            edge.parent.add_child(edge.child);
            this.edges[eh] = edge;
        }
    };

    /**
     * @returns bool : Are any nodes selected?
     */
    has_selected() { 
        return this.nodes.every(node => node.selected); 
    }

    node_by_id(id) {
        return this.nodes.filter(node => node.id == id)[0];
    }

    /**
     * @returns Array of selected nodes
     */
    get selected_nodes() { 
        return this.nodes.filter(node => node.selected); 
    }

    /**
     * @returns Array of selected Edges
     */
    get selected_edges() { 
        return Object.values(this.edges).filter(edge => edge.selected); 
    }

    /**
     * Sets 'selected' property of each node and edge to false.
     */
    clear_selections() {
        for (let node of this.nodes) {
            node.selected = false;
        }
        for (let edge_hash in this.edges) {
            this.edges[edge_hash].selected = false;
        }
    };

    /**
     * Removes all selected node (and all dependent edges) and selected edges.
     */
    delete_selected() {
        let deleted_nodes = [];

        // Remove any nodes first
        for (let i = this.nodes.length - 1; i >= 0; --i) {
            let node = this.nodes[i];
            if (node.selected) {
                // Remove node
                deleted_nodes.push(this.nodes.splice(i, 1)[0]);
            }
        }
        // Remove any selected edges or edges dependent on deleted nodes
        for (let edge_hash in this.edges) {
            let edge = this.edges[edge_hash];
            if (edge.selected ||
                deleted_nodes.includes(edge.parent) ||
                deleted_nodes.includes(edge.child)) {
                // Remove direct reference to edge
                delete this.edges[edge_hash];

                // Clean up lingering references to child by parent
                let child_pos = edge.parent.children.indexOf(edge.child);
                if (child_pos != -1)
                    edge.parent.children.splice(child_pos, 1);
            }
        }
    }
}

/**** DRAWING UTILITIES ****/

// let spawn_menu = function() {
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


const GraphicsUtilities = (() => {
    /**
    * Draws a line with the given canvas context
    * @param {Coordinate} p1 - Start Point
    * @param {Coordinate} p2 - End point
    * @param {CanvasRenderingContext2D} : Context in which to draw line
    * @param {Number} width : Line Width
    * @param {String} color : Stroke Color
    */
    const draw_line = function(p1, p2, context, width, color) {
        context.beginPath();
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
        context.lineWidth = width;
        context.strokeStyle = color;
        context.stroke();
    }

    /**
     * Returns the direction of the vector from p1 to p2, interpreting p1 as the origin
     * @param {Coordinate} p1 : Start Point
     * @param {Coordinate} p2 : End Point
     */
    const direction = (p1, p2) => {
        let dir = p1.x == p2.x ? Math.PI / 2 * (p1.y > p2.y ? 1 : -1) : Math.atan2(p1.y - p2.y, p2.x - p1.x);
        return dir;
    };

    /**
     * Each point given is assumed to be a circle with radius, r, and there is a line segment, L,
     * connecting p1 to p2. Then finds The points (closest to each other) at the edge of each circle that fall on L.
     * @param {Coordinate} p1 
     * @param {Coordinate} p2 
     * @returns [1st point on shortened L, 2nd point on shortened L, direction theta of vector.
     */

    const segment_minus_circles = (p1, p2, radius) => {
        let theta = direction(p1, p2);
        let scaleX = radius * Math.cos(theta);
        let scaleY = radius * Math.sin(theta);

        return [
            new Coordinate(p1.x + scaleX, p1.y - scaleY),
            new Coordinate(p2.x - scaleX, p2.y + scaleY),
            theta
        ];
    }

    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    return {
        'draw_line' : draw_line,
        'direction' : direction,
        'segment_minus_circles' : segment_minus_circles,
        'sleep' : sleep
    };
})();

/**
 * Custom Coordinate object to help type-check functions
 * @param {Number} x : x-position of the coordinate
 * @param {Number} y : y-position of the coordinate
 */
class Coordinate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.set = (x, y) => { this.x = x; this.y = y; };
        this.shift = (dx, dy) => { this.x += dx; this.y += dy; };
    }
    valueOf() {
        return "(" + this.x + ', ' + this.y + ')';
    }
}

/**** VISUAL GRAPH IMPLEMENTATION ****/

/**
 *
 * @param {Coordinate} position : Initial position of the VisualNode
 * @param {Number} id (optional) : Unique identifier for the VisualNode { Default : null }
 */
class VisualNode extends GraphNode {
    static settings = {
        "radius" : 40,
        idleColor : "#89cff0",
        "activeColor" : "#aeff72",
        "selectionColor" : '#000000',
        "selectionWidth" : 7,
        "idColor" : "#000000",
        "idFontSize" : 20,
        "idFont" : "Arial"
    }

    constructor(position, id, name = id) {
        super(id);
        if (!(position instanceof Coordinate)) throw "position must be a Coordinate instance";
        this.name = name;
        this.position = position;
        this.active = true;
        this.animating = false;
    }

    process_trigger() {
        // default trigger. Do nothing
    }

    toString() {
        return `#${this.id} : ${this.name}`;
    }

    get duration() {
        return GraphObj.traverse_delay;
    }
    
    /**
     * 
     * @param {Coordinate} deltaX : change in x-axis
     * @param {Coordinate} deltaY : change in y-axis
     */
    move(deltaX, deltaY) {
        this.position.shift(deltaX, deltaY);
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} drawing_context : Context in which to draw on
     */
    draw (context) {
        let x = this.position.x; 
        let y = this.position.y;

        context.beginPath();
        context.arc(x, y, VisualNode.settings.radius, 0, 2 * Math.PI);
        // Toggle fill color based on animation state
        context.fillStyle = this.animating ? VisualNode.settings.activeColor : 
                                        VisualNode.settings.idleColor;
        // Draw border if selected
        if (this.selected) {
            context.strokeStyle = VisualNode.settings.selectionColor;
            context.lineWidth   = VisualNode.settings.selectionWidth; 
            context.stroke();
        }
        context.fill();
    
        context.font = VisualNode.settings.idFontSize + 'px ' + VisualNode.settings.idFont;
        context.fillStyle = VisualNode.settings.idColor;
        context.textAlign = "center";
        context.fillText(this.id, x, y - 2 * VisualNode.settings.idFontSize / 3);
        context.fillText(this.name, x, y + 2 * VisualNode.settings.idFontSize / 3);
    }

    /**
     * Check if the given coordinate is contained in the drawn node on the canvas context.
     * The result will vary depending on the current VisualNode.settings.radius.
     * @param {Coordinate} coord : Given coordinate for comparison
     * @param {Number} scale (optional) : Linear scale for search radius {Default = 1}
     * @returns bool : coord hovering node?
     */
    hovering(coord, scale=1) {
        let x = this.position.x - coord.x;
        let y = this.position.y - coord.y;
        return Math.hypot(x,y) <= VisualNode.settings.radius * scale;
    }
}

class VisualEdge extends GraphEdge {
    static settings = {
        "width" : 10,
        "color" : "#f29f9f",
        "arrowLen" : 20,
        "selectionColor" : "#000000"
    }

    static line(a, b, context, scale = 1, color = VisualEdge.settings.color) {
        GraphicsUtilities.draw_line(a, b, context, scale * VisualEdge.settings.width, color)
    }

   /**
    * 
    * @param {VisualNode} parent : parent node of the edge
    * @param {VisualNode} child : child node of the edge
    * @param {CanvasRenderingContext2D} drawing_context : Context in which to draw on { Default : null }
    */
    constructor(parent, child, delay_scale = 1) {
        if (! (parent instanceof VisualNode && child instanceof VisualNode)) {
            throw "Only accepts VisualNode (or derived classes)";
        }
        super(parent, child);
        this.set_delay(delay_scale);
    }

    set_delay(scale) {
        this.delay_scale = scale;
        return this;
    }


    get delay() {
        return GraphObj.traverse_delay * this.delay_scale;
    }

    edge_boundaries() {
        return GraphicsUtilities.segment_minus_circles(
            this.parent.position, this.child.position, VisualNode.settings.radius
        );
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} context : Context in which to draw edge
     */
    draw(context) {
        let edge_coords = this.edge_boundaries();
        if (this.selected) {
            VisualEdge.line(edge_coords[0], edge_coords[1], context, 1.5, VisualEdge.settings.selectionColor);
        }
        VisualEdge.line(edge_coords[0], edge_coords[1], context);

        let points = this.calculate_arrow();
        VisualEdge.line(points.start, points.ends[0], context, 0.5);
        VisualEdge.line(points.start, points.ends[1], context, 0.5);
    }

    /**
     * 
     * @param {GraphEdge} edge 
     */
    calculate_arrow() {
        let edge_coords = this.edge_boundaries();
        let x1 = edge_coords[0].x; let x2 = edge_coords[1].x;
        let y1 = edge_coords[0].y; let y2 = edge_coords[1].y;
        let theta = edge_coords[2];
    
        let length = Math.hypot(x2 - x1, y2 - y1) / 3;
    
        let start_point = new Coordinate(
            x1 + length * Math.cos(theta),
            y1 - length * Math.sin(theta)
        );

        let end_points = [
            new Coordinate(start_point.x - VisualEdge.settings.arrowLen * Math.cos(theta + Math.PI/4),
                           start_point.y + VisualEdge.settings.arrowLen * Math.sin(theta + Math.PI/4) 
            ),
            new Coordinate(start_point.x - VisualEdge.settings.arrowLen * Math.cos(theta - Math.PI/4),
                            start_point.y + VisualEdge.settings.arrowLen * Math.sin(theta - Math.PI/4)
            )
        ];
        return {'start' : start_point, 'ends' : end_points};
    }

    /**
     * Check if the given coordinate is contained in the drawn edge on the canvas context.
     * The result will vary depending on the current this.specs.edgeWidth.
     * @param {GraphEdge} edge : Target edge 
     * @param {Coordinate} coord : Target coordinate
     * @returns bool : coord hovering edge?
     */
    hovering(coord) {
        let edge_coords = this.edge_boundaries();
        let p1 = edge_coords[0];
        let p2 = edge_coords[1];

        let in_bounds = Math.max(p1.y, p2.y) > coord.y &&
                        Math.min(p1.y, p2.y) < coord.y;

        if (p2.x == p1.x) {
            return Math.abs(coord.x - p1.x) < VisualEdge.settings.width && in_bounds;
        }
        else {
            let slope = (p2.y - p1.y) / (p2.x - p1.x);
            let y_est = (x) => slope * (x - p1.x) + p1.y;
            let radius = 1.5 * VisualEdge.settings.width;
    
            return Math.abs(y_est(coord.x) - coord.y) < radius && in_bounds;
        }
    }
}

class VisualGraph extends Graph {
    static settings = {
        "background" : "#ffffff",
        "width" : 5,
        "height" : 5,
        "menuWidth" : 120
    };

    /**
     * Enables visual representation of a graph
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas = null) {
        super();
        this.canvas = null;
        if (canvas && canvas instanceof Element) {
            this.canvas = canvas;
        }
        else {
            this.canvas = document.createElement('canvas');
            this.canvas.tabIndex = 1;
            document.body. appendChild(this.canvas);
        }
        this.context = this.canvas.getContext("2d");
    }

    /**
     * Pushes a node to the VisualGraph
     * @param {VisualNode} parent
     */
    push_node(node) {
        super.push_node(node, VisualNode);
        this.draw();
    }

    /**
     * Pushes a directed edge and registers key-value mapping by the edge's hash.
     * @param {VisualEdge} parent
     */
    push_edge(edge) {
        super.push_edge(edge, VisualEdge);
        this.draw();
    }

    delete_selected() {
        super.delete_selected();
        this.draw();
    }

    /**
     * Uniformly alters the 'active' property of each node to 'state'.
     * @param {bool} state - desired 'active' state
     */
    toggle_active(state) {
        this.nodes.forEach(node =>  {node.active = state});
    }

    /**
     * Called by user to trigger all selected nodes simultaneusly.
     */
    trigger_selected() {
        this.toggle_active(true);
        this.nodes.forEach(node => { 
            if(node.selected) {
                this.flood_trigger(node);
            }
        });
    }

    /**
     * Triggers the given node and all edges sprouting from that node.
     */
    flood_trigger(node) {
        node.process_trigger();
        // Prevent playing when traversing is disabled
        if (!node.active) return;

        node.trigger();
        this.trigger_animation(node);

        // Populate list of all next edge hashes
        let next_edge_hashes = [];
        node.children.forEach(child => {
            next_edge_hashes.push(GraphEdge.hash_from_nodes(node, child));
        });

        // Trigger recursive call to all forward edges from node
        for (let edge_hash of next_edge_hashes) {
            // Sanity check in case graph is out of sync with the node
            if (this.edges.hasOwnProperty(edge_hash)) {
                let edge = this.edges[edge_hash];
                setTimeout(() => {
                    this.flood_trigger(edge.child);
                }, edge.delay);
            }
        }
    }
    
    /**
     * Enables the node's animation, then waits for 'ms' seconds to disable the animation.
     * @param {VisualNode} node - Target node for animation
     */
    async trigger_animation(node) {
        node.animating = true;
        this.draw();
        await GraphicsUtilities.sleep(node.duration);
        node.animating = false;
        this.draw();
    }

    line(a, b, scale = 1, color = VisualEdge.settings.color) {
        GraphicsUtilities.draw_line(a, b, this.context, scale * VisualEdge.settings.width, color)
    }

    /**
     * Called while a user is forming an edge, but has not completed the dge yet
     * @param {GraphNode} node - Parent node of the potential edge (where the user began clicking)
     * @param {Coordinate} mouse_coord - Current mouse coordinate 
     */
    draw_temporary_edge(node, mouse_coord) {
        this.draw();
        let dummy_edge = new VisualEdge(node, new VisualNode(mouse_coord, null));
        let edge_coords = dummy_edge.edge_boundaries();

        let hover_node = this.hovering_node(mouse_coord);
        if (hover_node) {
            let potential_edge = new VisualEdge(node, hover_node);
            potential_edge.draw(this.context);
        }
        else {
            this.line(edge_coords[0], mouse_coord);
            let points = dummy_edge.calculate_arrow();
            this.line(points.start, points.ends[0], 0.5);
            this.line(points.start, points.ends[1], 0.5);
        }
    }
    

    draw() {
        this.canvas.style.background = VisualGraph.settings.background;
        this.canvas.width  = (window.innerWidth * VisualGraph.settings.width).toString();
        this.canvas.height = (window.innerHeight * VisualGraph.settings.height).toString();

        // Clear canvas first
        // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // draw all edges
        Object.values(this.edges).forEach(edge => {
            edge.draw(this.context);
        })

        // draw all nodes
        this.nodes.forEach(node => {
            node.draw(this.context);
        })
    }

    /**
     *  Returns the first node that contains the given coordinate.
     *  Return null if no nodes contain 'coord'
     *  @param {Coordinate} coord - Coordinate reference to compare
     *  @param {Number} scale (optional) : Linearly scale the search radius {Default = 1}
     *  @param {GraphNode} ignore_node (optional) : Specify single node to ignore {Default = null}
     */ 
    hovering_node(coord, scale=1, ignore_node=null) {
        for (let node of this.nodes) {
            if (node == ignore_node) continue;
            if (node.hovering(coord, scale)) {
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
    hovering_edge(coord) {
        for (let edge_hash in this.edges) {
            let edge = this.edges[edge_hash];
            if (edge.hovering(coord)) {
                return edge;
            }
        }
        return null;
    }

    /**
     * 
     * @param {Coordinate} deltaCoord 
     */
    move_selected = function(deltaCoord) {
        this.nodes.forEach(node => {
            if (node.selected) {
                node.move(deltaCoord.x, deltaCoord.y);
            }
        });

        // update canvas
        this.draw();
    }

    /**
     * All elements will be checked for inclusion in the rectangle
     * enclosed by p1 and p2. A Node is included if its center is 
     * in the rectangle. An edge is included if its midpoint is in the rectangle
     * @param {Coordinate} p1
     * @param {Coordinate} p2 
     */
    select_in_rect(p1, p2, rect_width = 1/3) {
        let tleft = new Coordinate( Math.min(p1.x, p2.x), Math.min(p1.y, p2.y) );
        let bright = new Coordinate( Math.max(p1.x, p2.x), Math.max(p1.y, p2.y) );

        let in_rect = (target) => {
            return target.x >= tleft.x && target.x <= bright.x &&
                   target.y >= tleft.y && target.y <= bright.y;
        }

        for (let node of this.nodes) {
            node.selected = in_rect(node.position);
        }
        for (let edge_hash in this.edges) {
            let edge = this.edges[edge_hash];
            let midpoint = new Coordinate( (edge.parent.position.x + edge.child.position.x ) / 2, 
                                           (edge.parent.position.y + edge.child.position.y ) / 2);
            edge.selected = in_rect(midpoint);
        }

        // Update canvas
        this.draw();
        let rect_line = (a, b) => this.line(a, b, rect_width, VisualEdge.settings.selectionColor);
        rect_line(tleft, new Coordinate(bright.x, tleft.y));
        rect_line(new Coordinate(bright.x, tleft.y), bright);
        rect_line(bright, new Coordinate(tleft.x, bright.y));
        rect_line(new Coordinate(tleft.x, bright.y ), tleft);
    }



    /**
     * Update canvas style and redraw graph
     */
    update() {
        this.canvas.style.background = VisualGraph.settings.background;
        this.canvas.width  = (window.innerWidth * VisualGraph.settings.width).toString();
        this.canvas.height = (window.innerHeight * VisualGraph.settings.height).toString();
        this.draw();
    }
}