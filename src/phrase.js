import Pulse from "./pulse.js"
import * as symbols from "./symbols"


export default class Phrase {
    constructor(instrument, parts = [], volume = 1.0) {
        this.instrument = instrument
        this.parts = parts
        this.volume = volume
        this.update_attacks()
    }

    get_attacks(part_id) {
        if (part_id == undefined) {
            return this.attacks.flat()
        }
        return this.attacks[part_id]
    }

    update_attacks() {
        this.attacks = this.parts.map((pulses) => pulses.flatMap((pulse, pulse_id) => pulse.make_attacks(pulse_id, this.instrument.roll_types)))
    }

    set_pulse(part_id, pulse_id, sym_id, sym) {
        console.log("set_pulse", {part_id, pulse_id, sym_id, sym: this.parts[part_id][pulse_id].syms[sym_id], new_sym: sym})

        this.parts[part_id][pulse_id].syms[sym_id] = sym
        this.update_attacks()
        return this
    }

    set_pulse_type(part_id, pulse_id, type, syms) {
        this.parts[part_id][pulse_id].type = type
        if (!syms) {
            syms = this.parts[part_id][pulse_id].syms
        }
        const new_length = this.instrument.roll_types[type]?.length ?? 1
        if (new_length > syms.length) {
            syms = syms.concat(Array(new_length - syms.length).fill(symbols.DOT))
        } else {
            syms = syms.slice(0, new_length)
        }
        if (type) {
            syms = syms.map((sym) => sym ?? symbols.DOT)
        }
        this.parts[part_id][pulse_id].syms = syms
        this.update_attacks()
        return this
    }

    add_dup_or_empty(period, after_part_id) {
        if (after_part_id == undefined || after_part_id >= this.parts.length) {
            after_part_id = this.parts.length - 1
        }
        if (this.parts.length) {
            this.add_part(period, this.parts[after_part_id], after_part_id + 1)
        } else {
            this.parts.push(Phrase.emptyPulses(period, after_part_id + 1))
            this.update_attacks()
        }
    }

    add_part(period, pulses, part_id) {
        if (part_id == undefined) {
            part_id = this.parts.length
        }
        this.parts.push(pulses.map(
            (pulse) => new Pulse(pulse.phase % period + part_id * period, pulse.syms, pulse.type)))
        this.update_attacks()
    }

    remove_part(part_id) {
        if (part_id == undefined) {
            part_id = this.parts.length - 1
        }
        const removed_parts = this.parts.splice(part_id, 1)
        this.update_attacks()

        return removed_parts[0]
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
                .filter((s) => /\S/.test(s))
                .map((s) => new Pulse(phase++, [instrument.sym_map[s]]))
        )
        return new Phrase(instrument, parts, volume)
    }

    static emptyPulses(period, part_id = 0) {
        const pulses = []
        for (let phase = 0; phase < period; phase++) {
            pulses.push(new Pulse(phase + part_id * period))
        }
        return pulses
    }

    static fromPeriod(instrument, period, part_count = 1) {
        const parts = []
        for (let part_id = 0; part_id < part_count; part_id++) {
            parts.push(Phrase.emptyPulses(period, part_id))
        }
        return new Phrase(instrument, parts)
    }

    clone() {
        return new Phrase(this.instrument, this.parts.map(pulses => pulses.map(pulse => pulse.clone()), this.volume))
    }
}