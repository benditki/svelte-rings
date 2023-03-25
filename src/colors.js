const chroma = require("chroma-js")

export function adjust(color, volume) {
    return chroma.mix("rgb(59, 27, 7)", color, volume)
}

export function alternate(color) {
    return chroma(color).brighten(0.6)
}

export function emphasize(color) {
    return chroma(color).darken().saturate()
} 