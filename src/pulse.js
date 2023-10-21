import * as symbols from "./symbols.js"
import Attack from "./attack.js"

export default class Pulse {
    constructor(phase, syms=[], type) {
        this.phase = phase
        this.syms = syms
        this.type = type
    }

    make_attacks(pulse_id, roll_types) {
        const phases = this.type && roll_types[this.type] || [0]
        return phases.flatMap((phase, sym_id) => {
            const sym = this.syms[sym_id]
            return (sym || this.type) ? [new Attack(sym, this.phase + phase, pulse_id, sym_id)] : []
        })
    }

    store() {
        return { phase: this.phase, syms: this.syms.map((sym) => sym?.description), type: this.type }
    }

    static fromLoaded(loaded) {
        return new Pulse(loaded.phase, loaded.syms.map((sym) => symbols[sym]), loaded.type)
    }

    clone() {
        return new Pulse(this.phase, this.syms, this.type)
    }
}