function bounded(val, min, max) {
    return val >= min && val <= max;
}

/**
 * Implementation of GraphNode for 'Graph Music Composition' Visual/Audio App
 * @param {Coordinate} position - Initial position of the node
 * @param {CanvasRenderingContext2D} drawing_context : context for the node to draw on
 * @param {String} type - Accepted types are 'synth' or 'sample'
 * @param {Number} id (optional) - Identifier used to uniquely identify a node
 */
class GMCNode extends VisualNode {
    constructor(position, type = 'sample', name = 'kick', id = null) {
        super(position, id, name);
        this.set_player_type(type);
        this.active = true;
    }

    set_sample(toSample) {
        if (this.type == 'sample') {
            try {
                this.name = toSample;
                this.player.set_sample(this.name);
            }
            catch(err) {
                console.log(err);
                console.log(`Could not set samples to : ${toSample}`);
            }
        }
        return this;
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
                this.player = new GMCSynth();
                break
            case 'sample' :
                this.player = new GMCSampler(this.name);
                break;
            default :
                throw type + " is not a supported type.";
        }
    }

    get duration() { return this.player.duration; }

    get notes() { return this.player.instrument.notes; }

    trigger() {
        this.player.trigger();
    }
}

class GMCProbabilisticNode extends GMCNode {
    constructor(position, p_accept, type = 'sample', name = 'kick', id = null) {
        if (!bounded(this.p_accept, 0, 1)) throw 'Invalid probability';
        super(position, type, name, id);
        this.p_accept = p_accept;
    }

    trigger() {
        if (Math.random() < this.p_accept) {
            this.player.trigger();
        }
    }
}


class GMCEdge extends VisualEdge {
    constructor(parent, child, drawing_context) {
        if (! (parent instanceof GMCNode && child instanceof GMCNode)) {
            throw "Only accepts GMCNode (or derived classes)";
        }
        super(parent, child, drawing_context);
    }

    add2container(container) {
        const edge_container = document.createElement('div');
        edge_container.className = 'txt-s section-sub-choice';
        const edge_hash = document.createElement('div');
        edge_hash.innerHTML = `${this.hash()} : ${this.delay_scale.toFixed(3)}`;
        const edge_value = document.createElement('input');
        edge_value.type = 'text';
        edge_value.addEventListener('input', _ => {
            // Only match pos/neg int/float/frac expression
            const expr = edge_value.value.match(/^\s*-?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*$/);
            if (expr) {
                // console.log(expr[0],'=',eval(expr[0]));
                const scale = eval(expr[0]);
                this.set_delay(scale);
                edge_hash.innerHTML = `${this.hash()} : ${this.delay_scale.toFixed(3)}`;
            }
        });
        edge_container.appendChild(edge_hash);
        edge_container.appendChild(edge_value);
        container.appendChild(edge_container);
    }
}



class GMCGraph extends VisualGraph {
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
     * Pushes a node to the GMCGraph
     * @param {GMCNode} parent
     */
    create_node(position, type) {
        const new_node = new GMCNode(position, type);
        super.push_node(new_node, GMCNode);
        return new_node;
    }

    /**
     * Pushes a directed edge and registers key-value mapping by the edge's hash.
     * @param {GMCEdge} parent
     */
    create_edge(parent, child) {
        const new_edge = new GMCEdge(parent, child);
        super.push_edge(new_edge, GMCEdge);
        return new_edge;
    }

    set_samples(toSample) {
        this.selected_nodes.forEach(node => node.set_sample(toSample));
        this.draw();
    }
}