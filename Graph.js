/**
 * Abstract Node class with a selection state
 * @param {*} id (optional) - Unique identifier for the GraphNode
 */
class GraphNode {
    constructor(id = null) {
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
    select() { 
        this.selected = true;
    }
    toggle_selected() {
        this.selected = !this.selected;
    };
}

/**
 *
 * @param {GraphNode} parent
 * @param {GraphNode} child
 */
class GraphEdge {
    constructor(parent, child) {
        this.parent = parent;
        this.child = child;
        this.selected = false;
    }
    select() { 
        this.selected = true; 
    }
    toggle_selected() { 
        this.selected = !this.selected; 
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

class Graph {
    constructor() {
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
    push_node(node) {
        node.id = this.__generate_id();
        this.nodes.push(node);
    };

    /**
     * Creates a directed edge and registers key-value mapping by the edge's hash.
     * @param {GraphNode} parent
     * @param {GraphNode} child
     */
    create_edge(parent, child) {
        let new_edge = new GCMEdge(parent, child);
        let eh = new_edge.hash();

        if (!this.edges.hasOwnProperty(eh)) {
            parent.add_child(child);
            this.edges[eh] = new_edge;
        }
    };

    /**
     * @returns bool : Are any nodes selected?
     */
    has_selected() { 
        this.nodes.every(node => node.selected); 
    }

    /**
     * @returns Array of selected nodes
     */
    selected_nodes() { 
        this.nodes.filter(node => node.selected); 
    }

    /**
     * @returns Array of selected Edges
     */
    selected_edges() { 
        this.edges.filter(edge => edge.selected); 
    }

    /**
     * Uniformly alters the 'active' property of each node to 'state'.
     * @param {bool} state - desired 'active' state
     */
    toggle_active(state) { 
        this.nodes.forEach(node => { node.active = state; }); 
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

                // Clean up lingering references to node
                for (let potential_parent of this.nodes) {
                    let i = potential_parent.children.indexOf(node);
                    if (i != -1)
                        potential_parent.children.splice(i, 1);
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
}


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
}

/**
 *
 * @param {Coordinate} position : Initial position of the VisualNode
 * @param {Number} id (optional) : Unique identifier for the VisualNode
 */
class VisualNode extends GraphNode {
    constructor(position, id = null) {
        super(id);
        if (!(position instanceof Coordinate)) throw "position must be a Coordinate instance";
        this.position = position;
    }
    move(deltaX, deltaY) {
        this.position.shift(deltaX, deltaY);
    }
}


/**
 *
 * @param {GraphNode} parent
 * @param {GraphNode} child
 */
class VisualEdge extends GraphEdge {
    constructor(parent, child) {
        super(parent, child);
    }
}
