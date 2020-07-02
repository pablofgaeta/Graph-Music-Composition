/**
 * Implementation of GraphNode for 'Graph Music Composition' Visual/Audio App
 * @param {Coordinate} position - Initial position of the node
 * @param {AudioPlayer} player - Endpoint for playing the node's instrument
 * @param {Number} id (optional) - Identifier used to uniquely identify a node
 */
class GCMNode extends VisualNode {
    constructor(position, player, drawing_context, id = null) {
        super(position, id, drawing_context);
        this.player = player;
        this.active = true;
    }

    get duration() {
        return this.player.duration();
    }

    draw(context) {
        super.draw(context, this.animating);
    }

    trigger() {
        this.player.trigger();
    }
}


class GCMEdge extends VisualEdge {
    constructor(parent, child, drawing_context) {
        if (! (parent instanceof GCMNode && child instanceof GCMNode)) {
            throw "Only accepts GCMNode (or derived classes)";
        }
        super(parent, child, drawing_context, parent.duration);
    }
}


class GCMGraph extends VisualGraph {
    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas = null) {
        super(canvas);
    }

    /**
     * Pushes a node to the GCMGraph
     * @param {GCMNode} parent
     */
    push_node(node) {
        super.push_node(node, GCMNode);
    }

    /**
     * Pushes a directed edge and registers key-value mapping by the edge's hash.
     * @param {GCMEdge} parent
     */
    push_edge(edge) {
        super.push_edge(edge, GCMEdge);
    }
}