import { in_limits } from "./utils.js"
import { adjust, alternate } from "./colors.js"
import * as symbols from "./symbols"


const sum = (values) => values.reduce((a, b) => a + b, 0)

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

        return {start, end, last_pos, get height() { return this.end - this.start }}
    })
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

export function arrange_episodes_by_instruments(episodes, instrument_order) {
    const max_space = 1
    const active_instrument_space = 0.065
    const max_free_space = 0.0

    const instruments = Array.from(instrument_order.keys())
    const positions = Array.from(instrument_order.values())

    const gaps = positions.concat([max_space]).map(
        (order, index, entries) => (index == 0 ? order : order - entries[index - 1])
    )
    const total_gaps = sum(gaps)
    const normalized_gaps = gaps.map(gap => gap / total_gaps)

    const instrument_last_phrase = new Map()
    const by_instrument = episodes.map((episode, episode_id) => {
        const phrases = instruments.map(instrument => {
            const own_phrase = episode.phrases.find(phrase => phrase.instrument === instrument)
            const borrowed_phrase = instrument_last_phrase.get(instrument)?.phrase
            const phrase_episode_id = own_phrase ? episode_id : instrument_last_phrase.get(instrument)?.episode_id

            return {own_phrase, borrowed_phrase, episode_id: phrase_episode_id, get combined_phrase() { return own_phrase || borrowed_phrase }}
        })

        episode.phrases.forEach((phrase, phrase_id) =>
            instrument_last_phrase.set(phrase.instrument, {episode, episode_id, phrase, phrase_id}))

        return {phrases}
    })

    const episode_inner_arrangement =  episodes.map((episode, episode_id) => {

        const phrases_by_instrument_order = by_instrument[episode_id].phrases

        const own_spaces = phrases_by_instrument_order.map(
            ({own_phrase}) => own_phrase ? own_phrase.parts.length * active_instrument_space : 0
        )

        const borrowed_spaces = phrases_by_instrument_order.map(
            ({borrowed_phrase}) => borrowed_phrase ? borrowed_phrase.parts.length * active_instrument_space : 0
        )

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

        const combined_spaces = phrases_by_instrument_order.map(
            ({combined_phrase}) => combined_phrase ? combined_phrase.parts.length * active_instrument_space : 0
        )

        const circular_intervals = arrange_intervals_weighted_gaps(/*spaces*/ combined_spaces,
            /*weighted_gaps*/ normalized_gaps,
            /*available_space*/ 1,
            /*max_free_length*/ 1,
            /*trim*/ false)

        const phrase_arrangement = phrases_by_instrument_order.map(
            (phrase_info, instrument_id) => {
                const own = {
                    phrase: phrase_info.own_phrase, space: own_spaces[instrument_id], ...own_phrase_intervals[instrument_id],
                    episode_id: phrase_info.episode_id
                }

                const borrowed = {
                    phrase: phrase_info.borrowed_phrase, space: borrowed_spaces[instrument_id], ...borrowed_phrase_intervals[instrument_id],
                    episode_id: phrase_info.episode_id
                }

                const combined = {
                    phrase: phrase_info.combined_phrase, space: combined_spaces[instrument_id], ...adjust_circular(circular_intervals[instrument_id]),
                    episode_id: phrase_info.episode_id
                }

                return {own, borrowed, combined}
            })

        const space = own_phrase_intervals.at(-1)?.end
        const borrowed_space = borrowed_phrase_intervals.at(-1)?.end

        return {phrase_arrangement, space, borrowed_space}
    })

    return {instruments, normalized_gaps, episode_inner_arrangement}
}



function adjust_circular(interval) {
    const adjust = x => x / 2.9 + 0.14
    return {...interval, start: adjust(interval.start), end: adjust(interval.end)}
}

