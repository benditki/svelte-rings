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

export function arrange_episodes(period, episodes, instrument_order, available_space, active_episode_id, old_view, roi) {
    if (!available_space || isNaN(available_space)) return

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

        const own_phrase_arrangement = episode.phrases.map(phrase => own_phrase_intervals[instruments.indexOf(phrase.instrument)])

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


        return {own_phrase_intervals, own_phrase_arrangement, borrowed_phrases, borrowed_phrase_intervals, combined_phrases, circular_intervals,
            instrument_last_phrase: new Map(instrument_last_phrase)}
    })

    const {intervals: episode_intervals, view} = arrange_intervals_in_view(
            /*spaces*/ episode_inner_arrangement.map(({own_phrase_intervals: intervals}) => intervals.at(-1).end),
            /*header_spaces*/ episode_inner_arrangement.map(({borrowed_phrase_intervals: intervals}) => intervals.at(-1).end ? intervals.at(-1).end + min_episode_space * 0.4 : 0),
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

    return {
        available_space,
        view,
        part_space: active_instrument_space,
        episodes: new Map(episodes.flatMap((episode, episode_id) =>
            episode_intervals[episode_id] == undefined ? [] :
            [[episode, {
                episode_id,
                ...episode_intervals[episode_id],
                borrowed_phrases: episode_inner_arrangement[episode_id].borrowed_phrases,
                phrase_arrangement: episode_inner_arrangement[episode_id].own_phrase_arrangement,
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
        episode_transform,
        part_transform,
        phase_transform,
        pulse_delta
    }
}
