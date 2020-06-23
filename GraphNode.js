class GraphNode {
    constructor(position, parents=[], children=[]) {
        this.position = position;
        this.parents = parents;
        this.children = children;
    }

    addParent(node) {
        if (node instanceof GraphNode) {
            this.parents.push(node);
        }
        else {
            throw "Must be instance of \'Node\' Class";
        }
    }

    addChild(node) {
        if (node instanceof GraphNode) {
            if (!this.hasChild(node)) this.children.push(node);
        }
        else {
            throw "Must be instance of \'Node\' Class";
        }
    }

    hasChild(node) {
        return this.children.includes(node);
    }

    hash() {
        return this.position.x.toString() + this.position.y.toString();
    }
}