class Node {
    constructor(obj, parents=[], children=[]) {
        this.obj = obj;
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

    toString() {
        return '\tObject   : ' + this.obj.toString() + '\n' +
               '\tParents  : ' + this.parents.toString() + '\n' +
               '\tChildren : ' + this.children.toString();
    }
}

var environment = {
    nodes : [],
    addNode : function (node) { this.nodes.push(node); }
}