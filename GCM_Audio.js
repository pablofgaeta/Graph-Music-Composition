let AudioController = (function() {
    // let keys = [ 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'' ];

    function JustScale(ratios, base_frequency) {
        return ratios.map(ratio => {
            return ratio * base_frequency + 'hz';
        });
    }
    
    function ETScale(delta_midis, base_midi_note) {
        return delta_midis.map(delta_midi => {
            return Tone.Frequency(delta_midi + base_midi_note, 'midi') + 'hz';
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

    let AudioPlayer = function(opts={}) {
        if (!opts) throw "Accepts non-null options object";

        let type = opts.hasOwnProperty('type') ? opts.type : 'Synth';
        delete opts.type;

        switch (type) {
            case 'Synth' :
                let synth_opts = {
                    base_frequency : 440,
                    polyphony  : 10,
                    scale : JustRatios['mP']
                };
                // Add any new options
                Object.keys(opts).forEach(key => { synth_opts[key] = opts[key]; });
                return __Synth(synth_opts);
            case 'Sampler' :
                return null;
            default :
                throw "AudioPlayer type \'" + type + "\' does not exist."
        }
    }

    return {
        'JustRatios'  : JustRatios,
        'ETRelatives' : ETRelatives,
        'Synth'       : function(opts) {
            let synth_opts = {
                base_frequency : 440,
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
                base : synth_opts.base_frequency
            };
    
            this.getJust = (mapping) => { return JustScale(mapping, this.voice.base); };
            this.getET   = (mapping) => { return ETScale(mapping, this.voice.base);   };
            
            this.notes = this.getJust(this.scale);
    
            this.randInt = (max) => Math.floor(Math.random() * Math.floor(max));
            this.playRandomNote = () => this.play(this.notes[this.randInt(this.notes.length - 1)]);
    
            this.play = (note) => {
                this.voice.tone.triggerAttackRelease(
                    note, this.voice.release
                );
            };
        }
    }
})();

/**
 * 
 * @param {Number} base_frequency - frequency in hz
 */
let SynthPlayer = function(base_frequency = 440) {
    this.base_frequency = base_frequency;
    this.instrument = new AudioController.Synth({
        'base_frequency' : base_frequency
    });
    this.frequencies = [base_frequency];
    this.animating = false;

    /**
     * Returns the Synth's note length in ms
     */
    this.duration = () => Tone.Time(this.instrument.voice.release).toSeconds() * 1000;
    this.freq_str = (freqs = this.frequencies) => freqs.map(freq => freq + 'hz');

    /**
     * Plays a note or chord based on the input frequencies and current instrument
     * @param {String} - freqs : String or array of strings representing frequencies to play
     */
    this.play = (freqs = this.freq_str() ) => {
        this.instrument.play(freqs);
    };

    /**
     * Plays a random note from the current instrument's scale
     */
    this.random = () => this.instrument.playRandomNote();

    /**
     * Generic trigger of the synth by user
     */
    this.trigger = () => this.play();
};

let SamplePlayer = function(sample) {
    this.sample = sample;
    this.animating = false;
};