// Singleton to control the state of the Application
let GCMInterface = (function() {
    let graph = new GCMGraph();

    let current_mouse_position = new Coordinate(0,0);

    /********* STATE CONTROLLER *************/
    
    // State of mousePress
    let mouse_down  = false;

    // Parent node when attempting to create new edge
    let potential_edge_parent  = null;

    // Selection states object
    let selection = {
        move : false,
        multi : false,
        start : null,
        end : null
    }
    let menu_open = false;

    // Lambda functions for getting states of the interface
    let special = (mouseEvent) => mouseEvent.shiftKey || mouseEvent.metaKey || mouseEvent.ctrlKey || mouseEvent.altKey;
    let edge_mode = (mouseEvent) => mouseEvent.shiftKey; 
    let node_mode = (mouseEvent) => mouseEvent.metaKey;
    let extend_selection_mode = (mouseEvent) => mouseEvent.altKey;
    let creating_edge = () => mouse_down && potential_edge_parent;
    let can_finish_edge = (end_node) => creating_edge() && end_node && potential_edge_parent != end_node;
    let dragging = () => { return selection.move && mouse_down; }
    let just_mouse_pressed = (event) => { return !special(event) && mouse_down; }

    // Initialize canvas when loaded or resized
    window.onresize = window.onload = () => { graph.update();  };

    graph.canvas.onmousedown = (event) => {
        let mouse = new Coordinate( 
            event.clientX + window.pageXOffset,  
            event.clientY + window.pageYOffset
        );
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

                // Clear any current selections and make new selection
                graph.clear_selections();
                if (hovered_node) hovered_node.select();
                if (hovered_edge) hovered_edge.select();
            }
            // RESET SELECTION STATE
            else {
                graph.clear_selections();
                selection.multi = false;
            }
        }
        // ALLOW MANUAL TOGGLING OF NODES
        else if (extend_selection_mode(event)) {
            if (hovered_node) hovered_node.toggle_selected();
            if (hovered_edge) hovered_edge.toggle_selected();
        }
        // REGISTER SELECTED STARTING NODE
        else if (edge_mode(event) && hovered_node) {
            potential_edge_parent = hovered_node;
        }
        // IF IN CREATE MODE, CREATE NEW NODE
        else if (node_mode(event)){
            graph.push_node(
                new GCMNode(mouse, graph.context, 'synth')
            );
        }
    }

    graph.canvas.onmousemove = (event) => {
        let mouse = new Coordinate( 
            event.clientX + window.pageXOffset,  
            event.clientY + window.pageYOffset
        );
        current_mouse_position.set(mouse.x, mouse.y);

        // IF REGISTERED EDGE DRAG
        if (creating_edge()) {
            let hover_self  = potential_edge_parent.hovering(mouse);
            // DRAW TEMPORARY EDGE LINE IF IN EDGE MODE AND NOT OVER SELF
            if (edge_mode(event) && !hover_self) {
                graph.draw_temporary_edge(potential_edge_parent, mouse);
            }
        }

        // First check if should move selection
        else if (dragging()) {
            graph.move_selected(new Coordinate(event.movementX, event.movementY));
        }

        // Now check if creating multi-selection box
        // Note that if dragging() multi-select can not get called
        else if ( just_mouse_pressed(event) ) {
            selection.end = mouse;
            selection.multi = true;
            graph.select_in_rect(selection.start, selection.end);
        }
    }

    graph.canvas.onmouseup = (event) => {
        let mouse = new Coordinate(
            event.clientX + window.pageXOffset, 
            event.clientY + window.pageYOffset
        );
        
        let hovered_node = graph.hovering_node(mouse);

        // IF CONNECTED EDGE TO EDGE, CREATE CONNECTION
        if (can_finish_edge(hovered_node)) {
            graph.push_edge(
                new GCMEdge( potential_edge_parent, hovered_node, graph.context )
            );
        }
    
        // Ensure Graph state resets to idle state
        selection.move = false;
        mouse_down = false;
        potential_edge_parent = null;
        graph.draw();
    };

    document.addEventListener('keydown', (event) => {
        if (event.key == 'e') {
            menu_open = !menu_open;
            if (menu_open) graph.spawn_menus(gui);
            else destroy_menus();
        }
        if (event.key == 'k') {
            graph.toggle_active(false);
        }
        if (event.key == 'x') {
            graph.trigger_selected();
        }
        if (event.key == 'Backspace' || event.key == 'Delete') {
            graph.delete_selected();

            // Ensure idle selection state
            selection.multi = false;
        }
    });


    /***** GUI CONTROLS *******/

    let gui = new dat.GUI();
    gui.domElement.onkeypress = () => {};
    let open_menus = [];


    const destroy_menus = () => {
        open_menus.forEach(gui_folder => gui.removeFolder(gui_folder));
    }
    

    let global_triggers = {
        'add-samples'      : () => AudioFileManager.add(),
        'trigger-selected' : () => graph.trigger_selected(),
        'kill-traversal'   : () => graph.toggle_active(false)
    };

    let GraphicsSettings = VisualGraph.settings;
    let NodeSettings = GCMNode.settings;
    let EdgeSettings = GCMEdge.settings;

    let graphicscontrollers = [];

    graphicscontrollers.push(gui.add(global_triggers, 'add-samples').name('Import samples'));
    graphicscontrollers.push(gui.add(global_triggers, 'trigger-selected').name('Flood Trigger'));
    graphicscontrollers.push(gui.add(global_triggers, 'kill-traversal').name('Kill Traversal'));

    let graphSpecs = gui.addFolder('Graphics Specs');
    let generalSpecs = graphSpecs.addFolder('General Specs');
    graphicscontrollers.push(generalSpecs.addColor(GraphicsSettings, 'background'));
    graphicscontrollers.push(generalSpecs.add(GraphicsSettings, 'width', 1, 20));
    graphicscontrollers.push(generalSpecs.add(GraphicsSettings, 'height', 1, 20));
    graphicscontrollers.push(generalSpecs.add(GraphicsSettings, 'menuWidth', 50, 300));

    let nodeSpecs = graphSpecs.addFolder('Node Specs');
    graphicscontrollers.push(nodeSpecs.add(NodeSettings, 'radius', 1, 100));
    graphicscontrollers.push(nodeSpecs.addColor(NodeSettings, 'idleColor'));
    graphicscontrollers.push(nodeSpecs.addColor(NodeSettings, 'selectionColor'));
    graphicscontrollers.push(nodeSpecs.add(NodeSettings, 'selectionWidth', 1, 20));
    graphicscontrollers.push(nodeSpecs.addColor(NodeSettings, 'activeColor'));

    let idSpecs = graphSpecs.addFolder('ID text Specs');
    graphicscontrollers.push(idSpecs.add(NodeSettings, 'idFont'));
    graphicscontrollers.push(idSpecs.add(NodeSettings, 'idFontSize', 5, 80));
    graphicscontrollers.push(idSpecs.addColor(NodeSettings, 'idColor'));

    let edgeSpecs = graphSpecs.addFolder('Edge Specs');
    graphicscontrollers.push(edgeSpecs.add(EdgeSettings, 'width', 1, 10));
    graphicscontrollers.push(edgeSpecs.addColor(EdgeSettings, 'color'));
    graphicscontrollers.push(edgeSpecs.add(EdgeSettings, 'arrowLen', 5, 40));
    graphicscontrollers.push(edgeSpecs.addColor(EdgeSettings, 'selectionColor'));


    // Handle updates
    for (let ctrlr of graphicscontrollers) {
        ctrlr.onChange(() => graph.update());
    }

    gui.remember(GraphicsSettings);
    gui.remember(NodeSettings);
    gui.remember(EdgeSettings);

    
    return {
        'graph' : graph,
        'gui' : gui
    }

    
})();
