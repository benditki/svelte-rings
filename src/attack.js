
export default class Attack {
    constructor(sym, phase = 0, pulse_id, sym_id, playing_start) {
        this.sym = sym
        this.phase = phase
        this.pulse_id = pulse_id
        this.sym_id = sym_id
        this.playing_start = playing_start
        this.lift = 0
        this.self_shift = 0
        this.power = 0
    }
}