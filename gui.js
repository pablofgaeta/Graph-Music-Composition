// GUI BAR

var gui = new dat.GUI();
// var add_button = {new_instrument : newInstrumentControls};
// var folders = [];

// var InstrumentChoices = function() {
//     this.number = 50;
//     this.b00l   = false;
// };

// gui.add(add_button, 'new_instrument').name('Create Instrument');

// function newInstrumentControls() {
//     var choices = new InstrumentChoices();
//     folders.push( gui.addFolder('Voice ' + folders.length) );
//     folders[folders.length - 1].add(choices, 'number');
//     folders[folders.length - 1].add(choices, 'b00l');
// }

var graphicsSettings = GraphCompositionInterface.specs;
var graphicscontrollers = [];

var graphSpecs = gui.addFolder('Graphics Specs');
graphicscontrollers.push(graphSpecs.addColor(graphicsSettings, 'background'));
graphicscontrollers.push(graphSpecs.add(graphicsSettings, 'canvasWidth', 100, 10000));
graphicscontrollers.push(graphSpecs.add(graphicsSettings, 'canvasHeight', 100, 10000));

var nodeSpecs = graphSpecs.addFolder('Node Specs');
graphicscontrollers.push(nodeSpecs.add(graphicsSettings, 'radius', 1, 100));
graphicscontrollers.push(nodeSpecs.add(graphicsSettings, 'edgeWidth', 1, 10));
graphicscontrollers.push(nodeSpecs.add(graphicsSettings, 'selectedWidth', 1, 20));
graphicscontrollers.push(nodeSpecs.addColor(graphicsSettings, 'circleColor'));

var idSpecs = graphSpecs.addFolder('ID text Specs');
graphicscontrollers.push(idSpecs.add(graphicsSettings, 'idFont'));
graphicscontrollers.push(idSpecs.add(graphicsSettings, 'idFontSize', 5, 80));
graphicscontrollers.push(idSpecs.addColor(graphicsSettings, 'idColor'));

for (var ctrlr of graphicscontrollers) {
    ctrlr.onChange(() => GraphCompositionInterface.set_canvas());
}

gui.remember(graphicsSettings);




