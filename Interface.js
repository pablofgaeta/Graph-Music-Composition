// Singleton to control the state of the Application
let Interface = (function() {
    let environment = new GraphController();
    let gui = new dat.GUI();

    let current_mouse_position = new Coordinate(0,0);


    /********* STATE CONTROLLER *************/
    
    // State of mousePress
    let mouse_down  = false;

    // Parent node when attempting to create new edge
    let parent_node  = null;

    // Selection variables
    let move_selection = false;
    let multi_selection = false;
    let selection_start = null;
    let selection_end = null;


    // Lambda functions for getting states of the interface
    let special = (mouseEvent) => mouseEvent.shiftKey || mouseEvent.metaKey || mouseEvent.ctrlKey || mouseEvent.altKey;
    let edge_mode = (mouseEvent) => mouseEvent.shiftKey; 
    let node_mode = (mouseEvent) => mouseEvent.metaKey;
    let extend_selection_mode = (mouseEvent) => mouseEvent.altKey;
    let creating_edge = () => mouse_down && parent_node;
    let can_finish_edge = (end_node) => creating_edge() && end_node && parent_node != end_node;

    // Initialize canvas when loaded or resized
    window.onresize = window.onload = () => { environment.update_canvas();  };

    environment.canvas.onmousedown = (event) => {
        let mouse = new Coordinate( 
            event.clientX + window.pageXOffset,  
            event.clientY + window.pageYOffset
        );
        mouse_down = true;


        let existing_node = environment.hovering_node(mouse, 1);
        let existing_edge = environment.hovering_edge(mouse);

        // HANDLE DRAG INSTRUCTIONS
        if (!special(event)) {
            selection_start = mouse;
            // HANDLE VALID SELECTION
            if (existing_node || existing_edge) {
                move_selection = existing_node ? true : false;
                if (!multi_selection) {
                    environment.graph.clear_selections();
                    if (existing_node) existing_node.select();
                    if (existing_edge) existing_edge.select();
                }
            }
            // RESET SELECTION STATE
            else {
                environment.graph.clear_selections();
                multi_selection = false;
            }
        }
        else if (extend_selection_mode(event)) {
            if (existing_node) existing_node.toggle_selected();
            if (existing_edge) existing_edge.toggle_selected();
        }
        // REGISTER SELECTED STARTING NODE
        else if (edge_mode(event) && existing_node) {
            parent_node = existing_node;
        }
        // IF IN CREATE MODE, CREATE NEW NODE
        else if (node_mode(event)){
            environment.graph.create_node(mouse);
            environment.draw_graph();
        }
    }

    environment.canvas.onmousemove = (event) => {
        let mouse = new Coordinate( 
            event.clientX + window.pageXOffset,  
            event.clientY + window.pageYOffset
        );
        current_mouse_position.set(mouse.x, mouse.y);

        // IF REGISTERED EDGE DRAG
        if (creating_edge()) {
            environment.draw_graph();
            let hover_self  = parent_node.is_hovering(mouse, environment.specs.radius);
            // DRAW TEMPORARY EDGE LINE IF IN EDGE MODE AND NOT OVER SELF
            if (edge_mode(event) && !hover_self) {
                environment.draw_temp_edge(parent_node, mouse);
            }
        }

        // First check if should move selection
        else if (move_selection && mouse_down) {
            environment.move_selected({x : event.movementX, y : event.movementY});
            environment.draw_graph();
        }
        // Now check if creating multi-selection box
        else if (!special(event) && mouse_down) {
            selection_end = mouse;
            multi_selection = true;
            environment.select_in_rect(selection_start, selection_end);
            environment.draw_graph();
            environment.draw_rect(selection_start, selection_end);
        }
    }

    environment.canvas.onmouseup = (event) => {
        let mouse = new Coordinate(
            event.clientX + window.pageXOffset, 
            event.clientY + window.pageYOffset
        );
        
        let existing_node = environment.hovering_node(mouse, 1);

        // IF CONNECTED EDGE TO EDGE, CREATE CONNECTION
        if (can_finish_edge(existing_node)) {
            environment.graph.create_edge(parent_node, existing_node);
        }
    
        // Ensure Graph state resets to idle state
        move_selection = false;
        mouse_down = false;
        parent_node = null;
        environment.draw_graph();
    };

    document.onkeydown = (event) => {
        if (event.key == 'e') {
            environment.spawn_menu(current_mouse_position);
        }
        if (event.key == 'x') {
            environment.trigger_selected();
        }
        if (event.key == 'Backspace' || event.key == 'Delete') {
            environment.graph.delete_selected();
            environment.draw_graph();

            // Ensure idle selection state
            multi_selection = false;
        }
    };

    let global_triggers = {
        'trigger-selected' : () => environment.trigger_selected(),
        'kill-all'         : () => environment.kill()
    };

    let graphicsSettings = environment.specs;
    let graphicscontrollers = [];

    graphicscontrollers.push(gui.add(global_triggers, 'trigger-selected').name('Flood Trigger'));
    graphicscontrollers.push(gui.add(global_triggers, 'kill-all').name('Kill Traversal'));

    let graphSpecs = gui.addFolder('Graphics Specs');
    let generalSpecs = graphSpecs.addFolder('General Specs');
    graphicscontrollers.push(generalSpecs.addColor(graphicsSettings, 'background'));
    graphicscontrollers.push(generalSpecs.add(graphicsSettings, 'widthScale', 1, 20));
    graphicscontrollers.push(generalSpecs.add(graphicsSettings, 'heightScale', 1, 20));
    graphicscontrollers.push(generalSpecs.add(graphicsSettings, 'menuWidth', 50, 300));

    let nodeSpecs = graphSpecs.addFolder('Node Specs');
    graphicscontrollers.push(nodeSpecs.add(graphicsSettings, 'radius', 1, 100));
    graphicscontrollers.push(nodeSpecs.addColor(graphicsSettings, 'idleNodeColor'));
    graphicscontrollers.push(nodeSpecs.addColor(graphicsSettings, 'selectionColor'));
    graphicscontrollers.push(nodeSpecs.add(graphicsSettings, 'selectionWidth', 1, 20));
    graphicscontrollers.push(nodeSpecs.addColor(graphicsSettings, 'playNodeColor'));

    let edgeSpecs = graphSpecs.addFolder('Edge Specs');
    graphicscontrollers.push(edgeSpecs.add(graphicsSettings, 'edgeWidth', 1, 10));
    graphicscontrollers.push(edgeSpecs.addColor(graphicsSettings, 'edgeColor'));
    graphicscontrollers.push(edgeSpecs.add(graphicsSettings, 'arrowLength', 5, 40));

    let idSpecs = graphSpecs.addFolder('ID text Specs');
    graphicscontrollers.push(idSpecs.add(graphicsSettings, 'idFont'));
    graphicscontrollers.push(idSpecs.add(graphicsSettings, 'idFontSize', 5, 80));
    graphicscontrollers.push(idSpecs.addColor(graphicsSettings, 'idColor'));

    for (let ctrlr of graphicscontrollers) {
        ctrlr.onChange(() => environment.update_canvas());
    }

    gui.remember(graphicsSettings);
    
    return {
        'environment' : environment,
        'gui' : gui
    }
})();
