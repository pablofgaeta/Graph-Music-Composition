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
    
    obj_to_html(obj, type) { return type === 'nodes' ? `${obj.id} - ${obj.displayText}` : `${obj.hash()} - ${obj.delay}` }

    update_edit() {
        for(const graph_obj_type of ['edges', 'nodes']) {
            const container = document.querySelector(`#edit-${graph_obj_type}-choices-container`);
            const graph_objs = graph_obj_type === 'nodes' ? this.nodes : Object.keys(this.edges);
    
            while(container.lastChild) { container.lastChild.remove(); }
    
            graph_objs.forEach(obj => {
                const graph_obj = graph_obj_type === 'nodes' ? obj : this.edges[obj];
                if (graph_obj.selected) {
                    const new_sample_bar = document.createElement('div');
                    new_sample_bar.className = 'txt-s section-sub-choice';
                    new_sample_bar.innerHTML = this.obj_to_html(graph_obj, graph_obj_type);
                    container.appendChild(new_sample_bar);
                }
            });
        }
    }

    select(obj) {
        obj.select();
        this.update_edit();
    }

    toggle_select(obj) {
        obj.toggle_select();
        this.update_edit();
    }

    select_in_rect(p1, p2) {
        super.select_in_rect(p1, p2);
        this.update_edit();
    }

    /**
     * Pushes a node to the GCMGraph
     * @param {GCMNode} parent
     */
    create_node(position, type) {
        const new_node = new GCMNode(position, type);
        super.push_node(new_node, GCMNode);
    }

    /**
     * Pushes a directed edge and registers key-value mapping by the edge's hash.
     * @param {GCMEdge} parent
     */
    create_edge(parent, child) {
        super.push_edge(new GCMEdge(parent, child), GCMEdge);
    }

    set_samples(toSample) {
        this.selected_nodes.forEach(node => {
            if (node.type == 'sample') {
                try {
                    node.displayText = toSample;
                    node.player.set_sample(toSample);
                }
                catch(err) {
                    console.log(`Could not set samples to : ${toSample}`);
                    console.log(err);
                }
            }
        });
        this.draw();
    }

    set_samples_by_num(toSampleNum) {
        this.selected_nodes.forEach(node => {
            if (node.type == 'sample') {
                const sampleNum = Math.min(AudioFileManager.files.length, toSampleNum)
                if (sampleNum > 0) {
                    node.displayText = AudioFileManager.files[sampleNum - 1];
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