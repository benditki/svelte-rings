const max_track_count = 2

export default class Pointer {
    constructor() {
        this.tracks = []
    }

    move_to(start, section, radius, episode_id, phrase_id, part_id, phase) {
        // console.log("move_to", start, section, radius, episode_id, phrase_id, part_id, phase)

        const track = {section, radius, episode_id, phrase_id, part_id, phase}

        if (start) {
            this.start = track
            this.stop = undefined
        }

        this.tracks.push(track)
        while(this.tracks.length > max_track_count) {
            this.tracks.shift()
        }
    }

    get last() {
        return this.tracks.at(-1) ?? this.stop
    }

    get phase() {
        return this.get_phase_at(-1)
    }

    get prev_phase() {
        return this.get_phase_at(-2)
    }

    get_phase_at(index) {
        return this.tracks.at(index)?.phase
    }

    get vertical_offset() {
        return 0
    }

    release(cancel) {
        this.stop = cancel ? undefined : this.tracks.at(-1)
        this.tracks = []
        // console.log("release", cancel, this)
    }
}