function arrange_parts(episode_arrangement) {
    const {pulse_delta: delta, beat_period} = episode_arrangement
    const {circular_part_space, circle: {phrase_arrangement: circle_phrase_arrangement}} = episode_arrangement

    const pulse_transform = (circular, radius, phase) => circular ?
        "rotate(".concat(360 * (phase * delta % 1), ") translate(", radius,")") :
        "translate(".concat((phase + 0.5) * delta % 1, ",", radius, ")")

    function phrases2pulses(phrase_arrangement, part_space, circular, episode_start = 0) {
        const width = circular ? 0.02 : 0.06
        const part_arrangement = []
        const pulse_arrangement = []
        const attack_arrangement = []
        const next_arrangement = []
        // const phase={(phase / period) % 1 + (circular? 0 : 0.5 / period)} delta={0.4 / period / (circular ? common_props(circular, part).radius * 6 : 2)

        for(const {phrase, start: phrase_start, episode_id} of phrase_arrangement) {
            if (!phrase) continue
            const {parts, instrument} = phrase

            for(const [part_id, pulses] of parts.entries()) {
                const radius = episode_start + phrase_start + part_space * (part_id + (circular ? 0 : 0.5))

                {
                    const transform = (phase) => pulse_transform(circular, radius, phase)
                    const part_count = parts.length
                    const is_playing = (active_episode_id, phase) => (circular || active_episode_id == episode_id) && in_limits(phase * delta % part_count - part_id, 0, 1)
                    const player_delta = delta * 0.3 / (circular ? radius * 4 : 1)
                    part_arrangement.push({transform, is_playing, width, delta: player_delta, radius, color: "var(--theme-accent)"})
                }

                for (const {phase} of pulses) {
                    const color = Math.floor(phase/beat_period) % 2 != 0 ? alternate(instrument.color) : instrument.color
                    const transform = pulse_transform(circular, radius, phase)
                    pulse_arrangement.push({transform, width, delta, color, radius})
                }

                const attacks = phrase.get_attacks(part_id)

                const shifts = attacks.map(({phase, sym}) => {
                    return (circular ? 1 : -1) * attacks.reduce((shift_amount, other) => {
                        const d1 = Math.abs(((phase - other.phase) * delta - 1) % 1)
                        const d2 = Math.abs(((phase - other.phase) * delta + 1) % 1)
                        const d3 = Math.abs((phase - other.phase) * delta % 1)
                        const penalty = sym != other.sym ? delta : 0
                        return shift_amount + (other.self_shift ?? 0) * Math.exp(-(penalty + Math.min(d1, d2, d3)) * 12)
                    }, 0)
                })

                for (const [attack_id, attack] of attacks.entries()) {
                    const {phase, power, self_shift} = attack
                    const is_stub = attack.sym == symbols.STUB
                    const color = instrument.color
                    const size = circular ? 0.038 : (is_stub ? 0.015 : 0.03) // + Math.abs(attack.lift) * 0.2
                    const sym = is_stub ? symbols.DOT : attack.sym
                    const pulse_color = is_stub ? alternate(color) : "var(--theme-fg)"
                    const outline_color = is_stub ? "var(--theme-fg)" : "var(--theme-bg-more)"
                    const flash_color = power > 0.01 ? adjust(color, attack.power): undefined
                    // const shift = (circular ? 1 : -1) * (self_shift ?? 0)
                    const shift = shifts[attack_id]

                    const transform = pulse_transform(circular, radius + shift, phase)
                    attack_arrangement.push({transform, color, radius, attack, size, sym, pulse_color, outline_color, flash_color})

                    const next_attack_id = attack_id + 1 < attacks.length ? attack_id + 1 : 0
                    const next_attack = attacks[next_attack_id]
                    const next_distance = (next_attack.phase - phase) * delta % 1
                    const threshold = 4.001 * delta

                    if (next_distance >= 0 && next_distance < threshold || next_distance < 0 && next_distance + 1 < threshold) {
                        const shift_delta = -shift + shifts[next_attack_id]
                        if (circular) {
                            const y2 = radius * Math.sin(2 * Math.PI * next_distance)
                            const x1 = 0 // + dot_shift
                            const x2 = radius * (Math.cos(2 * Math.PI * next_distance) - 1) + shift_delta
                            next_arrangement.push({transform, x1, x2, y1: 0, y2})
                        } else if (next_attack.phase > phase) {
                            const x2 = next_distance
                            const y1 = 0 // - dot_shift
                            const y2 = shift_delta
                            next_arrangement.push({transform, x1: 0, x2, y1, y2})
                        }
                    }
                }
            }
        }

        return {parts: part_arrangement, pulse_arrangement, attack_arrangement, next_arrangement}
    }

    const circular_part_arrangement = phrases2pulses(circle_phrase_arrangement.map(({combined}) => combined), circular_part_space, true)


    const {episodes, part_space, header} = episode_arrangement
    const header_arrangement = phrases2pulses(header.phrase_arrangement.map(({borrowed}) => borrowed), part_space, false)
    const part_arrangement = Array.from(episodes.values()).reduce((res, {start: episode_start, phrase_arrangement}) => {
        const {parts, pulse_arrangement, attack_arrangement, next_arrangement} = phrases2pulses(phrase_arrangement.map(({own}) => own), part_space, false, episode_start + header.space)

        return {
            parts: res.parts.concat(parts),
            pulse_arrangement: res.pulse_arrangement.concat(pulse_arrangement),
            attack_arrangement: res.attack_arrangement.concat(attack_arrangement),
            next_arrangement: res.next_arrangement.concat(next_arrangement)
        }
    }, header_arrangement)

    return [part_arrangement, circular_part_arrangement]
}

