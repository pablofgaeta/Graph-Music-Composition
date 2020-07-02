class GraphObj { 
    static default_delay = 500;
    constructor() {
        this.selected = false;
    }
    select() { 
        this.selected = true;
    }
    toggle_selected() {
        this.selected = !this.selected;
    };
}

/**
 * Base Node class, which includes a selection state and optional id
 * @param {*} id (optional) - Unique identifier for the GraphNode
 */
class GraphNode extends GraphObj {
    constructor(id = null) {
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