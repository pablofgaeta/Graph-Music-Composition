function apply_notes(relativedict, base_frequency, type='just') {
    var result = {...relativedict};
    for (var key in result) {
        if (result.hasOwnProperty(key)) {
            if (type == 'just') { result[key] *= base_frequency; }
            else if (type == 'ET') { result[key] += base_frequency; }
        }
        else { console.log('object does not have property: ' + key); }
    }
    return result;
}

function defaultSynth() {
    return new Tone.PolySynth(2, Tone.AMSynth, {
        modulation : {
            type : 'sine'
        }
    }).toMaster();
}

synth = defaultSynth();
synth.volume.value = 5;

var basefreq = 100;
var slendro = {'a' : 1, 's' : 1.3125, 'd' : 1.5, 'f' : 1.75, 'h' : 1.875, 'j' : 2};
var synthlen = '16n';

var notes = {
    freq : apply_notes(slendro, basefreq),
    length : '16n'
};


document.onkeydown = function(event) {
    // event.preventDefault();
    if (event.repeat) return;
    if (notes.freq.hasOwnProperty(event.key)) {
        synth.triggerAttackRelease(notes.freq[event.key], notes.length);
    }
}