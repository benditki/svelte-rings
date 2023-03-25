import * as symbols from "./symbols.js"
export default class Instrument {
    constructor(name, color, sounds = []) {
        this.name = name
        this.color = color
        this.sounds = {}
        this.sym_map = {}
        this.sym_list = []
        this.sym_level = {}
        for (const [level, entry] of sounds.entries()) {
            const {sym, letter, sound} = { letter: 'x', sym: symbols.DOT, ...entry }
            this.sym_list.push(sym)
            this.sym_map[letter] = sym
            this.sounds[sym] = sound
            this.sym_level[sym] = level
        }
    }

    play(sym, volume = 1) {
        this.sounds[sym || this.sym_list[0]].play(volume)
    }
}