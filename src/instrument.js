import * as symbols from "./symbols.js"
export default class Instrument {
    constructor(name, color, sounds = []) {
        this.name = name
        this.color = color
        this.sounds = {}
        this.sym_map = {}
        this.sym_list = []
        for (const entry of sounds) {
            const sound_info = { letter: 'x', sym: symbols.DOT, ...entry }
            this.sym_list.push(sound_info.sym)
            this.sym_map[sound_info.letter] = sound_info.sym
            this.sounds[sound_info.sym] = sound_info.sound
        }
    }

    play(sym, volume = 1) {
        this.sounds[sym || this.sym_list[0]].play(volume)
    }
}