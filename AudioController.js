let AudioController = (function(type) {
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

    return {
        'JustRatios'  : JustRatios,
        'ETRelatives' : ETRelatives,
        Instrument : function(scale = JustRatios['mP']) {
            this.scale = scale;
            this.voice = {
                tone : new Tone.PolySynth(6, Tone.AMSynth, {
                        modulation : {
                            type : 'sine'
                        }
                }).toMaster(),
                release : '16n',
                base : 440
            };

            this.getJust = (mapping) => { return JustScale(mapping, this.voice.base); };
            this.getET   = (mapping) => { return ETScale(mapping, this.voice.base);   };
            
            this.notes = this.getJust(this.scale);

            this.randInt = (max) => Math.floor(Math.random() * Math.floor(max));
            this.playRandom = () => this.play(this.notes[this.randInt(this.notes.length - 1)]);

            this.play = (note) => {
                this.voice.tone.triggerAttackRelease(
                    note, this.voice.release
                );
            };
        }
    }
})();