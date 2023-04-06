import * as symbols from "./symbols.js"

export default class Pulse {
    constructor(phase, sym = null) {
        this.phase = phase
        this.sym = sym
    }

    store() {
        return { phase: this.phase, sym: this.sym == null ? null : this.sym.description }
    }

    static fromLoaded(loaded) {
        return new Pulse(loaded.phase, loaded.sym == null ? null : symbols[loaded.sym])
    }

    clone() {
        return new Pulse(this.phase, this.sym)
    }
}