export function arrange_episodes(period, episodes, instrument_order, available_space, active_episode_id, old_view, roi) {
    if (!available_space || isNaN(available_space)) return

    const active_instrument_space = 0.065
    const inter_episode_gap = 0.065
    const min_episode_space = 0.15

    const {instruments, normalized_gaps, episode_inner_arrangement} = arrange_episodes_by_instruments(episodes, instrument_order)

    const {intervals: episode_intervals, view} = arrange_intervals_in_view(
            /*spaces*/ episode_inner_arrangement.map(({space}) => space),
            /*header_spaces*/ episode_inner_arrangement.map(({borrowed_space}) => borrowed_space ? borrowed_space + min_episode_space * 0.4 : 0),
            /*footer_space*/ min_episode_space * 0.6,
            /*min_gap*/ inter_episode_gap,
            /*min_length*/ min_episode_space,
            /*available_space*/ available_space,
            roi,
            old_view)

    // console.log({roi_start: roi.start_id, roi_end: roi.end_id, old_view_start: old_view.start_id, old_view_end: old_view.end_id, view_start: view.start_id, view_end: view.end_id})

    const episode_transform = (episode_id) => {
        const phrase_transform = (phrase_id) =>  `translate(0, ${episode_inner_arrangement[episode_id].own_phrase_arrangement[phrase_id].start})`
        const episode_transform = `translate(0, ${episode_intervals[episode_id].start})`
        return {episode_transform, phrase_transform}
    }
    const part_transform = (part_id) =>  `translate(0, ${(part_id + 0.5) * active_instrument_space})`

    const pulse_delta = 1 / period
    const phase_transform = (phase) => `translate(${(phase + 0.5) * pulse_delta})`

    const res = {
        available_space,
        normalized_gaps,
        instruments,
        view,
        part_space: active_instrument_space,
        circular_part_space: 0.045,
        min_episode_gap: inter_episode_gap,
        min_episode_space,
        episodes: new Map(episodes.flatMap((episode, episode_id) =>
            episode_intervals[episode_id] == undefined ? [] :
            [[episode, {
                episode_id,
                ...episode_intervals[episode_id],
                phrase_arrangement: episode_inner_arrangement[episode_id].phrase_arrangement,
            }]])),
        header: {
            episode_id: view.start_id,
            phrase_arrangement: episode_inner_arrangement[view.start_id].phrase_arrangement,
            space: episode_inner_arrangement[view.start_id].borrowed_space ? episode_inner_arrangement[view.start_id].borrowed_space + min_episode_space * 0.4 : 0
        },
        circle: {
            episode_id: active_episode_id,
            phrase_arrangement: episode_inner_arrangement[active_episode_id].phrase_arrangement
        },
        episode_transform,
        part_transform,
        phase_transform,
        pulse_delta,
        beat_period: {9: 3, 12: 3, 16: 4, 18: 3}[period] || 4
    }

    const res2 = {
        ...res,
        part_arrangement: arrange_parts(res)
    }

    return res2
}

