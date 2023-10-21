<script>
    import * as symbols from "./symbols"

    export let circular = true
    export let radius = 1.0
    export let dot_shift = 0
    export let width = 0.15
    export let size = 0.4 * width
    export let outline_enlarge = 0
    export let sym = null
    export let pulse_color = "var(--theme-fg)"
    export let outline_color = "var(--theme-bg-more)"
    export let flash_color = undefined
    export let debug = undefined

    function sym_trans(circular, dot_shift) {
        return circular ? `translate(${ + dot_shift})` : `translate(0, ${- dot_shift}) rotate(270)`
    }

    function shape(sym, size) {
        const s2 = size / 2
        if (sym == symbols.QUAD) {
            return `M ${- s2} ${+ s2}` +
                  ` L ${- s2} ${- s2}` +
                  ` L ${+ s2} ${- s2}` +
                  ` L ${+ s2} ${+ s2} Z`

        } else if (sym == symbols.TRIAG) {
            return `M ${- s2} ${+ s2}` +
                  ` L ${- s2} ${- s2}` +
                  ` L ${+ s2 * 1.5} 0 Z`

        } else if (sym == symbols.DOT) {
            return `M ${- s2} 0` +
                  ` A ${+ s2} ${+ s2} 0 1 1 ${+ s2} 0` +
                  ` A ${+ s2} ${+ s2} 0 1 1 ${- s2} 0`

        } else if (sym == symbols.TRAPEZ) {
            return `M ${- s2 * 1.8} ${+ s2 * 0.5}` +
                  ` L ${- s2 * 1.8} ${- s2 * 0.5}` +
                  ` L ${+ s2 * 1.0} ${- s2 * 1.2}` +
                  ` L ${+ s2 * 1.0} ${+ s2 * 1.2} Z`

        } else if (sym == symbols.STUB) {
            return `M ${- s2 * 2} ${+ s2 * 0.4}` +
                  ` L ${- s2 * 2} ${- s2 * 0.4}` +
                  ` L ${+ s2 * 2} ${- s2 * 0.4}` +
                  ` L ${+ s2 * 2} ${+ s2 * 0.4} Z`
        }
    }

    function stroke_width(size, outline_enlarge) {
        return size * 0.14 * (1 + outline_enlarge)
    }
</script>

<g class="sym" transform={sym_trans(circular, dot_shift)}>
    <path fill={pulse_color} d={shape(sym, size)}
        stroke={outline_color} stroke-width={stroke_width(size, outline_enlarge)} data-debug={JSON.stringify({pulse_color, debug})}/>
    {#if flash_color}
    <path fill="none" d={shape(sym, size * 0.55)}
        stroke={flash_color} stroke-width={stroke_width(size, outline_enlarge)}/>
    {/if}
</g>


<style>
.sym {
    pointer-events: none;
}
</style>