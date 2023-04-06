import Pulse from "./pulse.js"
import Attack from "./attack.js"

export default class Phrase {
    constructor(instrument, parts, volume = 1.0) {
        this.instrument = instrument
        this.parts = parts
        this.volume = volume
        this.attacks = parts.map(pulses => pulses.filter(pulse => pulse.sym).map(pulse => Attack.from_pulse(pulse)))
    }

    get_attacks(part_id) {
        if (part_id == undefined) {
            return this.attacks.flat()
        }
        return this.attacks[part_id]
    }

    set_pulse(part_id, pulse_id, new_sym) {
        this.parts[part_id][pulse_id].sym = new_sym
        this.attacks = this.parts.map(pulses => pulses.filter(pulse => pulse.sym).map(pulse => Attack.from_pulse(pulse)))
    }

    store() {
        return { instrument: this.instrument.name, volume: this.volume,
            parts: this.parts.map(pulses => pulses.map(pulse => pulse.store())) }
    }

    load_blocked(loaded) {
        if (this.instrument == loaded.instrument) {
            this.volume = loaded.volume
        }
    }

    static fromLoaded(loaded, instruments) {
        return new Phrase(instruments[loaded.instrument],
            loaded.parts.map(loaded_pulses => loaded_pulses.map(loaded_pulse => Pulse.fromLoaded(loaded_pulse))),
            loaded.volume)
    }

    static fromPatterns(instrument, patterns, volume = 1.0) {
        let phase = 0
        const parts = patterns.map(pattern =>
            pattern.split("")
                .filter(s => /\S/.test(s))
                .map(s => new Pulse(phase++, instrument.sym_map[s])))
        return new Phrase(instrument, parts, volume)
    }

    static fromPeriod(instrument, period, part_count = 1) {
        const parts = []
        for (let part_id = 0; part_id < part_count; part_id++) {
            const pulses = []
            for (let phase = 0; phase < period; phase++) {
                pulses.push(new Pulse(phase + part_id * period))
            }
            parts.push(pulses)
        }
        return new Phrase(instrument, parts)
    }

    clone() {
        return new Phrase(this.instrument, this.parts.map(pulses => pulses.map(pulse => pulse.clone()), this.volume))
    }
}