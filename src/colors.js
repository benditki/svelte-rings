const chroma = require("chroma-js")

export function adjust(color, volume) {
    return volume > 0 ? chroma.mix("#eee", color, 0.3 + 0.3 * volume) : "#ddd"
}

export function emphasize(color) {
    return chroma(color).darken().saturate()
} 