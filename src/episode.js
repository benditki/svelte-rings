import Phrase from "./phrase.js"

export default class Episode {
    constructor(phrases = [], repeat = 4, off = false, disabled_phrases = []) {
        this.phrases = phrases
        this.repeat = repeat
        this.off = off
        this.disabled_phrases = disabled_phrases
    }
    store() {
        return { repeat: this.repeat.toString(), off: this.off,
            phrases: this.phrases.map(phrase => phrase.store()),
            disabled_phrases: this.disabled_phrases.map(phrase => phrase.store()) }
    }
    load_blocked(loaded) {
        this.off = loaded.off
        this.repeat = +loaded.repeat
        if (this.phrases.length == loaded.phrases.length) {
            this.phrases.forEach((phrase, phrase_id) => phrase.load_blocked(loaded.phrases[phrase_id]))
        }
    } 
    static fromLoaded(loaded, instruments) {
        return new Episode(loaded.phrases.map(loaded_phrase => Phrase.fromLoaded(loaded_phrase, instruments)),
            +loaded.repeat, loaded.off,
            (loaded.disabled_phrases || []).map(loaded_phrase => Phrase.fromLoaded(loaded_phrase, instruments)))
    }
    get instruments() {
        return this.phrases.map(phrase => phrase.instrument)
    }
    get duration_in_parts() {
        return this.repeat * this.longest_phrase
    }
    get longest_phrase() {
        return Math.max(...this.phrases.map(phrase => phrase.parts.length))
    }
    get can_play() {
        return !this.off && this.phrases.length
    }
    clone() {
        return new Episode(this.phrases.map(phrase => phrase.clone()), this.repeat, this.off)
    }
}