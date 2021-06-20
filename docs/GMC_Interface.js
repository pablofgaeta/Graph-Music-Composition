const Styles = {
    blue : '#89cff0', white : '#ffffff', gray : '#9a9a9a', yellow : '#fdfd96', red : '#e19191', green : '#86eda6', lightGray : '#a5a5a5a5', black : '#000000',
    ucsc : {
        blue : '#003c6c', lightBlue : '#13a5dc', yellow : '#ffde66', green : '#93c02d', pink : '#da216daa', lightPink : '#f05d9a'
    },
    surveyjs : {
        "lightGreen" : "#1ab395", "darkNavy" : "#2A414C"
    }
};

// Singleton to control the state of the Application
const GMC = (function() {
    let graph = new GMCGraph(document.getElementById('canvas'));

    /********* STATE CONTROLLER *************/
    
    // State of mousePress
    let mouse_down  = false;

    // Parent node when attempting to create new edge
    let potential_edge_parent  = null;

    // Selection states object
    let selection = {
        move : false,
        start : null,
    }

    // Lambda functions for getting states of the interface
    const special = (mouseEvent) => mouseEvent.shiftKey || mouseEvent.metaKey || mouseEvent.ctrlKey || mouseEvent.altKey;
    const edge_mode = (mouseEvent) => mouseEvent.altKey; 
    const node_mode = (mouseEvent) => mouseEvent.metaKey;
    const extend_selection_mode = (mouseEvent) => mouseEvent.shiftKey;
    const creating_edge = () => mouse_down && potential_edge_parent;
    const can_finish_edge = (end_node) => creating_edge() && end_node && potential_edge_parent != end_node;
    const dragging = () => { return selection.move && mouse_down; }
    const just_mouse_pressed = (event) => { return !special(event) && mouse_down; }

    // Initialize canvas when loaded or resized
    window.onresize = window.onload = () => { graph.update(); };

    const TitleContainer = document.querySelector('#title-container');
    const compute_client_coords = (event) => new Coordinate( 
        event.clientX + window.pageXOffset,  
        event.clientY + window.pageYOffset - parseInt(TitleContainer.clientHeight)
    );
    let current_mouse_position = compute_client_coords({clientX : 0, clientY : 0});

    graph.canvas.onmousedown = (event) => {
        let mouse = compute_client_coords(event);
        mouse_down = true;

        let hovered_node = graph.hovering_node(mouse);
        let hovered_edge = graph.hovering_edge(mouse);

        // HANDLE DRAG INSTRUCTIONS
        if ( just_mouse_pressed(event) ) {
            selection.start = mouse;
            // HANDLE VALID SELECTION OF NODE OR EDGE
            if (hovered_node || hovered_edge) {
                // Movable if currently hovering a node
                selection.move = hovered_node ? true : false;

                if (graph.selected_nodes.length <= 1) {
                    console.log("Clear selections and make instantaneous selection");
                    // Clear any current selections and make new selection
                    graph.clear_selections();
                    if (hovered_node) graph.select(hovered_node);
                    if (hovered_edge) graph.select(hovered_edge);
                }
            }
            // RESET SELECTION STATE
            else {
                console.log("reset selection");
                graph.clear_selections();
            }
        }
        // ALLOW MANUAL TOGGLING OF NODES
        else if (extend_selection_mode(event)) {
            console.log("manual node selection extension");
            if (hovered_node) graph.toggle_select(hovered_node);
            if (hovered_edge) graph.toggle_select(hovered_edge);
        }
        // REGISTER SELECTED STARTING NODE
        else if (edge_mode(event) && hovered_node) {
            console.log("set potential edge parent");
            potential_edge_parent = hovered_node;
        }
        // IF IN CREATE MODE, CREATE NEW NODE
        else if (node_mode(event)){
            console.log("create new node");
            graph.create_node(mouse);
        }
    }

    graph.canvas.onmousemove = (event) => {
        let mouse = compute_client_coords(event);
        current_mouse_position.set(mouse.x, mouse.y);

        // First check if should move selection
        if (dragging()) {
            graph.move_selected(new Coordinate(event.movementX, event.movementY));
        }

        // Now check if creating multi-selection box
        // Note that if dragging() multi-select can not get called
        else if ( just_mouse_pressed(event) ) {
            graph.select_in_rect(selection.start, mouse);
        }

        // IF REGISTERED EDGE DRAG
        else if (creating_edge()) {
            let hover_self  = potential_edge_parent.hovering(mouse);
            // DRAW TEMPORARY EDGE LINE IF IN EDGE MODE AND NOT OVER SELF
            if (edge_mode(event) && !hover_self) {
                graph.draw_temporary_edge(potential_edge_parent, mouse);
            }
        }
    }

    graph.canvas.onmouseup = (event) => {
        let mouse = compute_client_coords(event);
        
        let hovered_node = graph.hovering_node(mouse);

        // IF CONNECTED EDGE TO EDGE, CREATE CONNECTION
        if (can_finish_edge(hovered_node)) {
            graph.create_edge(potential_edge_parent, hovered_node);
        }
    
        // Ensure Graph state resets to idle state
        selection.move = false;
        mouse_down = false;
        potential_edge_parent = null;
        graph.draw();
    };

    graph.canvas.addEventListener('keydown', (event) => {
        if (!isNaN(event.key) && Number(event.key) < AudioFileManager.files.length) {
            graph.set_samples(AudioFileManager.files[Number(event.key)]);
        }
        if (event.key == 'k') {
            graph.toggle_active(false);
        }
        if (event.key == 'x') {
            graph.trigger_selected();
        }
        if (event.key == 'Backspace' || event.key == 'Delete') {
            graph.delete_selected();
        }
    });
    return graph;
})();

