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

    class Scale {
        constructor(opts = null) {
            this.base = 440;
            this.type = 'just';
            this.relatives = JustRatios['slendro'];

            Object.keys(opts).forEach(key => {
                if (this.hasOwnProperty(key))
                    this[key] = opts[key];
            });

            this.update_base(this.base);
        }
        
        update_base(base_frequency) {
            this.base = base_frequency;
            switch (this.type) {
                case 'just':
                    this.notes = JustScale(this.relatives, this.base);
                    break;
                case 'et':
                    this.notes = ETScale(this.relatives, this.base);
                    break;
                default:
                    throw "Scale type note implemented";
            }
            this.notes_str = this.notes.map(note => note + 'hz');
            return this.notes;
        }

        random_note() {
            return this.notes[ Math.floor(Math.random() * (this.notes.length - 1)) ];
        }
    }

    class Synth {
        constructor(opts) {
            this.polyphony = 10;
            this.release = '8n';
            Object.keys(opts).forEach(key => {
                if (this.hasOwnProperty(key))
                    this[key] = opts[key];
            });
            this.scale = new Scale(opts);

            this.tone = new Tone.PolySynth(this.polyphony, Tone.AMSynth, {
                modulation: {
                    type: 'sine'
                }
            }).toMaster();
        }

        get notes() {
            return this.scale.notes;
        }

        play_random() {
            this.play(this.scale.random_note());
        }

        /**
         * 
         * @param {Array} frequencies 
         */
        play_frequencies(frequencies) {
            if (Array.isArray(frequencies) || typeof frequencies == 'number') {
                this.tone.triggerAttackRelease(
                    frequencies, this.release
                );
            }
        }

        /**
         * 
         * @param {Array} scale_state_array 
         */
        play(scale_state_array) {
            if (! ( scale_state_array.hasOwnProperty('length') && scale_state_array.length == this.notes.length ) ) {
                throw "scale_state_array length must be equal to the current scale length";
            }

            let frequencies = [];
            for (let i = 0; i < scale_state_array.length; ++i) {
                if (scale_state_array[i])
                    frequencies.push(this.scale.notes_str[i]);
            }

            this.tone.triggerAttackRelease(
                frequencies, this.release
            );
        }
    }

    return {
        'JustRatios'  : JustRatios,
        'ETRelatives' : ETRelatives,
        'Synth'       : Synth
    }
})();

class AudioPlayer { 
    constructor() {

    }

    spawn_menu(gui, name) {
        throw "spawn_menu must be implemented in derived class";
    }

    trigger() {
        throw "Trigger must be implemented in derived class";
    }
}

let AudioFileManager = (() => {
    let __urls = {};

    let sample_input = document.createElement("input");
    sample_input.type = 'file';
    sample_input.accept = 'audio/*';
    sample_input.addEventListener("change", function() {
        const files = Object.values(this.files);
        let file;
        for (let i = 0; i < files.length; ++i) {
            file = files[i];
            if ( !Object.keys(__urls).includes(file.name)) {
                __urls[file.name] = URL.createObjectURL(file);
            }
        }
    }, false);

    let add = () => {
        sample_input.click();
    }

    return {
        url_map : __urls,
        get files() { return Object.keys(__urls)   },
        get urls()  { return Object.values(__urls) },
        'add'   : add
    }
})();

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
        this.note_states = new Array(this.instrument.notes.length).fill(false).fill(true, 0, 1);
    }

    update_note_inclusion(index, state) {
        if (index < this.note_states.length) {
            this.note_states[index] = state;
        }
    }

    /**
     * Returns the Synth's note length in ms
     */
    get duration() { 
        return Tone.Time(this.instrument.release).toSeconds() * 1000; 
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
        this.instrument.play_random(); 
    }

    /**
     * Generic trigger of the synth by user
     */
    trigger() { 
        this.instrument.play(this.note_states); 
    }

    update_base(frequency) {
        this.instrument.scale.update_base(frequency);
    }

    spawn_menu(gui, name) {
        // Begin folder
        let folder = gui.addFolder(name);

        // Base frequency
        folder.add(this.instrument.scale, 'base', 1, 1000)
            .name('base frequency')
            .onChange(frequency => this.instrument.scale.update_base(frequency) );

        // Allow inclusion of each relative frequencies from the instrument's scale
        for (let note_idx = 0; note_idx < this.note_states.length; ++note_idx) {
            folder.add(this.note_states, note_idx)
                .name('relative ' + note_idx)
                .onChange( (state) => { this.update_note_inclusion(note_idx, state); }
            );
        }
        return folder;
    }
}


class SamplePlayer extends AudioPlayer {
    constructor() {
        super();
        this.set_sample();
    }

    /** 
     * @param {Number} sample_index : Index of loaded samples to use for sampler
    */
    set_sample(sample_index = 0) {
        if (sample_index < AudioFileManager.urls.length) {
            this.sample_url = AudioFileManager.urls[sample_index];
            this.sampler = new Tone.Player(this.sample_url).toMaster();
        }
        else {
            console.log('Sample index is out of bounds. Sample not loaded');
        }
    }

    get duration() {
        return this.sampler.buffer.duration * 1000;
    }

    trigger() {
        if (this.sampler.buffer.loaded) {
            this.sampler.start();
        }
        else {
            console.log("Sample hasn't been loaded");
        }
    }

    spawn_menu(gui, name) {
        // Begin folder
        let folder = gui.addFolder(name);
        folder.add(this, 'sample_url', AudioFileManager.files)
            .name('Sample')
            .onChange(sample => { this.set_sample(AudioFileManager.files.indexOf(sample)) });
        return folder;
    }
}
