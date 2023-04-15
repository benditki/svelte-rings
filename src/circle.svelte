<script>
    import Dot from "./dot.svelte"
    import ProgressCircle from "./progress_circle.svelte"
    import PlayButton from "./play_button.svelte"


    import { adjust, alternate} from "./colors.js"
    import { in_limits } from "./utils.js"
    import { createEventDispatcher } from 'svelte'
    import * as symbols from "./symbols"

    import { longpress } from './longpress.js'
	const dispatch = createEventDispatcher()

    const max_lift = 0.18
    const min_lift = 0.06
    const min_lift_circular = 0.02

    export let layout
    export let instrument_order = Map()
    export let episodes
    export let selected_episodes
    export let active_episode_id
    export let period
    export let playing = false
    export let phase
    export let pointer
    export let playing_attacks

let width
let height

    let parts
    let circular_parts
    let view = {start_id: 0}
    let roi = {start_id: 0, end_id: 1}

    $: if (playing) { roi = {start_id: active_episode_id, end_id: active_episode_id + 2}}

    const pick = (obj, ...keys) => Object.fromEntries(
        keys.filter(key => key in obj).map(key => [key, obj[key]]))

    const sum = (values) => values.reduce((a, b) => a + b, 0)

    function get_attacks_by_part(playing_attacks, episode_id, phrase_id, part_id) {
        const result = []
        for(const [attack, entry] of playing_attacks) {
            if (entry.episode_id == episode_id && entry.phrase_id == phrase_id && entry.part_id == part_id) {
                result.push(attack)
            }
        }
        return result
    }

    function pad_intervals(intervals, before = 0, after = 0) {
        return Array(before).concat(intervals).concat(Array(after))
    }

    function arrange_intervals_in_view(spaces, header_spaces, footer_space, min_gap, min_length, available_space, roi, old_view) {
        const view = {start_id: 0, end_id: spaces.length}

        let {fit, intervals} = arrange_intervals(spaces, min_gap, min_length, available_space)
        while (!fit && view.start_id < Math.min(roi.start_id, old_view.start_id)) {
            view.start_id++
            ({fit, intervals} = arrange_intervals(spaces, min_gap, min_length, available_space - header_spaces[view.start_id], view))
        }


        while (!fit && view.end_id > roi.end_id) {
            view.end_id--
            ({fit, intervals} = arrange_intervals(spaces, min_gap, min_length, available_space - header_spaces[view.start_id] - footer_space, view))
        }

        while (!fit && view.start_id < roi.start_id) {
            view.start_id++
            ({fit, intervals} = arrange_intervals(spaces, min_gap, min_length, available_space - header_spaces[view.start_id] - footer_space, view))
        }

        while (!fit && view.end_id > roi.start_id + 1) {
            view.end_id--
            ({fit, intervals} = arrange_intervals(spaces, min_gap, min_length, available_space - header_spaces[view.start_id] - footer_space, view))
        }

        return {intervals, view}
    }

    function arrange_intervals(spaces, min_gap, min_length, available_space, view = {start_id: 0, end_id: spaces.length}) {
        let last_pos = 0
        let start_gap = 0
        const slice_intervals = spaces.slice(view.start_id, view.end_id).map(length => {
            const padding = length < min_length ? (min_length - length) / 2 : 0
            const start = last_pos + Math.max(start_gap, padding)
            const end = start + length
            last_pos = end + padding
            start_gap = Math.max(0, min_gap - padding)
            return {start, end, padding, last_pos, start_gap, get height() { return this.end - this.start }}
        })
        const fit = slice_intervals.at(-1).last_pos <= available_space
        const intervals = pad_intervals(slice_intervals, view.start_id, spaces.length - view.end_id)
        // console.log({available_space, view_start: view.start_id, view_end: view.end_id, last_pos: slice_intervals.at(-1).last_pos, fit})
        return {intervals, fit}
    }

    function arrange_intervals_weighted_gaps(spaces, weighted_gaps, available_space, max_free_length, trim) {
        const total_length = sum(spaces)
        const free_length = Math.min(max_free_length, Math.max(0, available_space - total_length))

        let trimming = trim
        let last_pos = 0

        return spaces.map((length, index) => {
            if (!trimming) {
                last_pos += weighted_gaps[index] * free_length
            }
            trimming = trimming && length > 0

            const start = last_pos
            last_pos += length
            const end = last_pos

            return {start, end, last_pos}
        })
    }

    function arrange_episodes(episodes, instrument_order, available_space, active_episode_id, old_view, roi) {
        if (isNaN(available_space)) return

        const max_space = 1
        const active_instrument_space = 0.065
        const max_free_space = 0.0
        const inter_episode_gap = 0.065
        const min_episode_space = 0.15

        const instruments = Array.from(instrument_order.keys())
        const positions = Array.from(instrument_order.values())

        const instrument_last_phrase = new Map(instruments.map(instrument => [instrument, {}]))

        const gaps = positions.concat([max_space]).map(
            (order, index, entries) => (index == 0 ? order : order - entries[index - 1])
        )
        const total_gaps = sum(gaps)
        const normalized_gaps = gaps.map(gap => gap / total_gaps)

        const episode_inner_arrangement = episodes.map((episode, episode_id) => {
            episode.phrases.forEach((phrase, phrase_id) =>
                instrument_last_phrase.set(phrase.instrument, {episode, episode_id, phrase, phrase_id}))

            const own_spaces = instruments.map(instrument => {
                const phrase = episode.phrases.find(phrase => phrase.instrument === instrument)
                return phrase ? phrase.parts.length * active_instrument_space : 0
            })

            const borrowed_phrases = instruments.flatMap(instrument => {
                const own_phrase = episode.phrases.find(phrase => phrase.instrument === instrument)
                if (own_phrase) return []

                const last_phrase = instrument_last_phrase.get(instrument).phrase
                return last_phrase ? [last_phrase] : []
            })

            const borrowed_spaces = instruments.map(instrument => {
                const borrowed_phrase = borrowed_phrases.find(phrase => phrase.instrument === instrument)
                return borrowed_phrase ? borrowed_phrase.parts.length * active_instrument_space : 0
            })

            const borrowed_phrase_intervals = arrange_intervals_weighted_gaps(/*spaces*/ borrowed_spaces,
                /*weighted_gaps*/ normalized_gaps,
                /*available_space*/ max_space,
                /*max_free_length*/ max_free_space,
                /*trim*/ true)

            const own_phrase_intervals = arrange_intervals_weighted_gaps(/*spaces*/ own_spaces,
                /*weighted_gaps*/ normalized_gaps,
                /*available_space*/ max_space,
                /*max_free_length*/ max_free_space,
                /*trim*/ true)

            const combined_phrases = instruments.flatMap(instrument => {
                const last_phrase = instrument_last_phrase.get(instrument).phrase
                return last_phrase ? [last_phrase] : []
            })

            const combined_spaces = instruments.map(instrument => {
                const combined_phrase = combined_phrases.find(phrase => phrase.instrument === instrument)
                return combined_phrase ? combined_phrase.parts.length * active_instrument_space : 0
            })

            const circular_intervals = arrange_intervals_weighted_gaps(/*spaces*/ combined_spaces,
                /*weighted_gaps*/ normalized_gaps,
                /*available_space*/ 1,
                /*max_free_length*/ 1,
                /*trim*/ false)


            return {own_phrase_intervals, borrowed_phrases, borrowed_phrase_intervals, combined_phrases, circular_intervals,
                instrument_last_phrase: new Map(instrument_last_phrase)}
        })

        const {intervals: episode_intervals, view: new_view} = arrange_intervals_in_view(
                /*spaces*/ episode_inner_arrangement.map(({own_phrase_intervals: intervals}) => intervals.at(-1).end),
                /*header_spaces*/ episode_inner_arrangement.map(({borrowed_phrase_intervals: intervals}) => intervals.at(-1).end ? intervals.at(-1).end + min_episode_space * 0.4 : 0),
                /*footer_space*/ min_episode_space * 0.6,
                /*min_gap*/ inter_episode_gap,
                /*min_length*/ min_episode_space,
                /*available_space*/ available_space,
                roi,
                old_view)
        if (old_view.start_id != new_view.start_id ||
            old_view.end_id != new_view.end_id) {
            view = new_view
        }

        // console.log({roi_start: roi.start_id, roi_end: roi.end_id, old_view_start: old_view.start_id, old_view_end: old_view.end_id, view_start: view.start_id, view_end: view.end_id})

        return {
            available_space,
            episodes: new Map(episodes.flatMap((episode, episode_id) =>
                episode_intervals[episode_id] == undefined ? [] :
                [[episode, {
                    episode_id,
                    ...episode_intervals[episode_id],
                    borrowed_phrases: episode_inner_arrangement[episode_id].borrowed_phrases,
                    phrase_arrangement: episode.phrases.map(phrase => episode_inner_arrangement[episode_id].own_phrase_intervals[instruments.indexOf(phrase.instrument)])
                }]])),
            header: {
                episode_id: view.start_id,
                phrases: episode_inner_arrangement[view.start_id].borrowed_phrases,
                phrase_arrangement: episode_inner_arrangement[view.start_id].borrowed_phrases.map(phrase => episode_inner_arrangement[view.start_id].borrowed_phrase_intervals[instruments.indexOf(phrase.instrument)])
            },
            circle: {
                episode_id: active_episode_id,
                phrases: episode_inner_arrangement[active_episode_id].combined_phrases,
                phrase_arrangement: episode_inner_arrangement[active_episode_id].combined_phrases.map(phrase => episode_inner_arrangement[active_episode_id].circular_intervals[instruments.indexOf(phrase.instrument)])
            },
        }
    }

    $: episode_arrangement = arrange_episodes(episodes, instrument_order, layout.parts.height / layout.parts.width, active_episode_id, view, roi)


    function phrases2parts(phrases, episode_id, episode_start, phrase_arrangement, borrowed_phrases, instrument_order, pointer, playing_attacks, circular, playing, episode_active, phase, active_width) {
        const parts = phrases.reduce((res, phrase, phrase_id) => {
                const phrase_playing = playing && (episode_active || borrowed_phrases.includes(phrase))
                return res.concat(phrase.parts.map((pulses, part_id, {length: part_count}) => {
                    const pointer_on_part = pointer.episode_id == episode_id && pointer.phrase_id == phrase_id && pointer.part_id == part_id ? pointer : {}
                    const combined_pulses = pulses.concat(get_attacks_by_part(playing_attacks, episode_id, phrase_id, part_id))
                    const attacks = attack_info(circular, phrase_playing, combined_pulses, phrase.parts.length * period, phase, pointer_on_part)
                    const radius = episode_start + phrase_arrangement[phrase_id].start + active_width * (part_id + (circular?0:0.5))
                    const part_playing = phrase_playing && in_limits(phase % (phrase.parts.length * period), part_id * period, (part_id + 1) * period)
                    return { episode_id, phrase, phrase_id, part_id, radius, pulses, attacks, pointer: pointer_on_part, playing: part_playing}
                }).reverse())
            },
            []).sort((a, b) => instrument_order.get(b.phrase.instrument) - instrument_order.get(a.phrase.instrument))
        // console.log({episode_id, phrases: phrases.length, parts: parts.length})
        return parts
    }

    function setup_parts(instrument_order, pointer, playing_attacks, active_episode, episode_arrangement, phase) {
        if (episode_arrangement == undefined) return

        const active_width = 0.065
        const active_width_circular = 0.12
        const active_borrowed_phrases = playing ? episode_arrangement.episodes.get(active_episode).borrowed_phrases : []
        const header_parts = phrases2parts(episode_arrangement.header.phrases, undefined, 0, episode_arrangement.header.phrase_arrangement, active_borrowed_phrases, instrument_order, pointer, playing_attacks, false, playing, false, phase, active_width)
        const header_end = episode_arrangement.header.phrases.length ? episode_arrangement.header.phrase_arrangement.at(-1).end + 0.05: 0

        parts = header_parts.concat(Array.from(episode_arrangement.episodes).flatMap(
            ([episode, {episode_id, start: episode_start, phrase_arrangement}]) => {
                return phrases2parts(episode.phrases, episode_id, header_end + episode_start, phrase_arrangement, active_borrowed_phrases, instrument_order, pointer, playing_attacks, false, playing, episode_id == active_episode_id, phase, active_width)
            }))

        circular_parts = phrases2parts(episode_arrangement.circle.phrases, episode_arrangement.circle.episode_id, 0, episode_arrangement.circle.phrase_arrangement, [], instrument_order, pointer, playing_attacks, true, playing, true, phase, active_width_circular)
        // console.log(episode_arrangement)
        // console.log(circular_parts)
    }

    $: setup_parts(instrument_order, pointer, playing_attacks, episodes[active_episode_id], episode_arrangement, phase)

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
        const min_radius = circular ? 0.14 : 0.0
        const max_radius = circular ? 0.5 : 1.0
        const radius = pos * (max_radius - min_radius) + min_radius
        return radius
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

    function on_touch(e, part, pulse, period, radius, width, start = true) {
        const {x, y} = e.detail
        let point = e.target.ownerSVGElement.createSVGPoint()
        point.x = x
        point.y = y
        point = point.matrixTransform(e.target.getScreenCTM().inverse())
        const phase = pulse.phase + point.x * period
        dispatch("touch", { episode_id: part.episode_id, phrase_id: part.phrase_id, part_id: part.part_id, phase, vertical_offset: (point.y - radius) / width, start })
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


</script>

{#if parts && layout}

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {layout.width} {layout.height}" width={layout.width} height={layout.height}>

    <!-- <g transform="translate(0.88, 0.15) scale(0.14)">
        <PlayButton {playing} />
    </g> -->

    <polyline points="{layout.header.center - layout.header.width * 0.4},{layout.header.bottom} {layout.header.center + layout.header.width * 0.4},{layout.header.bottom}" stroke="var(--theme-fg)" stroke-width={2} fill="none"/>
    {#if layout.vertical}
    <polyline points="{layout.list.center - layout.list.width * 0.4},{layout.list.top} {layout.list.center + layout.list.width * 0.4},{layout.list.top}" stroke="var(--theme-fg)" stroke-width={2} fill="none"/>
    {/if}

    {#each [true, false] as circular}

    <g transform={circular ? `translate(${layout.circle.center}, ${layout.circle.middle}) scale(${layout.circle.size}) rotate(-90)` : `translate(${layout.parts.left}, ${layout.parts.top}) scale(${layout.parts.width})`}>
        {#if !circular}
        <g>
        {#each episodes as episode, episode_id}
        {#if in_limits(episode_id, view.start_id || 0, view.end_id || episodes.length)}
        <g transform="translate(-0.13, {pos2radius(false, episode_arrangement.episodes.get(episode).start +(episode_arrangement.header.phrases.length ? episode_arrangement.header.phrase_arrangement.at(-1).end + 0.05: 0))})"
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
    {#each (circular ? circular_parts : parts) as part}
        {#each part.pulses as pulse, pulse_id}
        <Dot back={true}  {...common_props(circular, part)}
        width={background_width(circular)}
        gap={circular?0.01:0.0035}
        phase={(pulse.phase / period) % 1 + (circular? 0 : 0.5 / period)} delta={1 / period}
        color={color(part.phrase, period, pulse.phase)}
        on:touch={(e) => on_touch(e, part, pulse, period, common_props(circular, part).radius, background_width(circular))}
        on:move={(e) => on_touch(e, part, pulse, period, common_props(circular, part).radius, background_width(circular), false)}
        on:press={() => dispatch("press", { episode_id: part.episode_id, phrase_id: part.phrase_id, part_id: part.part_id, pulse_id })}
        on:swipe={(e) => dispatch("swipe", { episode_id: part.episode_id, phrase_id: part.phrase_id, part_id: part.part_id, pulse_id, ...e.detail })}
        on:swipeend on:finish_touch/>
        {/each}
    {/each}
    {#each (circular ? circular_parts : parts).slice().sort((a, b) => (a.pointer.phase == undefined ? 0 : 1) - (b.pointer.phase == undefined ? 0 : 1)) as part}
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

        {#if !circular}
        <g transform="translate(-0.13)">
            {#if view.start_id > 0}
            <g use:longpress on:press={(e) => {roi = {start_id: view.start_id - 1, end_id: view.start_id, ddd:12}}}>
            <rect pointer-events="fill" opacity=0.2 x=0 y=0 width=0.11 height=0.07 fill=none/>
            <polyline points="0.01,0.04 0.055,0.015 0.1,0.04" stroke="var(--theme-fg)" stroke-width={0.015} fill="none"/>
            </g>
            {/if}

            {#if view.end_id < episodes.length}
            <g transform="translate(0, {episode_arrangement.available_space})" use:longpress on:press={(e) => {roi = {start_id: view.end_id, end_id: view.end_id + 1, ppp:13}}}>
            <rect pointer-events="fill" opacity=0.2 x=0 y=-0.07 width=0.11 height=0.07 fill=none/>
            <polyline points="0.01,-0.04 0.055,-0.015 0.1,-0.04" stroke="var(--theme-fg)" stroke-width={0.015} fill="none"/>
            </g>
            {/if}
        </g>
        {/if}
    {/each}

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
