/**
 * Implementation of GraphNode for 'Graph Music Composition' Visual/Audio App
 * @param {Coordinate} position - Initial position of the node
 * @param {CanvasRenderingContext2D} drawing_context : context for the node to draw on
 * @param {String} type - Accepted types are 'synth' or 'sample'
 * @param {Number} id (optional) - Identifier used to uniquely identify a node
 */
class GCMNode extends VisualNode {
    constructor(position, type = 'sample', id = null, displayText='kick') {
        super(position, id, displayText);
        this.set_player_type(type);
        this.active = true;
    }

    set_player_type(type) {
        if (type == this.type) return;
        this.type = type;
        switch(type) {
            case 'synth' :
                this.player = new GCMSynth();
                break
            case 'sample' :
                this.player = new GCMSampler(this.displayText);
                break;
            default :
                throw type + " is not a supported type.";
        }
    }

    get name() {
        return "Node " + this.id;
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
        this.open_menus = {};
    }

    /**
     * Pushes a node to the GCMGraph
     * @param {GCMNode} parent
     */
    create_node(position, type) {
        super.push_node(new GCMNode(position, type), GCMNode);
    }

    /**
     * Pushes a directed edge and registers key-value mapping by the edge's hash.
     * @param {GCMEdge} parent
     */
    create_edge(parent, child) {
        super.push_edge(new GCMEdge(parent, child), GCMEdge);
    }

    toggle_samples(toSampleNum) {
        this.selected_nodes.forEach(node => {
            if (node.type == 'sample') {
                const sampleIndex = Math.min(AudioFileManager.files.length, toSampleNum)
                if (sampleIndex > 0) {
                    node.displayText = AudioFileManager.files[sampleIndex - 1];
                    node.player.set_sample(node.displayText);
                }
                else {
                    console.log(`Sample index (${toSampleNum})`);
                    console.log(`Must be in range 0 < x < ${AudioFileManager.files.length}`);
                }
            }
        });
        super.draw();
    }
}