const SampleChoicesContainer = document.querySelector('#samples-choices-container');
const SidebarSelectors = document.querySelectorAll("div[id $= 'selector']");

(async function sidebar_setup() {
    for (const sample of ['kick', 'snare', 'hihat', 'tom', 'cowbell']) {
        try {
            const sample_file = await fetch(`./Resources/drums/${sample}.wav`);
            AudioFileManager.add(sample, sample_file.url);
            const new_sample_bar = document.createElement('div');
            new_sample_bar.addEventListener('click', () => {
                GMC.set_samples(sample);
            })
            new_sample_bar.className = 'txt-s section-sub-choice';
            new_sample_bar.innerHTML = `- ${sample}`;
            SampleChoicesContainer.appendChild(new_sample_bar);
        } catch (e) {console.error(e)}
    }
    for (const section of Array.from(SidebarSelectors)) {
        const section_title = section.id.replace('-selector', '');
        console.log(section_title);
        section.addEventListener('click', () => {
            const EMChoicesContainer = document.querySelector(`#${section_title}-choices-container`);
            EMChoicesContainer.style.display = EMChoicesContainer.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    generate_test_graph();
})();

function save_graph() {
    const info = {
        traverse_delay : GraphObj.traverse_delay,
        node_info : GMC.nodes.map(node => {
            return {
                id : node.id,
                position : {x : node.position.x, y : node.position.y},
                name : node.name
            }}),
        edge_info : Object.values(GMC.edges).map(edge => {
            return {
                parent_id : edge.parent.id,
                child_id  : edge.child.id,
                delay_scale : edge.delay_scale
            }
        })
    }
    console.log(JSON.stringify(info, null, 4));
}

function generate_test_graph() {
    const sidenav_width = document.getElementById('sidenav-container').clientWidth;
    
    const scale = 200;
    GMC.create_node(new Coordinate(sidenav_width + 300 + scale * Math.cos(Math.PI * 0 / 2), 300 + scale * Math.sin(Math.PI * 0 / 2), 'sample')).set_sample('kick');
    GMC.create_node(new Coordinate(sidenav_width + 300 + scale * Math.cos(Math.PI * 1 / 2), 300 + scale * Math.sin(Math.PI * 1 / 2), 'sample')).set_sample('kick');
    GMC.create_node(new Coordinate(sidenav_width + 300 + scale * Math.cos(Math.PI * 2 / 2), 300 + scale * Math.sin(Math.PI * 2 / 2), 'sample')).set_sample('kick');
    GMC.create_node(new Coordinate(sidenav_width + 300 + scale * Math.cos(Math.PI * 3 / 2), 300 + scale * Math.sin(Math.PI * 3 / 2), 'sample')).set_sample('kick');
    GMC.create_node(new Coordinate(sidenav_width + 300, 250), 'sample').set_sample('hihat');
    GMC.create_node(new Coordinate(sidenav_width + 300, 400), 'sample').set_sample('hihat');
    GMC.create_node(new Coordinate(sidenav_width + 50, 500), 'sample').set_sample('snare');

    const demo_nodes = GMC.nodes;
    GMC.create_edge(demo_nodes[0], demo_nodes[1]).set_delay(0.5);
    GMC.create_edge(demo_nodes[1], demo_nodes[2]).set_delay(0.5);
    GMC.create_edge(demo_nodes[2], demo_nodes[3]).set_delay(1/6);
    GMC.create_edge(demo_nodes[3], demo_nodes[0]).set_delay(1/6);
    GMC.create_edge(demo_nodes[3], demo_nodes[4]).set_delay(1/6);
    GMC.create_edge(demo_nodes[4], demo_nodes[5]).set_delay(1/4);
    GMC.create_edge(demo_nodes[2], demo_nodes[6]).set_delay(1);

    // global tempo
    GraphObj.traverse_delay = 750;
}