<script>
    import Dot from "./dot.svelte"
    import { adjust, alternate} from "./colors.js"
    import { in_limits } from "./utils.js"
    import { createEventDispatcher } from 'svelte'
    import * as symbols from "./symbols"

	const dispatch = createEventDispatcher()

    const radius0 = 0.12
    const max_lift = 0.14
    const min_lift = 0.06

    export let instrument_order = Map()
    export let circular = true
    export let episode
    export let period
    export let playing = false
    export let phase
    export let pointer


    const pick = (obj, ...keys) => Object.fromEntries(
        keys.filter(key => key in obj).map(key => [key, obj[key]]));

    function setup_parts(circular, instrument_order, episode, pointer) {
        const max_width = 1
        const active_width = circular ? 0.12 : 0.08
        const max_free_width = circular ? 1 : 0.2
        const instruments = Array.from(instrument_order.keys())
        const positions = Array.from(instrument_order.values())
        const gaps = positions.concat([max_width]).map(
            (order, index, entries) => (index == 0 ? order : order - entries[index - 1])
        )
        const total_gaps = gaps.reduce((a, b) => a + b, 0)
        const widths = instruments.map(
            instrument => {
                const phrase = episode.phrases.find(phrase => phrase.instrument === instrument)
                return phrase ? phrase.parts.length * active_width : 0
            }
        )
        const total_width = widths.reduce((a, b) => a + b, 0)
        const rest_width = Math.min(max_free_width, Math.max(0, max_width - total_width))

        let last_pos = 0
        const instrument_radius = new Map(instruments.map(
            (instrument, instrument_id) => {
                last_pos += gaps[instrument_id] * rest_width / total_gaps + widths[instrument_id]
                return [instrument, last_pos - widths[instrument_id]]
            }
        ))
        return episode.phrases.reduce(
            (res, phrase, phrase_id) => {
                return res.concat(phrase.parts.map((pulses, part_id) => {
                    const pointer_on_part = pointer.phrase_id == phrase_id && pointer.part_id == part_id ? pointer : {}
                    const attacks = attack_info(circular, playing, pulses, phrase.parts.length * period, phase, pointer_on_part)
                    const radius = instrument_radius.get(phrase.instrument) + active_width * part_id
                    return { phrase, phrase_id, part_id, radius, pulses, attacks, pointer: pointer_on_part}
                }))
            },
            []).sort((a, b) => instrument_order.get(b.phrase.instrument) - instrument_order.get(a.phrase.instrument))
    }

    $: parts = setup_parts(circular, instrument_order, episode, pointer)

    function color(phrase, period, phase) {
        const beat_period = {9: 3, 12: 3, 16: 4, 18: 3}[period] || 4
        return Math.floor(phase/beat_period) % 2 != 0 ? alternate(phrase.instrument.color) : phrase.instrument.color
    }
    function calc_power(t) {
        return in_limits(t, 0.0001, 4) ? 10 * Math.exp(-t * 2) : 0
    }
    function attack_info(circular, playing, pulses, period, phase, pointer) {
        const attacks = pulses
            .filter(pulse => (!circular && pointer.phase != undefined) || pulse.sym)
            .sort((pulse_a, pulse_b) => pulse_a.phase - pulse_b.phase)
            .map((pulse) => {
                let power = undefined
                let self_shift = 0
                if (pulse.sym && playing) {
                    const t = Math.max(0, (phase - pulse.phase) % period)
                    if (in_limits(t, -0.1, 0.6)) {
                        const amplitude = 0.03
                        const frequency = 1.8
                        const decay = 1.0
                        power = amplitude * Math.exp(-t * decay)
                        self_shift = power * Math.sin(t * frequency * Math.PI * 2)
                    }
                    power = calc_power(t)
                }
                let lift = 0
                let stub_sym = {}
                if (pointer.phase != undefined) {
                    const y = Math.abs(pointer.phase - pulse.phase)
                    if (!circular) {
                        if (pointer.vertical_offset*0.04 < - 0.5 * max_lift) {
                            lift = min_lift
                        } else {
                            lift = Math.min(max_lift, Math.max(min_lift, max_lift - pointer.vertical_offset*0.04))
                        }
                        lift *= Math.exp(-y * 0.5)
                    }
                    if (!pulse.sym && in_limits(y, -0.49, 0.5)) {
                        stub_sym = {sym: symbols.STUB}
                    }
                }

                return { ...pick(pulse, "sym", "phase"), ...stub_sym, power, self_shift, lift}
            })

        return attacks.map((attack, attack_id, attack_pulses) => {
            const next_attack_id = attack_id + 1 < attack_pulses.length ? attack_id + 1 : 0
            const next_attack = attack_pulses[next_attack_id]
            const next_distance = Math.min(
                Math.abs(next_attack.phase - attack.phase) % period,
                Math.abs(next_attack.phase - attack.phase + period) % period)
            
            const shift_amount = attack.lift + attacks.reduce((shift_amount, other) => {
                const d1 = Math.abs((attack.phase - other.phase - period) % period)
                const d2 = Math.abs((attack.phase - other.phase + period) % period)
                const d3 = Math.abs((attack.phase - other.phase) % period)
                const penalty = attack.sym != other.sym ? 1 : 0
                return shift_amount + other.self_shift * Math.exp(-(penalty + Math.min(d1, d2, d3)) * 0.5)
            }, 0)
            return { ...attack, shift_amount, next_attack_id, next_distance}
        })
    }

    const background_width = (circular) => circular ? 0.02 : 0.06

    function common_props(circular, part) {
        const min_radius = circular ? 0.14 : 0.15
        const max_radius = circular ? 0.5 : 1
        const radius = part.radius * (max_radius - min_radius) + min_radius
        return {circular, radius}
    }

    function lifted_props(circular, part, lift) {
        const {radius: common_radius} = common_props(circular, part)
        const radius = common_radius - 0.95 * lift
        return {circular, radius}
    }

    function on_touch(e, part, pulse, period, radius, width) {
        const {x, y} = e.detail
        let point = e.target.ownerSVGElement.createSVGPoint()
        point.x = x
        point.y = y
        point = point.matrixTransform(e.target.getScreenCTM().inverse())
        const phase = pulse.phase + point.x * period
        dispatch("touch", { phrase_id: part.phrase_id, part_id: part.part_id, phase, vertical_offset: (point.y - radius) / width })
    }

    function dot_size(circular, attack) {
        return circular?0.038:((attack.sym == symbols.STUB ? 0.015 : 0.03) + attack.lift * 0.2)
    }

