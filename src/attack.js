export default class Attack {
    constructor(phase, sym, playing_start) {
        this.phase = phase
        this.sym = sym
        this.playing_start = playing_start
        this.lift = 0
        this.self_shift = 0
        this.power = 0
    }

    static from_pulse(pulse) {
        return new Attack(pulse.phase, pulse.sym)
    } 
}