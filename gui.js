var gui = new dat.GUI();
var add_button = {new_instrument : newInstrumentControls};
var folders = [];

var InstrumentChoices = function() {
    this.number = 50;
    this.b00l   = false;
};

gui.add(add_button, 'new_instrument').name('Create Instrument');

function newInstrumentControls() {
    var choices = new InstrumentChoices();
    folders.push( gui.addFolder('Voice ' + folders.length) );
    folders[folders.length - 1].add(choices, 'number');
    folders[folders.length - 1].add(choices, 'b00l');
}
