let AudioController = (function() {
    // let keys = [ 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'' ];

    function JustScale(ratios, base_frequency) {
        return ratios.map(ratio => {
            return ratio * base_frequency;
        });
    }
    
    function ETScale(delta_midis, base_midi_note) {
        return delta_midis.map(delta_midi => {
            return Tone.Frequency(delta_midi + base_midi_note, 'midi');
        });
    }

    let JustRatios = {
        'slendro' : [1, 1.3125, 1.5, 1.75, 1.875, 2],
        'mP'      : [1, 32/27, 4/3, 3/2, 16/9, 2]
    };
    
    let ETRelatives = {
        'M'       : [0, 2, 4, 5, 7, 9, 11, 12],
        'MP'      : [0, 2, 4, 7, 9]
    };

    let Synth = function(opts) {
        let synth_opts = {
            base : 440,
            polyphony  : 10,
            scale : JustRatios['mP']
        };
        Object.keys(opts).forEach(key => { synth_opts[key] = opts[key]; });

        this.scale = synth_opts.scale;
        this.voice = {
            tone : new Tone.PolySynth(synth_opts.polyphony, Tone.AMSynth, {
                    modulation : {
                        type : 'sine'
                    }
            }).toMaster(),
            release : '8n',
            base : synth_opts.base
        };

        this.getJust = (mapping) => { return JustScale(mapping, this.voice.base); };
        this.getET   = (mapping) => { return ETScale(mapping, this.voice.base);   };
        
        this.notes = this.getJust(this.scale);

        this.randInt = (max) => Math.floor(Math.random() * Math.floor(max));
        this.playRandomNote = () => this.play(this.notes[this.randInt(this.notes.length - 1)]);


        this.play = (notes) => {
            if (Array.isArray(notes)) {
                this.voice.tone.triggerAttackRelease(
                    notes.map(note => note + 'hz'), this.voice.release
                );
            }
        };
    }

    // let AudioPlayer = function(opts={}) {
    //     if (!opts) throw "Accepts non-null options object";

    //     let type = opts.hasOwnProperty('type') ? opts.type : 'Synth';
    //     delete opts.type;

    //     switch (type) {
    //         case 'Synth' :
    //             let synth_opts = {
    //                 base_frequency : 440,
    //                 polyphony  : 10,
    //                 scale : JustRatios['mP']
    //             };
    //             // Add any new options
    //             Object.keys(opts).forEach(key => { synth_opts[key] = opts[key]; });
    //             return new __Synth(synth_opts);
    //         case 'Sampler' :
    //             return null;
    //         default :
    //             throw "AudioPlayer type \'" + type + "\' does not exist."
    //     }
    // }

    return {
        'JustRatios'  : JustRatios,
        'ETRelatives' : ETRelatives,
        'Synth'       : Synth
    }
})();

class AudioPlayer { 
    constructor() {
    }

    trigger() {
        throw "Trigger must be implemented in derived class";
    }
}

/**
 *
 * @param {Number} base_frequency - frequency in hz
 */
class SynthPlayer extends AudioPlayer {
    static default_opts = {
        'base' : 440
    };

    constructor(opts = SynthPlayer.default_opts) {
        super();
        // Add any new options
        this.current_ops = {...SynthPlayer.default_opts};
        Object.keys(opts).forEach(key => { this.current_ops[key] = opts[key]; });

        this.instrument = new AudioController.Synth(opts);
        this.note_states = {0 : true};
        for (let i = 1; i < this.instrument.notes.length; ++i) {
            this.note_states[i] = false;
        }
        this.playing_notes = [this.instrument.voice.base];
    }

    // get notes() {
    //     return this.instrument.notes;
    // }

    update_note_inclusion(index, state) {
        console.log(index, state);
        if (index < this.instrument.notes.length) {
            let note = this.instrument.notes[index];
            let pos = this.playing_notes.indexOf(note);
            let included = pos != -1;
            if (state && !included) {
                this.playing_notes.push(note);
                console.log('adding ' + note + ' - ' + this.playing_notes);
            }
            if (!state && included) {
                this.playing_notes.splice(pos, 1);
                console.log('removing ' + note + ' - ' + this.playing_notes);
            }
        }
    }

    // add_note(index) {
    //     this.playing_notes.push()
    // }

    /**
     * Returns the Synth's note length in ms
     */
    get duration() { 
        return Tone.Time(this.instrument.voice.release).toSeconds() * 1000; 
    }

    get notes_str() { 
        return this.instrument.notes.map(freq => freq + 'hz'); 
    }

    /**
     * Plays a note or chord based on the input frequencies and current instrument
     * @param {String} - freqs : String or array of strings representing frequencies to play
     */
    __play(freqs = this.playing_notes) {
        this.instrument.play(freqs);
    };

    /**
     * Plays a random note from the current instrument's scale
     */
    random() { 
        this.instrument.playRandomNote(); 
    }

    /**
     * Generic trigger of the synth by user
     */
    trigger() { 
        this.__play(); 
    }
}


class SamplePlayer extends AudioPlayer {
    constructor(sample) {
        this.sample = sample;
        this.animating = false;
    }
}
