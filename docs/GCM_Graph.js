/**
 * Implementation of GraphNode for 'Graph Music Composition' Visual/Audio App
 * @param {Coordinate} position - Initial position of the node
 * @param {CanvasRenderingContext2D} drawing_context : context for the node to draw on
 * @param {String} type - Accepted types are 'synth' or 'sample'
 * @param {Number} id (optional) - Identifier used to uniquely identify a node
 */
class GCMNode extends VisualNode {
    constructor(position, drawing_context, type = 'synth', id = null) {
        super(position, id, drawing_context);
        this.set_player_type(type);
        this.active = true;
    }

    set_player_type(type) {
        if (type == this.type) return;
        this.type = type;
        switch(type) {
            case 'synth' :
                this.player = new SynthPlayer();
                break
            case 'sample' :
                this.player = new SamplePlayer();
                break;
            default :
                throw type + " is not a supported type.";
        }
    }

    get duration() {
        return this.player.duration;
    }

    get notes() {
        return this.player.instrument.notes;
    }

    trigger() {
        this.player.trigger();
    }

    /**
     * Spawn an option menu to control the selected nodes on a graph
     * @param {dat.GUI} gui 
     */
    spawn_menu(gui) {
        return this.player.spawn_menu(gui, 'Node ' + this.id);
    }
}


class GCMEdge extends VisualEdge {
    constructor(parent, child, drawing_context) {
        if (! (parent instanceof GCMNode && child instanceof GCMNode)) {
            throw "Only accepts GCMNode (or derived classes)";
        }
        super(parent, child, drawing_context);
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

    spawn_menus(gui) {
        this.selected_nodes.forEach(node => node.spawn_menu(gui));
    }
}