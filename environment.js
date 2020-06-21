class Node {
    constructor(obj, parents=null, children=null) {
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
            this.child.push(node);
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

// class Graph {
//     constructor(nodes=[]) {
//         this.nodes = nodes;
//         for (var node of this.nodes) {
//             if ( !(node instanceof Node) ) {
//                 throw "All entries must be instance of \'Node\' Class";
//             }
//         }
//         return this;
//     }

//     addNode(node) {
//         if (node instanceof Node) this.nodes.push(node);
//         else                      throw "Must be instance of \'Node\' Class";
//         return this;
//     }

//     toString() {
//         var nodenum = 0;
//         for (var node of this.nodes) {
//             console.log('Node ' + (++nodenum) + ' --\n' + node.toString());
//         }
//     }
// }

// function setup() {
//     createCanvas(windowWidth, windowHeight);
//     background(255,185,240);
// }

// function nodeStyle() { fill(255, 250, 205); noStroke(); }

// function mousePressed() {
//     nodeStyle();    
//     instrument = {'visual' : circle(mouseX, mouseY, 50), 
//                   'voice'  : defaultSynth()
//                  };
// }

// function windowResized() {
//     resizeCanvas(windowWidth, windowHeight);
//     background(255,185,240);
// }