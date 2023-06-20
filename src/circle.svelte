<script>
    import Dot from "./dot.svelte"
    import DotRect from "./dot_rect.svelte"
    import DotNext from "./dot_next.svelte"
    import ProgressCircle from "./progress_circle.svelte"
    import PlayButton from "./play_button.svelte"


    import { adjust, alternate} from "./colors.js"
    import { in_limits } from "./utils.js"
    import { createEventDispatcher } from 'svelte'
    import * as symbols from "./symbols"

    import { longpress } from './longpress.js'
	const legacy_dispatch = createEventDispatcher()

    const dispatch = (...args) => {
        // console.log("dispatch", ...args)
        return legacy_dispatch(...args)
    }

    const max_lift = 0.18
    const min_lift = 0.06
    const min_lift_circular = 0.02

    export let layout
    export let episode_arrangement
    export let instrument_order = Map()
    export let episodes
    export let selected_episodes
    export let active_episode_id
    export let period
    export let playing = false
    export let phase
    export let pointer
    export let playing_attacks

    let parts
    let circular_parts
    let pulses

    const pick = (obj, ...keys) => Object.fromEntries(
        keys.filter(key => key in obj).map(key => [key, obj[key]]))

    function get_attacks_by_part(playing_attacks, episode_id, phrase_id, part_id) {
        const result = []
        for(const [attack, entry] of playing_attacks) {
            if (entry.episode_id == episode_id && entry.phrase_id == phrase_id && entry.part_id == part_id) {
                result.push(attack)
            }
        }
        return result
    }



    function phrases2parts(phrase_arrangement, pointer, playing_attacks, circular, playing, active_episode_id, phase, active_width) {
        const parts = phrase_arrangement.flatMap(({phrase, episode_id, interval: {start}}, phrase_id) => {
                const phrase_playing = playing && episode_id == active_episode_id
                const parts = phrase?.parts || []
                return parts.map((pulses, part_id, {length: part_count}) => {
                    const pointer_on_part = pointer.last?.episode_id == episode_id && pointer.last?.phrase_id == phrase_id && pointer.last?.part_id == part_id ? pointer : {}
                    const combined_pulses = pulses.concat(get_attacks_by_part(playing_attacks, episode_id, phrase_id, part_id))
                    const attacks = attack_info(circular, phrase_playing, combined_pulses, part_count * period, phase, pointer_on_part)
                    const radius = (start + active_width * (part_id + (circular?0:0.5))) / (circular ? 2.9 : 1) + (circular ? 0.14 : 0)
                    const part_playing = phrase_playing && in_limits(phase % (part_count * period), part_id * period, (part_id + 1) * period)
                    return { episode_id, phrase, phrase_id, part_id, radius, pulses, attacks, pointer: pointer_on_part, playing: part_playing}
                }).reverse()
            })
        // console.log({episode_id, phrases: phrases.length, parts: parts.length})
        return parts
    }

    function setup_parts(pointer, playing_attacks, active_episode_id, episode_arrangement, phase) {
        if (episode_arrangement == undefined) return

        const active_width = 0.065
        const active_width_circular = 0.12
        const header_phrase_arrangment = episode_arrangement.header.phrase_arrangement.map(
            arrangment => ({...arrangment,
                phrase: arrangment.borrowed_phrase,
                interval: arrangment.borrowed_interval}))
        const header_parts = phrases2parts(header_phrase_arrangment, pointer, playing_attacks, false, playing, active_episode_id, phase, active_width)

        parts = header_parts.concat(Array.from(episode_arrangement.episodes).flatMap(
            ([episode, {phrase_arrangement}]) => {
                const episode_phrase_arrangment = episode_arrangement.header.phrase_arrangement.map(
                    arrangment => ({
                        ...arrangment,
                        phrase: arrangment.own_phrase,
                        interval: arrangment.own_interval}))
                return phrases2parts(episode_phrase_arrangment, pointer, playing_attacks, false, playing, active_episode_id, phase, active_width)
            }))

        const circular_phrase_arrangment = episode_arrangement.circle.phrase_arrangement.map(
            arrangment => ({
                ...arrangment,
                phrase: arrangment.own_phrase || arrangment.borrowed_phrase,
                interval: arrangment.circular_interval}))
        circular_parts = phrases2parts(circular_phrase_arrangment, pointer, playing_attacks, true, playing, active_episode_id, phase, active_width_circular)
        // console.log(episode_arrangement)
        // console.log(circular_parts)
    }

    // $: setup_parts(pointer, playing_attacks, active_episode_id, episode_arrangement, phase)

    function color(phrase, period, phase) {
        const beat_period = {9: 3, 12: 3, 16: 4, 18: 3}[period] || 4
        return Math.floor(phase/beat_period) % 2 != 0 ? alternate(phrase.instrument.color) : phrase.instrument.color
    }
    function calc_power(t) {
        return in_limits(t, 0.0001, 4) ? 10 * Math.exp(-t * 2) : 0
    }
    function attack_info(circular, playing, pulses, period, phase, pointer) {
        const attacks = pulses
            .filter(pulse => (pulse.sym || pointer.phase != undefined && (!circular || in_limits(Math.abs(pointer.phase - pulse.phase), -0.49, 0.5))))
            .sort((pulse_a, pulse_b) => pulse_a.phase - pulse_b.phase)
            .map((pulse) => {
                let {power, self_shift} = pulse
                self_shift = self_shift || 0
                if (power == undefined && pulse.sym && playing) {
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
                        if (pointer.vertical_offset*0.04 < - 0.25 * max_lift) {
                            lift = -min_lift
                        } else {
                            lift = Math.min(max_lift, Math.max(min_lift, max_lift - pointer.vertical_offset*0.04))
                        }
                    } else {
                        lift = min_lift_circular
                    }
                    lift *= Math.exp(-y * 0.5)
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

    function pos2radius(circular, pos) {
        return pos
    }

    function common_props(circular, part) {
        const radius = pos2radius(circular, part.radius)
        return {circular, radius}
    }

    function lifted_props(circular, part, lift) {
        const {radius: common_radius} = common_props(circular, part)
        const radius = common_radius - lift
        return {circular, radius}
    }

    function dot_size(circular, attack) {
        return circular?0.038:((attack.sym == symbols.STUB ? 0.015 : 0.03) + Math.abs(attack.lift) * 0.2)
    }

    const debug_line_width = 0.02

    function on_episode_press(episode_id) {
        if (selected_episodes.size) {
            if (selected_episodes.has(episode_id)) {
                selected_episodes.delete(episode_id)
                selected_episodes = selected_episodes
            } else {
                selected_episodes = selected_episodes.add(episode_id)
            }
        } else {
            if (episode_id != active_episode_id) {
                dispatch("change", {episode_id})
            }
        }
    }

    function on_episode_longpress(episode_id) {
        selected_episodes = selected_episodes.add(episode_id)
    }

    function setup_pulses(circular, episode_arrangement) {
        const {pulse_delta: delta, beat_period} = episode_arrangement
        const width = background_width(circular)

        function phrases2pulses(phrase_arrangement, part_space, episode_start = 0) {
            return phrase_arrangement.flatMap(({phrase, phrase_interval}) => {
                if (!phrase) return []
                const {parts, instrument} = phrase

                return parts.flatMap((pulses, part_id) => {
                    const radius = episode_start + phrase_interval.start + part_space * (part_id + (circular ? 0 : 0.5))

                    return pulses.map(({phase}) => {
                        const color = Math.floor(phase/beat_period) % 2 != 0 ? alternate(instrument.color) : instrument.color
                        const transform =
                            circular ?
                            "rotate(".concat(360 * phase * delta, ")") :
                            "translate(".concat((phase + (circular ? 0 : 0.5)) * delta, ",", radius, ")")
                        return {transform, width, delta, color, radius}
                    })
                })
            })
        }

        if (circular) {
            const {circular_part_space: part_space, circle: {phrase_arrangement}} = episode_arrangement
            return phrases2pulses(phrase_arrangement.map(({combined_phrase: phrase, circular_interval: phrase_interval}) => ({phrase, phrase_interval})), part_space)
        }

        const {episodes, part_space, header} = episode_arrangement
        return Array.from(episodes.values()).flatMap(({start: episode_start, phrase_arrangement}) =>
            phrases2pulses(phrase_arrangement.map(({own_phrase: phrase, own_interval: phrase_interval}) => ({phrase, phrase_interval})), part_space, episode_start + header.space)
        )
    }


    let attacks = []
    // $: attacks = setup_attacks(episode_arrangement)

</script>

{#if episode_arrangement && layout}
    {@const {part_transform, phase_transform, part_space, pulse_delta, available_space} = episode_arrangement}
    {@const {view} = episode_arrangement}

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {layout.width} {layout.height}" width={layout.width} height={layout.height}>

    <polyline points="{layout.header.center - layout.header.width * 0.4},{layout.header.bottom} {layout.header.center + layout.header.width * 0.4},{layout.header.bottom}" stroke="var(--theme-fg)" stroke-width={2} fill="none"/>
    {#if layout.vertical}
    <polyline points="{layout.list.center - layout.list.width * 0.4},{layout.list.top} {layout.list.center + layout.list.width * 0.4},{layout.list.top}" stroke="var(--theme-fg)" stroke-width={2} fill="none"/>
    {/if}

    {#each [true, false] as circular}

    <g transform={circular ? `translate(${layout.circle.center}, ${layout.circle.middle}) scale(${layout.circle.size}) rotate(-90)` : `translate(${layout.parts.left}, ${layout.parts.top}) scale(${layout.parts.width})`}>
        {#if !circular}
        <g transform="translate(-0.13, {episode_arrangement.header.space})">
            {#each episodes as episode, episode_id}
                {#if in_limits(episode_id, view.start_id || 0, view.end_id || episodes.length)}
                <g transform="translate(0, {episode_arrangement.episodes.get(episode).start})"
                    on:press={() => on_episode_press(episode_id)}
                    on:longpress={() => on_episode_longpress(episode_id)}
                    use:longpress>
                    <rect x=-0.01 width=0.14
                        height={pos2radius(false, episode_arrangement.episodes.get(episode).end) - pos2radius(false, episode_arrangement.episodes.get(episode).start)}
                        fill={episode_id == active_episode_id ? "var(--theme-bg-less)" : "none"}
                        pointer-events="fill"/>
                    <g transform="translate(0, {(pos2radius(false, episode_arrangement.episodes.get(episode).end) - pos2radius(false, episode_arrangement.episodes.get(episode).start))/2 - 0.11/2})">
                    <ProgressCircle
                            progress={playing && episode_id == active_episode_id ? phase / (period * episode.longest_phrase) : undefined}
                            rounds={episode.repeat}
                            width=0.11 height=0.11
                            text={episode_id + 1} />
                    </g>
                </g>
                {/if}
            {/each}
        </g>
        {/if}

    {#each episode_arrangement.part_arrangement[circular ? 1 : 0].pulse_arrangement as {transform, width, delta, color, radius}}
        <g {transform}><DotRect {circular} {width} {delta} {radius} fill={color}/></g>
    {/each}

    {#each episode_arrangement.part_arrangement[circular ? 1 : 0].parts as {transform, is_playing, width, delta, radius, color}}
        {#if is_playing(active_episode_id, phase)}
        <g transform={transform(phase)}><DotRect {circular} {width} {delta} {radius} fill={color}/></g>
        {/if}
    {/each}

    {#each episode_arrangement.part_arrangement[circular ? 1 : 0].next_arrangement as {transform, x1, x2, y1, y2}}
        <g {transform}><DotNext {circular} {x1} {x2} {y1} {y2}/></g>
    {/each}

    {#each episode_arrangement.part_arrangement[circular ? 1 : 0].attack_arrangement as {transform, radius, size, sym, pulse_color, outline_color, flash_color}}
        <g {transform}><Dot {circular} {radius} {size} {sym} {pulse_color} {outline_color} {flash_color}/></g>
    {/each}

    <!-- {#each (circular ? circular_parts : parts).slice().sort((a, b) => (a.pointer.phase == undefined ? 0 : 1) - (b.pointer.phase == undefined ? 0 : 1)) as part}
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
        {#if playing && part.playing}
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
            pulse_color={attack.sym == symbols.STUB ? alternate(part.phrase.instrument.color) : "var(--theme-fg)"}
            outline_color={attack.sym == symbols.STUB ? "var(--theme-fg)" : "var(--theme-bg-more)"}
            flash_color={attack.power ? adjust(part.phrase.instrument.color, attack.power): undefined}
            />
        {/each}

    {/each} -->
    {#if !circular}
    <g transform="translate(-0.13)">
        {#if view.start_id > 0}
        <g use:longpress on:press={() => dispatch("scroll_to", view.start_id - 1)}>
        <rect pointer-events="fill" opacity=0.2 x=0 y=0 width=0.11 height=0.07 fill=none/>
        <polyline points="0.01,0.04 0.055,0.015 0.1,0.04" stroke="var(--theme-fg)" stroke-width={0.015} fill="none"/>
        </g>
        {/if}

        {#if view.end_id < episodes.length}
        <g transform="translate(0, {episode_arrangement.available_space})" use:longpress on:press={() => dispatch("scroll_to", view.end_id)}>
        <rect pointer-events="fill" opacity=0.2 x=0 y=-0.07 width=0.11 height=0.07 fill=none/>
        <polyline points="0.01,-0.04 0.055,-0.015 0.1,-0.04" stroke="var(--theme-fg)" stroke-width={0.015} fill="none"/>
        </g>
        {/if}
    </g>
    {/if}

</g>

{/each}


<!-- <rect opacity=0.2 x={debug_line_width/2} y={debug_line_width/2} width={1 - debug_line_width} height={(circular?1:height/width) - debug_line_width} stroke=red stroke-width={debug_line_width} fill=none/> -->
</svg>
{/if}

<style>
svg {
    position: fixed;
    left: 0px;
    top: 0px;
}
</style>
