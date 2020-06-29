
// Singleton to control the state of the Application
let Interface = (function() {
    let environment = new GraphController();
    let gui = new dat.GUI();


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
        let mouse = {
            x : event.clientX + window.pageXOffset, 
            y : event.clientY + window.pageYOffset
        };
        mouse_down = true;

        let existing_node = environment.hovering(mouse, 1);

        // HANDLE DRAG INSTRUCTIONS
        if (!special(event)) {
            environment.on_edge(mouse);
            selection_start = mouse;
            // HANDLE VALID SELECTION
            if (existing_node) {
                move_selection = true;
                if (!multi_selection) {
                    environment.graph.clear_selections();
                    existing_node.select();
                }
            }
            // RESET SELECTION STATE
            else {
                environment.graph.clear_selections();
                multi_selection = false;
            }
        }
        else if (extend_selection_mode(event) && existing_node) {
            existing_node.toggle_selected();
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

    // window.onmousemove = (event) => {
    //     let mouse = {
    //         x : event.clientX + window.pageXOffset, 
    //         y : event.clientY + window.pageYOffset
    //     };

    //     drag.style.top = (mouse.y) + 'px';
    //     drag.style.left = (mouse.x) + 'px';
    // }

    environment.canvas.onmousemove = (event) => {
        let mouse = {
            x : event.clientX + window.pageXOffset, 
            y : event.clientY + window.pageYOffset
        };


        // IF REGISTERED EDGE DRAG
        if (creating_edge()) {
            environment.draw_graph();

            let hover_other = environment.hovering(mouse, 1, parent_node);
            let hover_self  = parent_node.is_hovering(mouse, environment.specs.radius);

            // DRAW TEMPORARY EDGE LINE IF IN EDGE MODE AND NOT OVER SELF
            if (edge_mode(event) && !hover_self) {
                if (hover_other) { 
                    environment.draw_edge(parent_node.position, hover_other.position); 
                }
                else { environment.draw_moving_edge(parent_node.position, mouse); }
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
        let mouse = {
            x : event.clientX + window.pageXOffset, 
            y : event.clientY + window.pageYOffset
        };
        
        let existing_node = environment.hovering(mouse, 1);

        // IF CONNECTED EDGE TO EDGE, CREATE CONNECTION
        if (can_finish_edge(existing_node)) {
            parent_node.add_edge(existing_node);
        }
    
        // Ensure Graph state resets to idle state
        move_selection = false;
        mouse_down = false;
        parent_node = null;
        environment.draw_graph();
    };

    document.onkeydown = (event) => {
        if (event.key == 'x') {
            environment.trigger_selected();
        }
    };

    let audio_trigger = {
        'all' : () => environment.trigger_selected()
    };

    let graphicsSettings = environment.specs;
    let graphicscontrollers = [];

    graphicscontrollers.push(gui.add(audio_trigger, 'all').name('Flood Trigger'));

    let graphSpecs = gui.addFolder('Graphics Specs');
    graphicscontrollers.push(graphSpecs.addColor(graphicsSettings, 'background'));
    graphicscontrollers.push(graphSpecs.add(graphicsSettings, 'widthScale', 1, 20));
    graphicscontrollers.push(graphSpecs.add(graphicsSettings, 'heightScale', 1, 20));

    let nodeSpecs = graphSpecs.addFolder('Node Specs');
    graphicscontrollers.push(nodeSpecs.add(graphicsSettings, 'radius', 1, 100));
    graphicscontrollers.push(nodeSpecs.add(graphicsSettings, 'edgeWidth', 1, 10));
    graphicscontrollers.push(nodeSpecs.addColor(graphicsSettings, 'edgeColor'));
    graphicscontrollers.push(nodeSpecs.add(graphicsSettings, 'arrowLength', 5, 40));
    graphicscontrollers.push(nodeSpecs.add(graphicsSettings, 'selectionWidth', 1, 20));
    graphicscontrollers.push(nodeSpecs.addColor(graphicsSettings, 'selectionColor'));
    graphicscontrollers.push(nodeSpecs.addColor(graphicsSettings, 'idleNodeColor'));
    graphicscontrollers.push(nodeSpecs.addColor(graphicsSettings, 'playNodeColor'));


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
