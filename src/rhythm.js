import Episode from "./episode.js"

export default class Rhythm {
    constructor(name, period = 16, episodes = [], accessed = undefined) {
        this.name = name
        this.period = period
        this.episodes = episodes
        this.accessed = accessed
    }
    clone(name) {
        return new Rhythm(name, this.period,
            this.episodes.map(episode => episode.clone()),
            this.accessed)
    }
    touch() {
        this.accessed = Date.now()
    }
    store() {
        return { name: this.name, period: this.period, accessed: this.accessed,
            episodes: this.episodes.map(episode => episode.store()) }
    }
    load_blocked(loaded) {
        this.accessed = loaded.accessed
        if (loaded.episodes.length == this.episodes.length) {
            this.episodes.forEach((episode, episode_id) => episode.load_blocked(loaded.episodes[episode_id]))
        }
    }
    static fromLoaded(loaded, instruments) {
        return new Rhythm(loaded.name, loaded.period,
            loaded.episodes.map(loaded_episode => Episode.fromLoaded(loaded_episode, instruments)),
            loaded.accessed)
    }
    episode_duration(episode_id) {
        return this.period * this.episodes[episode_id].duration_in_parts
    }
    round_duration(episode_id) {
        return this.period * this.episodes[episode_id].longest_phrase
    }
    get total_duration() {
        let res = 0
        for (let episode_id = 0; episode_id < this.episodes.length; episode_id++) {
            res += this.round_duration(episode_id)
        }
        return res
    }
}