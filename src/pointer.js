const max_track_count = 2

export default class Pointer {
    constructor() {
        this.tracks = []
    }

    start(episode_id, phrase_id, part_id, phase, vertical_offset) {
        this.episode_id = episode_id
        this.phrase_id = phrase_id
        this.part_id = part_id
        this.tracks = [{phase, vertical_offset}]
    }

    get phase() {
        return this.get_phase_at(-1)
    }

    get prev_phase() {
        return this.get_phase_at(-2)
    }

    get_phase_at(index) {
        const track = this.tracks.at(index)
        return track && track.phase
    }

    get vertical_offset() {
        const track = this.tracks.at(-1)
        return track && track.vertical_offset
    }

    move_to(phase, vertical_offset) {
        this.tracks.push({phase, vertical_offset})
        while(this.tracks.length > max_track_count) {
            this.tracks.shift()
        }
    }

    stop() {
        this.tracks = []
    }
}