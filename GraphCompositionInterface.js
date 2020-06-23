// Singleton to control the state of the Application
let GraphCompositionInterface = (function() {
    let environment = new Graph();
    let mouse_down  = false;
    let start_node  = null;

    function special(mouseEvent)                     { return mouseEvent.shiftKey || mouseEvent.metaKey || mouseEvent.ctrlKey || mouseEvent.altKey; }
    function create_edge(mouseEvent)                 { return mouseEvent.shiftKey || mouseEvent.altKey; }
    function create_node(mouseEvent)                 { return mouseEvent.metaKey; }
    function is_dragging()                           { return mouse_down && start_node; }
    function can_finish_edge(mouseEvent, end_node)   { return is_dragging() && end_node && create_edge(mouseEvent) && start_node != end_node;}

    window.onresize    = window.onload = () => { environment.set_canvas();  };

    window.onmousedown = (event) => {
        var mouse = {
            x : event.clientX + window.pageXOffset, 
            y : event.clientY + window.pageYOffset
        };
        var existing_node = environment.hovering(mouse);

        // REGISTER SELECTED STARTING NODE
        if (existing_node) {
            mouse_down = true;
            start_node = existing_node;
            environment.last_selected = existing_node;
        }
        // IF IN CREATE MODE, CREATE NEW NODE
        else if (create_node(event)){
            environment.add_node(new GraphNode(mouse));
            environment.draw_graph();
        }
    }

    window.onmousemove = (event) => {
        var mouse = {
            x : event.clientX + window.pageXOffset, 
            y : event.clientY + window.pageYOffset
        };

        // IF REGISTERED DRAG
        if (is_dragging()) {
            var hover_other = environment.hovering(mouse, 1, start_node);
            var hover_self  = start_node.is_hovering(mouse, environment.specs.radius); 
            // MOVE NODE IF NO SPECIAL KEYS PRESSED AND 
            if (!special(event)) {
                start_node.position = mouse;
            } 
            environment.draw_graph();

            // DRAW TEMPORARY EDGE LINE IF IN EDGE MODE AND NOT OVER SELF
            if (create_edge(event) && !hover_self) {
                if (hover_other) { environment.draw_edge(start_node.position, hover_other.position); }
                else { environment.draw_moving_edge(start_node.position, mouse); }
            }
        }
    }

    window.onmouseup = (event) => {
        var mouse = {
            x : event.clientX + window.pageXOffset, 
            y : event.clientY + window.pageYOffset
        };
        var existing_node = environment.hovering(mouse);
    
        // IF CONNECTED EDGE TO EDGE, CREATE CONNECTION
        if (can_finish_edge(event, existing_node))
            start_node.add_child(existing_node);
    
        // Ensure Graph state resets to idle state
        mouse_down = false;
        start_node = null;
        environment.draw_graph();
    };
    
    return environment;
})();