export function arrange_pointer_episodes(episode_arrangement, pointer_last) {
    const {part_space: base_part_space, episode_transform: base_episode_transform,
        available_space, min_episode_gap, min_episode_space, normalized_gaps: gaps,
        episodes: base_episodes} = episode_arrangement
    const zoom = (pointer_last.phase == undefined ? 0 : clamp(16 - pointer_last.phase, 0, 1))

    const episode_inner_arrangement = Array.from(base_episodes).map(([episode, {phrase_arrangement: base_phrase_arrangement, start: episode_start, end: episode_end}]) => {
        const pointer_radius_in_episode = pointer_last.radius != undefined ? pointer_last.radius - episode_start : undefined
        const spaces_ext = base_phrase_arrangement.map(({own_phrase, own_interval: {start, end}}) => {
            const middle = (start + end) / 2
            const offset = 100000 * Math.pow(Math.abs(pointer_radius_in_episode - middle), 4)
            const pointer_zoom = pointer_radius_in_episode == undefined ? 0 : zoom * Math.exp(-offset)
            const empty_zoom = 0.6 * pointer_zoom
            const part_zoom = 0.1 * pointer_zoom
            const part_space = base_part_space * (1 + part_zoom)
            const space = (own_phrase ? own_phrase.parts.length : empty_zoom) * part_space
            return {space, empty_zoom, part_zoom, pointer_zoom}
        })

        const spaces = spaces_ext.map(({space}) => space)

        const phrase_intervals = arrange_intervals_weighted_gaps(spaces, gaps,
            /*available_space*/ 1,
            /*max_free_space*/ 0,
            /*trim*/ true)

        let {shift, prev_end} = base_phrase_arrangement.reduce(
            ({shift, prev_end}, {own_interval: {start, end, height}}, interval_id) => {
                const {start: new_start, end: new_end, height: new_height} = phrase_intervals[interval_id]
                const {end: new_prev_end} = phrase_intervals[interval_id - 1] ?? {}
                if (in_limits(pointer_radius_in_episode, prev_end, start)) {
                    const gap = start - prev_end
                    const new_gap = new_start - new_prev_end
                    shift = prev_end - new_prev_end + (gap - new_gap) * (pointer_radius_in_episode - prev_end) / gap
                } else if (in_limits(pointer_radius_in_episode, start, end)) {
                    shift = start - new_start
                        + (height - new_height) * (pointer_radius_in_episode - start) / height
                }
                prev_end = end
                return {shift, prev_end}
        }, {})

        if (shift == undefined ) {
            shift = prev_end == undefined ? 0 : prev_end - phrase_intervals.at(-1).end
        }

        const phrase_arrangement = base_phrase_arrangement.map((phase_data, interval_id) => ({...phase_data, ...spaces_ext[interval_id], ...phrase_intervals[interval_id]}))

        return {phrase_arrangement, shift}
    })


    // const episode_spaces = Array.from(base_episodes.values()).map(({height, start, end}) => height * Math.max(1, zoom * Math.exp(-2 * Math.abs(pointer_last.radius - (start + end) / 2))))
    const episode_spaces = episode_inner_arrangement.map(({phrase_arrangement}) => phrase_arrangement.at(-1).end)
    const {fit, intervals: episode_intervals} = arrange_intervals(episode_spaces, min_episode_gap, min_episode_space, available_space)
    const episodes = new Map(Array.from(base_episodes).map(
        ([episode, episode_data], ref_episode_id) => [episode, {
            ...episode_data,
            ...episode_intervals[ref_episode_id],
            phrase_arrangement: episode_inner_arrangement[ref_episode_id].phrase_arrangement,
        }]))
    let {shift, prev_end} = Array.from(base_episodes.values()).reduce(
        ({shift, prev_end}, {start, end, height}, episode_id) => {
            if (in_limits(pointer_last.radius, prev_end, start)) {
                const gap = start - prev_end
                const new_gap = episode_intervals[episode_id].start - episode_intervals[episode_id - 1].end
                shift = prev_end - episode_intervals[episode_id - 1].end
                    + (gap - new_gap) * (pointer_last.radius - prev_end) / gap
            } else if (in_limits(pointer_last.radius, start, end)) {
                shift = start - episode_intervals[episode_id].start
                    + (height - episode_intervals[episode_id].height) * (pointer_last.radius - start) / height
                    + episode_inner_arrangement[episode_id].shift
            }
            prev_end = end
            return {shift, prev_end}
        }, {})
    if (shift == undefined ) {
        shift = prev_end == undefined ? 0 : prev_end - episode_intervals.at(-1).end
    }
    const episode_transform = (episode_id) => {
        console.assert(!isNaN(episode_intervals[episode_id].start + shift), {shift, prev_end, episode_inner_arrangement, episode_spaces, episode_intervals})
        // const {episode_transform} = base_episode_transform(episode_id)
        // const {phrase_transform} = base_episode_transform(episode_id)
        const phrase_transform = (phrase_id) =>  `translate(0, ${episode_inner_arrangement[episode_id].phrase_arrangement[phrase_id].start})`
        const episode_transform = `translate(0, ${episode_intervals[episode_id].start + shift})`
        return {episode_transform, phrase_transform}
    }
    return {...episode_arrangement, episode_transform, episodes}
}