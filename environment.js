class Node {
    constructor(position, parents=[], children=[]) {
        this.position = position;
        this.parents = parents;
        this.children = children;
    }

    addParent(node) {
        if (node instanceof Node) {
            this.parents.push(node);
        }
        else {
            throw "Must be instance of \'Node\' Class";
        }
    }

    addChild(node) {
        if (node instanceof Node) {
            this.children.push(node);
        }
        else {
            throw "Must be instance of \'Node\' Class";
        }
    }

    hasChild(node) {
        return this.children.includes(node);
    }
}

var environment = {
    nodes : [],
    addNode : function (node) { this.nodes.push(node); }
}