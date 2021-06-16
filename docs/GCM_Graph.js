/**
 * Implementation of GraphNode for 'Graph Music Composition' Visual/Audio App
 * @param {Coordinate} position - Initial position of the node
 * @param {CanvasRenderingContext2D} drawing_context : context for the node to draw on
 * @param {String} type - Accepted types are 'synth' or 'sample'
 * @param {Number} id (optional) - Identifier used to uniquely identify a node
 */
class GCMNode extends VisualNode {
    constructor(position, type = 'sample', id = null, name='kick') {
        super(position, id, name);
        this.set_player_type(type);
        this.active = true;
    }


    add2container(container) {
        const node_div = document.createElement('div');
        node_div.className = 'txt-s section-sub-choice';
        node_div.innerHTML = this.toString();
        container.appendChild(node_div);
    }

    set_player_type(type) {
        if (type == this.type) return;
        this.type = type;
        switch(type) {
            case 'synth' :
                this.player = new GCMSynth();
                break
            case 'sample' :
                this.player = new GCMSampler(this.name);
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
}


class GCMEdge extends VisualEdge {
    constructor(parent, child, drawing_context) {
        if (! (parent instanceof GCMNode && child instanceof GCMNode)) {
            throw "Only accepts GCMNode (or derived classes)";
        }
        super(parent, child, drawing_context);
    }

    add2container(container) {
        const edge_container = document.createElement('div');
        edge_container.className = 'txt-s section-sub-choice';
        const edge_hash = document.createElement('div');
        edge_hash.innerHTML = `${this.hash()} - ${this.delay_scale}`;
        const edge_value = document.createElement('input');
        edge_value.type = 'text';
        edge_value.addEventListener('input', _ => {
            // Only match pos/neg int/float/frac expression
            const expr = edge_value.value.match(/^\s*-?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*$/);
            if (expr) {
                // console.log(expr[0],'=',eval(expr[0]));
                const scale = eval(expr[0]);
                this.set_delay(scale);
            }
        });
        edge_container.appendChild(edge_hash);
        edge_container.appendChild(edge_value);
        container.appendChild(edge_container);
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
    
    update_edit() {
        const edit_edge_container = document.querySelector(`#edit-edges-choices-container`);
        const edit_node_container = document.querySelector(`#edit-nodes-choices-container`);

        while(edit_edge_container.lastChild)  { edit_edge_container.lastChild.remove();  }
        for (let edge of this.selected_edges) {
            edge.add2container(edit_edge_container);
        }

        while(edit_node_container.lastChild)  { edit_node_container.lastChild.remove();  }
        for (let node of this.selected_nodes) {
            node.add2container(edit_node_container);
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
                    node.name = toSample;
                    node.player.set_sample(node.name);
                }
                catch(err) {
                    console.log(err);
                    console.log(`Could not set samples to : ${toSample}`);
                }
            }
        });
        this.draw();
    }
}