</script>

<svg viewBox="-0.5 -0.5 1 1">       
    <g transform="{circular?'rotate(-90)':'translate(-0.5, -0.5)'}">
    {#each parts as part}
        {#each part.pulses as pulse, pulse_id}
        <Dot back={true}  {...common_props(circular, part)}
        width={background_width(circular)}
        gap={circular?0.01:0.0035}
        phase={(pulse.phase / period) % 1 + (circular? 0 : 0.5 / period)} delta={1 / period}
        color={color(part.phrase, period, pulse.phase)}
        on:touch={(e) => on_touch(e, part, pulse, period, common_props(circular, part).radius, background_width(circular))}
        on:move={(e) => on_touch(e, part, pulse, period, common_props(circular, part).radius, background_width(circular))}
        on:press={() => dispatch("press", { phrase_id: part.phrase_id, part_id: part.part_id, pulse_id })}
        on:swipe={(e) => dispatch("swipe", { phrase_id: part.phrase_id, part_id: part.part_id, pulse_id, ...e.detail })}
        on:swipeend on:finish_touch/>
        {/each}
    {/each}
    {#each parts.slice().sort((a, b) => (a.pointer.phase == undefined ? 0 : 1) - (b.pointer.phase == undefined ? 0 : 1)) as part}
        {#if !circular && part.pointer.phase != undefined}
        {#each part.attacks as attack}
        {#if in_limits(part.pointer.phase - attack.phase, -0.5, 0.5)}
        <Dot {...lifted_props(circular, part, attack.lift * 0.5)}
            width={background_width(circular) + attack.lift * 0.1}
            gap={circular?0.01:0.0035}
            phase={(part.pointer.phase / period) % 1 + (circular? 0 : 0.5 / period)} delta={0.4 / period / (circular ? common_props(circular, part).radius * 6 : 2)}
            color={"red"}/>
        {/if}
        {/each}
        {/if}
        {#if playing && in_limits(phase % (part.phrase.parts.length * period), part.part_id * period, (part.part_id + 1) * period)}
        <Dot {...common_props(circular, part)}
            width={background_width(circular)}
            gap={circular?0.01:0.0035}
            phase={(phase / period) % 1 + (circular? 0 : 0.5 / period)} delta={0.4 / period / (circular ? common_props(circular, part).radius * 6 : 2)}
            color={"var(--theme-accent)"}/>
        {/if}
        {#if part.pointer.phase != undefined}
        <Dot {...common_props(circular, part)}
            width={background_width(circular)}
            gap={circular?0.01:0.0035}
            phase={(part.pointer.phase / period) % 1 + (circular? 0 : 0.5 / period)} delta={0.4 / period / (circular ? common_props(circular, part).radius * 6 : 2)}
            color={"red"}/>
        {/if}
        {#each part.attacks as attack}
        {#if attack.next_distance < 4.001}
        <Dot back={false} {...common_props(circular, part)}
            dot_shift={attack.shift_amount}
            gap={circular?0.01:0.0035}
            phase={(attack.phase / period) % 1 + (circular? 0 : 0.5 / period)} delta={1 / period}
            next_phase={(part.attacks[attack.next_attack_id].phase / period) % 1 + (circular? 0 : 0.5 / period)}
            next_dot_shift={part.attacks[attack.next_attack_id].shift_amount}
            />
        {/if}
        {/each}
        {#each part.attacks as attack}
        <Dot back={false} {...common_props(circular, part)}
            dot_shift={attack.shift_amount}
            size={dot_size(circular, attack)}
            gap={circular?0.01:0.0035}
            phase={(attack.phase / period) % 1 + (circular? 0 : 0.5 / period)} delta={1 / period}
            sym={attack.sym == symbols.STUB ? symbols.DOT : attack.sym}
            {...(attack.sym == symbols.STUB ? {pulse_color: alternate(part.phrase.instrument.color), outline_color: "var(--theme-fg)"} : {})}
            flash_color={attack.power ? adjust(part.phrase.instrument.color, attack.power): undefined}
            />
        {/each}
    {/each}
</g>
</svg>

<style>
    svg {
        padding: 0px 20px 12px 20px;
    }
</style>
