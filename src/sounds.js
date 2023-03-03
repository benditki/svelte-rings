import {Howl} from 'howler'

const path = "./sounds/"

class Sound extends Howl {
    constructor(src, volume_factor = 1.0) {
        super({ src: path + src })
        this.volume_factor = volume_factor * 0.5
    }
    play(volume = 1) {
        super.volume(volume * this.volume_factor)
        super.play()
    }
}

export default {
    'beat':             new Sound('beat-wood.mp3', 0.4),
    'beat_high':        new Sound('beat-wood-high.mp3', 0.15),
    'clap':             new Sound('clap.mp3'),
    'shake':            new Sound('shake.mp3', 0.2),
    'dundunba':         new Sound('dundunba.mp3', 0.25),
    'sangban':          new Sound('sangban.mp3', 0.2),
    'sangban_closed':   new Sound('sangban-closed.mp3', 0.2),
    'kenkeni':          new Sound('kenkeni.mp3', 0.2),
    'djembe_slap':      new Sound('djembe-slap.mp3'),
    'djembe_tone':      new Sound('djembe-tone.mp3'),
    'djembe_base':      new Sound('djembe-base.mp3', 0.6),
}